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
import es6ModuleMappings from '../common/ES6ModuleMappings.json'
import amdDependencies from './amd-mappings.json'

const path = require('path')

const requirePaths = {
  yfiles: '../../../lib/umd/',
  utils: '../../utils/',
  resources: '../../resources/'
}

const map = {}
const es6NameToFqn = {}
const es6NameToImplModule = {}

for (const implModuleMap of Object.values(es6ModuleMappings)) {
  for (const [implName, nameMap] of Object.entries(implModuleMap)) {
    for (const [fqn, es6Name] of Object.entries(nameMap)) {
      es6NameToImplModule[es6Name] = implName
      es6NameToFqn[es6Name] = fqn
    }
  }
}

const yfilesEs6ModulesPath = path.join(__dirname, '../../lib/es-modules')
for (const module of Object.keys(es6ModuleMappings)) {
  for (const submodule of Object.keys(es6ModuleMappings[module])) {
    for (const clazz of Object.keys(es6ModuleMappings[module][submodule])) {
      map[clazz] = [
        `${yfilesEs6ModulesPath}/${module}.js`,
        es6ModuleMappings[module][submodule][clazz]
      ]
    }
  }
}

// omit impl and too generic modules
const metaModuleMappings = Object.entries(amdDependencies).filter(
  ([m, d]) => !m.startsWith('impl') && m !== 'complete' && m !== 'view' && m !== 'layout'
)
const reverseAmdDeps = {}

// reverse AMD dependencies to find out where each module is included
for (const [metaModuleName, dependencies] of metaModuleMappings) {
  for (const dep of dependencies) {
    if (!reverseAmdDeps[dep]) {
      reverseAmdDeps[dep] = []
    }
    if (!reverseAmdDeps[dep].includes(metaModuleName)) {
      reverseAmdDeps[dep].push(metaModuleName)
    }
  }
}

function calculateYfilesRequires(yFilesImports) {
  const implModules = new Set()

  // collect required impl modules
  for (const [imported, local] of Object.entries(yFilesImports)) {
    const impl = es6NameToImplModule[imported]
    if (impl) {
      implModules.add('impl/' + impl)
    } else {
      console.log(`Could not find ${imported} in any module.`)
    }
  }

  // preliminary result consists of the required impl modules
  let result = Array.from(implModules)
  let changed = true
  while (changed && result.length > 1) {
    changed = false
    // collect all modules where one of the result modules is included
    const candidates = [].concat(...result.map(d => reverseAmdDeps[d])).filter(c => c)
    if (!candidates.length) {
      break
    }
    // count duplicates for each candidate
    const counts = candidates.reduce((acc, val) => {
      if (!acc[val]) {
        acc[val] = 0
      }
      acc[val] += 1
      return acc
    }, {})
    // sort by number of duplicates
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    const [maybeBetterModule, duplicateCount] = sorted[0]
    // see if at least two of the required modules are included
    if (duplicateCount > 1) {
      changed = true
      // remove modules that are included in the module we are adding now
      const amdDependency = amdDependencies[maybeBetterModule]
      result = result.filter(module => !amdDependency.includes(module))
      result.push(maybeBetterModule)
    }
  }
  // eliminate impls
  result = result.map(mod => {
    if (mod.startsWith('impl')) {
      // choose smallest meta module
      const metaModules = reverseAmdDeps[mod]
      metaModules.sort((a, b) => amdDependencies[a].length - amdDependencies[b].length)
      mod = metaModules[0]
    }
    return mod
  })

  // deduplicate
  result = Array.from(new Set(result))

  return result
}

function calculateOtherRequires(j, otherImports, isMainFile) {
  const sideEffectRequires = []
  const requires = {}
  const namedImportMap = {}
  for (const imp of otherImports) {
    let from = imp.source.value
    if (isMainFile && from.startsWith('./')) {
      from = from.substring(2)
    } else {
      from = from.replace(/\.js$/i, '')
    }
    const matchingRequirePath = Object.entries(requirePaths).find(([, path]) =>
      from.startsWith(path)
    )
    if (matchingRequirePath) {
      from = from.replace(matchingRequirePath[1], matchingRequirePath[0] + '/')
      if (from.endsWith('license')) {
        from += '-umd'
      }
    }
    if (imp.specifiers.length === 0) {
      sideEffectRequires.push(from)
    } else {
      const defaultImport = imp.specifiers.find(
        ({ type }) => type === j.ImportDefaultSpecifier.name
      )
      const namespaceImport = imp.specifiers.find(
        ({ type }) => type === j.ImportNamespaceSpecifier.name
      )
      const namedImports = imp.specifiers
        .filter(({ type }) => type === j.ImportSpecifier.name)
        .map(spec => spec.local.name)
      let moduleImportName
      if (defaultImport) {
        moduleImportName = defaultImport.local.name
      } else if (namespaceImport) {
        moduleImportName = namespaceImport.local.name
      } else {
        const parts = from.split('/')
        moduleImportName = parts[parts.length - 1].replace(/\W+(\w)/g, (match, $1) =>
          $1.toLocaleUpperCase()
        )
      }
      requires[from] = moduleImportName
      if (!namedImportMap[moduleImportName]) {
        namedImportMap[moduleImportName] = []
      }
      // we might have multiple import statements due to the splitting of re-exports
      namedImportMap[moduleImportName].push(...namedImports)
    }
  }
  return {
    sideEffectRequires,
    requires,
    namedImportMap
  }
}

function transformNamedExports(j, sources) {
  const namedExports = []
  sources.find(j.ExportNamedDeclaration).replaceWith(path => {
    const decl = path.value.declaration
    if (!decl) {
      // just `export { foo }`
      namedExports.push(...path.value.specifiers.map(spec => spec.exported.name))
      return []
    }
    if (decl.type === j.ClassDeclaration.name || decl.type === j.FunctionDeclaration.name) {
      namedExports.push(decl.id.name)
    } else if (decl.type === j.VariableDeclaration.name) {
      for (const varDecl of decl.declarations) {
        namedExports.push(varDecl.id.name)
      }
    }
    if (path.value.comments) {
      decl.comments = path.value.comments
    }
    return decl
  })
  return namedExports
}

function transformImports(j, sources) {
  const yfilesImports = {}
  const otherImports = []

  sources
    .find(j.ImportDeclaration)
    .forEach(imp => {
      const { source, specifiers } = imp.value
      if (source.value.includes('yfiles')) {
        for (const { imported, local } of specifiers) {
          if (imported && imported.name !== 'yfiles') {
            yfilesImports[imported.name] = local.name
          }
        }
      } else {
        otherImports.push(imp.value)
      }
    })
    .remove()

  return { yfilesImports, otherImports }
}

function splitReExports(j, sources) {
  sources.find(j.ExportNamedDeclaration, { declaration: null }).replaceWith(path => {
    const reExport = path.value
    const imp = j.importDeclaration(
      reExport.specifiers.map(spec => j.importSpecifier(spec.exported, spec.local)),
      reExport.source
    )
    const exportOnly = j.exportNamedDeclaration(null, reExport.specifiers)
    return [imp, exportOnly]
  })
}

export default function transformer(file, api) {
  const j = api.jscodeshift
  const sources = j(file.source)

  const defaultDeclaration = sources.find(j.ExportDefaultDeclaration)
  const hasDefaultExport = defaultDeclaration.size() === 1
  const hasImports = sources.find(j.ImportDeclaration).size() === 0
  const hasNamedExports = sources.find(j.ExportNamedDeclaration).size() === 0

  if (hasImports && hasNamedExports && !hasDefaultExport) {
    // no need to transform anything
    return
  }

  splitReExports(j, sources)
  const { yfilesImports, otherImports } = transformImports(j, sources)
  const yFilesRequires = calculateYfilesRequires(yfilesImports)
  const { sideEffectRequires, requires, namedImportMap } = calculateOtherRequires(
    j,
    otherImports,
    hasDefaultExport || hasNamedExports
  )
  const namedExports = transformNamedExports(j, sources)

  let defaultExportIdentifierName = 'Default'

  defaultDeclaration.replaceWith(path => {
    let decl = path.value.declaration
    if (decl.type === j.VariableDeclaration.name) {
      defaultExportIdentifierName = decl.declarations[0].id.name
      return decl
    } else if (decl.type === j.ClassDeclaration.name) {
      if (decl.id) {
        // class declaration has name
        defaultExportIdentifierName = decl.id.name
        return decl
      } else {
        // anonymous class declaration -> transform to class expression
      }
      decl = j.classExpression(decl.id, decl.body, decl.superClass)
    } else if (decl.type === j.FunctionDeclaration.name) {
      defaultExportIdentifierName = decl.id.name
      return decl
    }
    return j.variableDeclaration('const', [j.variableDeclarator(j.identifier('Default'), decl)])
  })

  sources.find(j.Program).replaceWith(path => {
    const hasNamedExports = namedExports.length > 0
    let factoryBody = path.node.body
    let defineReturnValue

    if (hasNamedExports) {
      defineReturnValue = j.objectExpression(
        namedExports.map(ex => j.property('init', j.literal(ex), j.identifier(ex)))
      )
    }

    if (hasDefaultExport) {
      if (defineReturnValue) {
        defineReturnValue = j.callExpression(
          j.memberExpression(j.identifier('Object'), j.identifier('assign')),
          [j.identifier(defaultExportIdentifierName), defineReturnValue]
        )
      } else {
        defineReturnValue = j.identifier(defaultExportIdentifierName)
      }
    }

    if (defineReturnValue) {
      factoryBody = factoryBody.concat(j.returnStatement(defineReturnValue))
    }

    const factoryArgs = Object.values(requires).map(j.identifier)
    if (yFilesRequires.length) {
      if (yFilesRequires.length === 1 && yFilesRequires[0] === 'lang') {
        factoryArgs.push(
          j.objectPattern([j.propertyPattern(j.identifier('yfiles'), j.identifier('yfiles'))])
        )
      } else {
        factoryArgs.push(j.identifier('yfiles'))
      }
    }
    const factory = j.arrowFunctionExpression(factoryArgs, j.blockStatement(factoryBody))
    const dependencies = Object.keys(requires)
      .map(j.literal)
      .concat(yFilesRequires.map(dep => j.literal('yfiles/' + dep)))
      .concat(sideEffectRequires.map(j.literal))

    const programBody = [
      j.expressionStatement(
        j.callExpression(j.identifier(defineReturnValue ? 'define' : 'require'), [
          j.arrayExpression(dependencies),
          factory
        ])
      )
    ]

    if (!hasNamedExports && !hasDefaultExport) {
      programBody.unshift(
        j(
          `require.config({ paths: { ${Object.entries(requirePaths)
            .map(([name, path]) => `${name}: '${path}'`)
            .join(',\n')} }})`
        ).get().node.program.body[0]
      )
    }

    return j.program(programBody)
  })

  const localYfilesImports = Object.values(yfilesImports)

  sources
    .find(j.Identifier, ({ name }) => localYfilesImports.includes(name))
    .replaceWith(path => {
      const fqn = es6NameToFqn[path.value.name]
      if (!fqn) {
        return j.identifier(path.value.name)
      }
      const parts = fqn.split('.')
      const result = parts.reduce((left, right) => {
        if (typeof left === 'string') {
          left = j.identifier(left)
        }
        return j.memberExpression(left, j.identifier(right))
      })
      return result
    })

  const localOtherImports = [].concat(...Object.values(namedImportMap))

  sources
    .find(j.Identifier, ({ name }) => localOtherImports.includes(name))
    .replaceWith(path => {
      const { name } = path.value
      const [ns] = Object.entries(namedImportMap).find(([, imps]) => imps.includes(name))
      return j.memberExpression(j.identifier(ns), j.identifier(name))
    })

  return sources.toSource()
}
