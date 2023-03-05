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
import es6ModuleMappings from '../../tools/common/ES6ModuleMappings.json'

const path = require('path')

const es6NameToFqn = {}
const es6NameToImplModule = {}
const es6NameToEsModule = {}

for (const [esModuleName, implModuleMap] of Object.entries(es6ModuleMappings)) {
  for (const [implName, nameMap] of Object.entries(implModuleMap)) {
    for (const [fqn, es6Name] of Object.entries(nameMap)) {
      es6NameToEsModule[es6Name] = esModuleName
      es6NameToImplModule[es6Name] = implName
      es6NameToFqn[es6Name] = fqn
    }
  }
}

es6NameToEsModule.yfiles = 'lang'

export default function transformer(file, api) {
  const j = api.jscodeshift
  const sources = j(file.source)
  let extension = ''

  sources
    .find(j.ImportDeclaration, ({ source }) => source && /yfiles(\.js)?$/i.test(source.value))
    .replaceWith(imp => {
      if (imp.value.source.value.endsWith('.js')) {
        extension = '.js'
      }
      const libBase = path.dirname(imp.value.source.value)
      const mods = {}
      let defaultImport
      const { specifiers } = imp.value
      for (const { imported, local, type } of specifiers) {
        if (type === j.ImportDefaultSpecifier.name) {
          defaultImport = local
        } else {
          const es6Name = imported.name
          const esModuleName = es6NameToEsModule[es6Name]
          if (esModuleName) {
            if (!mods[esModuleName]) {
              mods[esModuleName] = []
            }
            mods[esModuleName].push(j.importSpecifier(imported, local))
          }
        }
      }

      if (
        mods['view-component'] &&
        Object.keys(mods).some(name => /algorithms|layout-.*|router-.*/.test(name)) &&
        !mods['view-layout-bridge']
      ) {
        mods['view-layout-bridge'] = []
      }

      if (defaultImport) {
        const defaultModule = Object.keys(mods)[0] || 'lang'
        if (!mods[defaultModule]) {
          mods[defaultModule] = []
        }
        mods[defaultModule].push(j.importDefaultSpecifier(defaultImport))
      }
      return Object.entries(mods).map(([modName, specifiers]) =>
        j.importDeclaration(specifiers, j.literal(path.posix.join(libBase, modName + extension)))
      )
    })

  return sources.toSource()
}
