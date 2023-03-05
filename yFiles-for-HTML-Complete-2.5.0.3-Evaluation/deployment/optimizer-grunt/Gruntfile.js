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
const path = require('path')
const { optimize } = require('@yworks/optimizer')

const root = path.join(__dirname, '../../')
const dist = path.join(__dirname, 'dist')

const demoName = 'complete/flowchart'
const libRel = 'lib/es-modules'
const libRoot = path.join(root, libRel)

const typeInfoRegex = /<script[^>]*yfiles-typeinfo[^>]*>\s*(?:<\/script>)?/gi
const importYfilesRegex = /import\s+([\s\S]*?)\s+from\s+['"]yfiles\/?([^'"]*)['"]/g

module.exports = function (grunt) {
  grunt.registerTask('build', ['clean', 'optimize', 'resolveImports:demoFiles', 'copy'])

  grunt.registerMultiTask('optimize', 'Optimize a yFiles for HTML demo.', function () {
    console.log(demoName)

    const options = this.options()

    const files = this.files

    console.log('optimizing', files.length, 'files...')

    for (const file of files) {
      file.source = grunt.file.read(file.src)
    }

    const libFiles = grunt.file.expand(libRoot + '/**/*.js').map(f => ({
      source: grunt.file.read(f),
      dest: path.join(dist, path.relative(root, f))
    }))

    const optimized = optimize(libFiles, files, {
      blacklist: options.blacklist
    })
    console.log('optimized', optimized.sourceFiles.length, 'files')

    libFiles.concat(files).forEach(file => {
      grunt.file.write(file.dest, file.result)
    })
  })

  grunt.registerMultiTask('resolveImports', function () {
    this.files.forEach(file => {
      const src = file.src[0]
      let content = grunt.file.read(src)

      content = content.replace(importYfilesRegex, (match, imports) => {
        const relativePath = path
          .relative(path.parse(src).dir, path.join(dist, 'lib/es-modules'))
          // on Windows...
          .replace(/\\/g, '/')
        return `import ${imports} from '${relativePath}/yfiles.js'`
      })

      grunt.file.write(file.dest, content)
    })
  })

  grunt.initConfig({
    clean: ['dist'],

    optimize: {
      options: {
        blacklist: []
      },

      dist: {
        files: [
          // package demo sources
          {
            expand: true,
            cwd: root,
            src: [`demos-js/${demoName}/**/*.js`, 'demos-js/{resources,utils}/**/*.js'],
            ignore: ['**/node_modules/**'],
            dest: 'dist'
          }
        ]
      }
    },

    resolveImports: {
      demoFiles: {
        files: [
          {
            expand: true,
            cwd: dist,
            src: [`demos-js/${demoName}/**/*.js`, `demos-js/{resources,utils}/**/*.js`],
            dest: 'dist'
          }
        ]
      }
    },

    copy: {
      nonJS: {
        files: [
          {
            cwd: root,
            expand: true,
            src: [`demos-js/${demoName}/**/*`, `demos-js/resources/**/*`],
            dest: 'dist',
            ignore: ['**/node_modules/**', '**/*.js']
          },
          {
            src: libRoot + '/yfiles.css',
            dest: `dist/${libRel}/yfiles.css`
          },
          {
            src: root + 'lib/license.json',
            dest: 'dist/lib/license.json'
          }
        ],
        options: {
          process(content) {
            // replace css reference
            content = content.replace(
              /(["'])((?:..\/)*)node_modules\/yfiles\/yfiles\.css["']/,
              '$1$2../lib/es-modules/yfiles.css$1'
            )
            // remove typeinfo
            return content.replace(typeInfoRegex, '')
          }
        }
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-copy')
}
