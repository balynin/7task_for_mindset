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
const fs = require('fs-extra')
const path = require('path')

const { optimize } = require('@yworks/optimizer')

const importYfilesRegex = /import\s+([\s\S]*?)\s+from\s+['"]yfiles\/?([^'"]*)['"]/gi
const typeInfoRegex = /<script[^>]*yfiles-typeinfo[^>]*>\s*(?:<\/script>)?/gi

const root = path.join(__dirname, '../../')
const demosRoot = path.join(root, 'demos-js')
const libPath = path.join(root, 'lib/es-modules')

const distRoot = path.join(__dirname, 'dist')

const demoName = process.argv[2]
const demoPath = path.join(demosRoot, demoName)

async function run() {
  await clean()
  await obfuscate()
}

async function obfuscate() {
  const { libInfos, sourceInfos, resourceInfos } = await read()

  resolveImports(sourceInfos)

  const { libModules, sourceFiles } = optimize(libInfos, sourceInfos, {
    blacklist: [],
    logLevel: 'warn'
  })

  write(libModules, sourceFiles, resourceInfos)
}

function resolveImports(sourceInfos) {
  sourceInfos.forEach(file => {
    file.source = file.source.replace(importYfilesRegex, (match, imports) => {
      const relativePath = path
        .relative(path.parse(file.dist).dir, path.join(distRoot, 'lib/es-modules'))
        // on Windows...
        .replace(/\\/g, '/')
      return `import ${imports} from '${relativePath}/yfiles.js'`
    })
  })
}

function clean() {
  return fs.emptyDir(distRoot)
}

async function read() {
  const demoExists = await fs.pathExists(demoPath)
  if (!demoExists) {
    throw new Error(`Demo path ${demoPath} not found`)
  }

  const inputSources = (
    await Promise.all([
      collectFiles(demoPath),
      collectFiles(path.join(demosRoot, 'resources')),
      collectFiles(path.join(demosRoot, 'utils'))
    ])
  ).reduce((a, b) => a.concat(b), [])

  const demoInfos = inputSources.map(f => ({
    path: f,
    dist: path.join(distRoot, path.relative(root, f))
  }))

  const sourceInfos = demoInfos.filter(f => f.path.endsWith('js'))
  sourceInfos.forEach(f => {
    f.source = fs.readFileSync(f.path, 'utf8')
  })
  const resourceInfos = demoInfos.filter(f => !f.path.endsWith('js'))
  resourceInfos.push({
    path: path.join(libPath, 'yfiles.css'),
    dist: path.join(distRoot, 'lib/es-modules/yfiles.css')
  })
  resourceInfos.push({
    path: path.join(root, 'lib/license.json'),
    dist: path.join(distRoot, 'lib/license.json')
  })
  resourceInfos.forEach(f => {
    f.result = fs.readFileSync(f.path, 'utf8')
    if (f.path.endsWith('html')) {
      // remove typeinfo
      f.result = f.result.replace(typeInfoRegex, '')
      // replace css reference
      f.result = f.result.replace(
        /(["'])((?:..\/)*)node_modules\/yfiles\/yfiles\.css["']/,
        '$1$2../lib/es-modules/yfiles.css$1'
      )
    }
  })

  const libInfos = (await collectFiles(libPath))
    .filter(f => f.endsWith('js'))
    .map(f => ({
      source: fs.readFileSync(f, 'utf8'),
      dist: path.join(distRoot, path.relative(root, f))
    }))

  return {
    libInfos,
    sourceInfos,
    resourceInfos
  }
}

function write(libModules, sourceFiles, resourceInfos) {
  for (const libModule of libModules) {
    fs.outputFileSync(libModule.dist, libModule.result)
  }

  for (const sourceFile of sourceFiles) {
    fs.outputFileSync(sourceFile.dist, sourceFile.result)
  }

  for (const resourceInfo of resourceInfos) {
    fs.outputFileSync(resourceInfo.dist, resourceInfo.result)
  }
}

async function collectFiles(dir) {
  const subdirs = await fs.readdir(dir)
  const files = await Promise.all(
    subdirs.map(async subdir => {
      const res = path.resolve(dir, subdir)
      return (await fs.stat(res)).isDirectory() ? collectFiles(res) : res
    })
  )
  return files.reduce((a, f) => a.concat(f), [])
}

run()
