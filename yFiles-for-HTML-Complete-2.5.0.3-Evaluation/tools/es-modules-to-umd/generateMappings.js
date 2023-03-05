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
const fs = require('fs')
const path = require('path')

const yfilesUmdModulesPath = path.join(__dirname, '../../lib/umd')

const deps = new Map()
const amdDependencies = {}
const oldDefine = global.define
let currentModule = null

const isMeta = modulePath => !/\.[\\/]impl/.test(modulePath)

global.define = localDeps => {
  const normalizedDeps = localDeps.map(dep =>
    isMeta(currentModule) ? dep : dep.replace('./', './impl/')
  )
  deps.set(currentModule, normalizedDeps)
  amdDependencies[currentModule] = normalizedDeps
}
global.define.amd = {}

for (const file of fs.readdirSync(yfilesUmdModulesPath)) {
  if (/.js$/.test(file)) {
    currentModule = './' + file.substring(0, file.indexOf('.'))
    require(path.join(yfilesUmdModulesPath, file))
  }
}

// parse impl module dependencies
const implDirPath = path.join(yfilesUmdModulesPath, 'impl')
for (const file of fs.readdirSync(implDirPath)) {
  if (/.js$/.test(file)) {
    currentModule = './impl/' + file.substring(0, file.indexOf('.'))
    require(path.join(implDirPath, file))
  }
}

const map = new Map()

const metaModules = Array.from(deps.keys()).filter(isMeta)

for (const module of metaModules) {
  map.set(module, new Set())
}

function recurse(moduleRoot, module) {
  const localDeps = deps.get(module)
  if (!localDeps) {
    throw new Error('referenced module ' + module + ' not found!')
  }
  for (const dep of localDeps) {
    if (!isMeta(dep)) {
      const set = map.get(moduleRoot)
      set.add(dep)
    }
    recurse(moduleRoot, dep)
  }
}

for (const moduleRoot of metaModules) {
  recurse(moduleRoot, moduleRoot)
}

global.define = oldDefine

const normalized = {}

const normalize = name => name.replace('./', '')

for (const [key, value] of Object.entries(amdDependencies)) {
  normalized[normalize(key)] = value.map(normalize)
}

fs.writeFileSync(path.join(__dirname, 'amd-mappings.json'), JSON.stringify(normalized, null, 2))
