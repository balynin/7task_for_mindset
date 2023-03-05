/****************************************************************************
 ** @license
 ** This demo file is part of yFiles for HTML 2.5.0.3.
 ** Copyright (c) 2000-2023 by yWorks GmbH, Vor dem Kreuzberg 28,
 ** 72070 Tuebingen, Germany. All rights reserved.
 **
 ** yFiles demo files exhibit yFiles for HTML functionalities. Any redistribution
 ** of demo files in source code or binary form, with or without
 ** modification, is not permitted.
 **
 ** Owners of a valid software license for a yFiles for HTML version that this
 ** demo is shipped with are allowed to use the demo source code as basis
 ** for their own yFiles for HTML powered applications. Use of such programs is
 ** governed by the rights and conditions as set out in the yFiles for HTML
 ** license agreement.
 **
 ** THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESS OR IMPLIED
 ** WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 ** MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN
 ** NO EVENT SHALL yWorks BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 ** SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 ** TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 ** PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 ** LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 ** NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 ** SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 **
 ***************************************************************************/
import mapping from '../common/ES6ModuleMappings.json'

const map = {}
const yfilesEs6ModulesPath = '../../../lib/es-modules'
Object.keys(mapping).forEach(module => {
  Object.keys(mapping[module]).forEach(submodule => {
    Object.keys(mapping[module][submodule]).forEach(clazz => {
      map[clazz] = [`${yfilesEs6ModulesPath}/${module}.js`, mapping[module][submodule][clazz]]
    })
  })
})

export default function transformer(file, api) {
  const j = api.jscodeshift
  const yfilesImports = {}
  let importsAdded = false

  // replace fully qualified yFiles names in comments
  // has to happen separately
  const preSource = j(file.source)
    .find(j.Comment)
    .forEach(comment => {
      comment.value.value = comment.value.value.replace(
        /yfiles\.(\w+)\.(\w+)/g,
        (match, namespace, type) => {
          const key = `yfiles.${namespace}.${type}`
          const entry = map[key]
          if (entry) {
            const [importPath, es6Name] = entry
            importsAdded = true
            if (yfilesImports[importPath]) {
              if (!yfilesImports[importPath].includes(es6Name)) {
                yfilesImports[importPath].push(es6Name)
              }
            } else {
              yfilesImports[importPath] = [es6Name]
            }
            return es6Name
          } else {
            return match
          }
        }
      )
    })
    .toSource()

  const sources = j(preSource)

  // remove use strict
  sources
    .find(j.ExpressionStatement, { expression: { type: 'Literal', value: 'use strict' } })
    .remove()

  // remove eslint-disable global-require
  sources.find(j.Node).forEach(n => {
    const comments = n.value.comments
    if (comments) {
      n.value.comments = comments.filter(
        comment => !comment.value.match(/^\s*eslint-disable(-next-line)?\s*global-require\s*$/g)
      )
    }
  })

  // unwrap define call
  sources
    .find(j.CallExpression, {
      callee: { name: 'define' },
      arguments: [
        { type: 'ArrayExpression' },
        { type: 'ArrowFunctionExpression', body: { type: t => t !== 'BlockStatement' } }
      ]
    })
    .replaceWith(path => {
      return j.exportDeclaration(true, path.node.arguments[1].body)
    })

  // marks nodes that should get exports
  function markForExport(path, name, tag) {
    if (!name) return
    const binding = path
      .closest(j.Expression, {
        type: t => t === 'ArrowFunctionExpression' || t === 'FunctionExpression'
      })
      .get()
      .scope.getBindings()[name][0]
    if (binding) {
      j(binding)
        .closest(j.Declaration)
        .forEach(declaration => {
          if (declaration.value.type === 'VariableDeclaration') {
            declaration.node.declarations.forEach(d => {
              if (d.id.name === name) {
                d.shouldExport = tag
              }
            })
          }
          declaration.node.shouldExport = tag
        })
    }
  }

  // add export to all values in return-statement of define and remove the return-statement
  const defines = sources.find(j.CallExpression, { callee: { name: 'define' } })
  defines.forEach(definePath => {
    j(definePath)
      .find(j.ReturnStatement, { argument: { type: 'Identifier' } })
      .filter(p => j(p).closest(j.Function).get().parentPath.parentPath === definePath)
      .forEach(rs => markForExport(j(rs), rs.node.argument.name, 'default'))
      .remove()
  })
  defines.forEach(definePath => {
    const returnObject = j(definePath)
      .find(j.ReturnStatement, { argument: { type: 'ObjectExpression' } })
      .filter(p => j(p).closest(j.Function).get().parentPath.parentPath === definePath)

    let findExported = true
    returnObject.forEach(rs => {
      j(rs)
        .find(j.Property)
        .forEach(pr => {
          if (pr.value.value.type !== 'Identifier') {
            findExported = false
          }
        })
    })

    if (findExported) {
      returnObject
        .forEach(rs =>
          j(rs)
            .find(j.Property)
            .forEach(pr => markForExport(j(pr), pr.node.value.name, 'name'))
        )
        .remove()
    } else {
      // return with
      returnObject.replaceWith(path => {
        return j.exportDeclaration(true, path.node.argument)
      })
    }
  })
  sources.find(j.Declaration, { shouldExport: x => x }).replaceWith(p => {
    if (p.node.type === 'VariableDeclaration') {
      const result = []
      const oldDeclarations = []
      p.node.declarations.forEach(declaration => {
        if (declaration.shouldExport === 'default') {
          oldDeclarations.push(j.variableDeclarator(declaration.id, declaration.init))
          result.push(j.exportDeclaration(true, declaration.id))
        } else if (declaration.shouldExport === 'name') {
          result.push(
            j.exportDeclaration(
              false,
              j.variableDeclaration(p.node.kind, [
                j.variableDeclarator(declaration.id, declaration.init)
              ])
            )
          )
        } else {
          oldDeclarations.push(j.variableDeclarator(declaration.id, declaration.init))
        }
      })
      if (oldDeclarations.length > 0) {
        result.unshift(j.variableDeclaration(p.node.kind, oldDeclarations))
      }
      result[0].comments = p.node.comments
      delete p.node.comments
      return result
    } else {
      const result = j.exportDeclaration(p.node.shouldExport === 'default', p.node)
      result.comments = p.node.comments
      delete p.node.comments
      return result
    }
  })

  // extract paths from require.config and remove it
  const paths = {
    yfiles: '../../../lib/es-modules/',
    utils: '../../utils/',
    resources: '../../resources/'
  }
  const requireConfig = sources.find(j.ExpressionStatement, {
    expression: {
      callee: {
        type: 'MemberExpression',
        object: {
          type: 'Identifier',
          name: 'require'
        },
        property: {
          type: 'Identifier',
          name: 'config'
        }
      }
    }
  })
  requireConfig.find(j.Property, { key: { name: 'paths' } }).forEach(property => {
    property.value.value.properties.forEach(prop => {
      if (!prop.key.name.startsWith('yfiles')) {
        paths[prop.key.name] = prop.value.value
      }
    })
  })
  requireConfig.remove()

  // collect parameters from require/define to later add import-statements
  const imports = new Map()
  const params = new Map()
  const requireExpressions = sources.find(j.CallExpression, {
    callee: { type: 'Identifier', name: n => n === 'define' || n === 'require' },
    arguments: [
      { type: 'ArrayExpression' },
      { type: t => t === 'ArrowFunctionExpression' || t === 'FunctionExpression' }
    ]
  })
  requireExpressions.forEach(path => {
    const requireArray = path.node.arguments[0].elements.map(p => p.value)
    const requireParams =
      path.node.arguments.length < 2 ? [] : path.node.arguments[1].params.map(p => p.name)

    requireArray.forEach((val, i) => {
      if (i < requireParams.length) {
        params.set(requireParams[i], val)
      } else {
        imports.set(val, { type: 'module' })
      }
    })
  })

  // replace require/define with the body of its arrow-function parameter
  // MUST be done before identifiers are handled to exclude the identifiers for the require-parameters
  let sortedSources = []
  sources
    .find(j.ExpressionStatement, {
      expression: {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: n => n === 'define' || n === 'require' },
        arguments: [
          { type: 'ArrayExpression' },
          { type: t => t === 'ArrowFunctionExpression' || t === 'FunctionExpression' }
        ]
      }
    })
    .forEach(call => {
      sortedSources.push(call)
    })
  // sort sources to handle inner require-statements first
  sortedSources = sortedSources.sort((p1, p2) => {
    const block1 = p1.value.expression.arguments[1].body
    const block2 = p2.value.expression.arguments[1].body
    const start1 = block1.start
    const end1 = block1.end
    const start2 = block2.start
    const end2 = block2.end
    if (end1 < start2 || (start1 > start2 && end1 < end2)) {
      return -1
    } else if (end2 < start2 || (start2 > start1 && end2 < end1)) {
      return 1
    }
    return 0
  })
  sortedSources.forEach(path => {
    if (path.value.expression.arguments[0].elements.every(value => value.type === 'Literal')) {
      const firstExpression = path.value.expression.arguments[1].body.body[0]
      if (firstExpression) {
        firstExpression.comments = path.value.comments
      }
      delete path.value.comments
      j(path).replaceWith(path.value.expression.arguments[1].body.body)
    }
  })

  // add (default-)imports for the require/define-parameters
  // require/define and its parameters MUST be removed before
  sources
    .find(j.Identifier, { type: 'Identifier', name: n => params.has(n) && n !== 'yfiles' })
    .forEach(p => {
      const type = p.parentPath.node.type
      const moduleName = p.node.name
      const modulePath = params.get(moduleName)
      if (
        type === 'MemberExpression' &&
        (!imports.has(modulePath) || imports.get(modulePath).type === 'member')
      ) {
        const name = p.parentPath.node.property.name
        if (imports.has(modulePath)) {
          const names = imports.get(modulePath).name
          if (!names.includes(name)) {
            names.push(name)
          }
        } else {
          imports.set(modulePath, { name: [name], type: 'member' })
        }
      } else {
        if (moduleName !== 'DemoStyles') {
          imports.set(modulePath, { name: [moduleName], type: 'default' })
        } else {
          imports.set(modulePath, { name: [moduleName], type: 'all' })
        }
      }
    })

  // replace namespace-identifier for require/define-params that are converted to member-imports
  sources
    .find(j.MemberExpression, {
      object: {
        type: 'Identifier',
        name: n => {
          return (
            params.has(n) &&
            n !== 'yfiles' &&
            imports.get(params.get(n)) &&
            imports.get(params.get(n)).type === 'member'
          )
        }
      }
    })
    .replaceWith(node => node.node.property)

  // add the new imports that are retrieved from require/define
  const body = sources.find(j.Program).nodes()[0].body
  imports.forEach((val, key) => {
    if (key && !key.startsWith('yfiles')) {
      let modulePath
      if (key.endsWith('.js')) {
        if (!key.match(/^(.{0,2}\/)/)) {
          modulePath = j.literal(`./${key}`)
        } else {
          modulePath = j.literal(key)
        }
      } else {
        const index = key.indexOf('/')
        const prefix = key.substring(0, index)
        if (paths[prefix]) {
          modulePath = j.literal(`${paths[prefix]}${key.substring(index + 1)}.js`)
        } else {
          modulePath = j.literal(`${key}.js`)
        }
      }

      let importSpecifierArray
      if (val.type === 'default') {
        importSpecifierArray = [j.importDefaultSpecifier(j.identifier(`${val.name[0]}`))]
      } else if (val.type === 'member') {
        importSpecifierArray = [j.importSpecifier(j.identifier(`${val.name}`))]
      } else if (val.type === 'all') {
        importSpecifierArray = [j.importDefaultSpecifier(j.identifier(`* as ${val.name[0]}`))]
      } else {
        importSpecifierArray = []
      }

      body.unshift(j.importDeclaration(importSpecifierArray, modulePath))
    }
  })

  const variableMapping = new Map()
  sources
    .find(j.VariableDeclarator, {
      init: {
        type: 'MemberExpression',
        object: { object: { name: 'yfiles' } }
      }
    })
    .forEach(p => {
      variableMapping.set(p.value.id.name, p.value.init)
    })
    .remove()
  sources.find(j.MemberExpression, { object: { name: n => variableMapping.has(n) } }).forEach(p => {
    p.value.object = variableMapping.get(p.node.object.name)
  })

  // replace yfiles-namespaces and add imports
  sources
    .find(j.MemberExpression, {
      object: {
        type: 'MemberExpression',
        property: { type: 'Identifier' },
        object: { type: 'Identifier', name: 'yfiles' }
      }
    })
    .forEach(path => {
      const key = 'yfiles.' + path.node.object.property.name + '.' + path.node.property.name
      const entry = map[key]
      if (entry) {
        const [importPath, es6Name] = entry
        importsAdded = true
        if (yfilesImports[importPath]) {
          if (yfilesImports[importPath].indexOf(es6Name) < 0) {
            yfilesImports[importPath].push(es6Name)
          }
        } else {
          yfilesImports[importPath] = [es6Name]
        }
        j(path).replaceWith(j.identifier(es6Name))
      }
    })
  if (importsAdded) {
    sources.find(j.Program).forEach(path => {
      Object.keys(yfilesImports).forEach(key =>
        path.node.body.unshift(
          j.importDeclaration(
            yfilesImports[key].map(name => j.importSpecifier(j.identifier(name))),
            j.literal(key)
          )
        )
      )
    })
  }

  const jsDocImports = []

  sources.find(j.Node).forEach(path => {
    const comments = path.node.comments
    if (comments) {
      for (const comment of comments) {
        const matches = comment.value.match(/yfiles\.\w+\.\w+/g)
        if (matches) {
          for (const match of matches) {
            jsDocImports.push(match.replace(/yfiles\.\w+\./, ''))
          }
        }
      }
    }
  })

  // combine imports from yFiles to a single import statement from 'yfiles'
  const allSpecifiers = []
  sources
    .find(j.ImportDeclaration, { source: { value: v => v.includes('es-modules') } })
    .forEach(imp => {
      const { specifiers } = imp.value
      specifiers.forEach(s => {
        allSpecifiers.push(s)
      })
    })
    .remove()
  for (const sp of jsDocImports) {
    allSpecifiers.push(j.importSpecifier(j.identifier(sp)))
  }

  // deduplicate
  const uniqueSpecifiers = []
  for (const sp of allSpecifiers) {
    if (!uniqueSpecifiers.some(s => s.imported.name === sp.imported.name)) {
      uniqueSpecifiers.push(sp)
    }
  }

  if (uniqueSpecifiers.length > 0) {
    sources.find(j.Program).forEach(path => {
      uniqueSpecifiers.sort((s1, s2) => {
        const v1 = s1.imported.name
        const v2 = s2.imported.name
        if (v1 < v2) {
          return -1
        } else if (v1 > v2) {
          return 1
        }
        return 0
      })
      path.node.body.unshift(j.importDeclaration(uniqueSpecifiers, j.literal('yfiles')))
    })
  }

  return sources.toSource()
}
