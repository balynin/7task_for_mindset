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

module.exports = function (grunt) {
  const src = path.join(__dirname, grunt.option('src') || '../../')
  const root = path.join(__dirname, '../../')
  const dist = path.join(root, 'es5')
  const demosDist = path.join(dist, 'demos-js')

  const umdDemos = ['loading/scriptloading', 'loading/amdloading', 'loading/webworker-umd']

  const dontAddUmdHeaderFiles = [
    `resources/{polyfill.min,unfetch,require,readme-demo-data,readme-demo-support,filesystem-warning}.js`,
    `{${umdDemos.join(',')}}/**/*.js`
  ]

  // exclude these demos from the demos-es5 tasks
  const nonTranspileDemos = [
    'loading/vite/',
    'loading/web-dev-server/',
    'loading/webpack/',
    'loading/webpack-lazy-layout/',
    'loading/webpack-lazy-yfiles/',
    'loading/webpack-webpack/',
    'toolkit/angular/',
    'toolkit/electron/',
    'toolkit/react/',
    'toolkit/react-typescript/',
    'toolkit/svelte/',
    'toolkit/vue2-cli/',
    'toolkit/vue3-cli/',
    'testing/jest/',
    'testing/jest-puppeteer/',
    'testing/wdio/',
    'demo-server'
  ]

  const ignorePaths = [
    'node_modules',
    'dist',
    'build',
    'deploy',
    'test',
    'starter-kits',
    'loading/webworker-modules/',
    'output',
    'typings'
  ]

  grunt.registerTask('demos-es5', 'Converts all demos and tutorials to ES5', [
    'clean:all',
    'copy',
    'replaceImports',
    'replace',
    'babel'
  ])

  grunt.registerTask('replaceImports', () => {
    const re = /from ['"](.*?\/node_modules\/yfiles\/)?yfiles(\.js)?['"];?\s*$/gm

    const jsFiles = grunt.file.expand(`${demosDist}/**/*.js`)
    for (const jsFile of jsFiles) {
      const content = grunt.file.read(jsFile)
      const replacement = path
        .relative(path.dirname(jsFile), path.join(dist, 'lib/es-modules/yfiles.js'))
        .replace(/\\/g, '/')
      const replaced = content.replace(re, `from '${replacement}'`)
      grunt.file.write(jsFile, replaced)
    }
  })

  grunt.initConfig({
    babel: {
      umdDemos: {
        options: {
          presets: [
            [
              '@babel/preset-env',
              {
                modules: false
              }
            ]
          ],
          plugins: ['@babel/plugin-transform-instanceof']
        },
        files: [
          {
            expand: true,
            cwd: demosDist,
            src: dontAddUmdHeaderFiles,
            dest: demosDist
          }
        ]
      },
      demos: {
        options: {
          presets: [
            [
              '@babel/preset-env',
              {
                modules: 'amd'
              }
            ]
          ],
          plugins: ['@babel/plugin-transform-instanceof']
        },
        files: [
          {
            expand: true,
            cwd: demosDist,
            src: ['**/*.js'],
            ignore: [
              '**/{' + ignorePaths.join(',') + '}/**',
              '{' + nonTranspileDemos.join(',') + '}/**',
              ...dontAddUmdHeaderFiles
            ],
            dest: demosDist,
            ext: '.js'
          }
        ]
      },
      lib: {
        options: {
          presets: [
            [
              '@babel/preset-env',
              {
                modules: 'amd'
              }
            ]
          ]
        },
        files: [
          {
            expand: true,
            cwd: dist,
            src: ['lib/es-modules/**/*.js'],
            dest: dist,
            ext: '.js'
          }
        ]
      }
    },

    clean: {
      // Without the 'force' option, this task cannot delete files outside this file's subtree
      options: { force: true },
      // Remove all created files in the destination directories.
      all: [dist]
    },
    copy: {
      dist: {
        cwd: src,
        src: ['demos-js/**', 'lib/**', 'doc/readme-style.css', 'doc/readme-style.js'],
        ignore: ['**/{' + ignorePaths.join(',') + '}/**', '**/*.tgz'],
        dest: dist,
        expand: true
      },

      polyfills: {
        files: {
          [`${demosDist}/resources/unfetch.js`]: './node_modules/unfetch/polyfill/index.js',
          [`${demosDist}/resources/polyfill.min.js`]:
            './node_modules/@babel/polyfill/dist/polyfill.min.js'
        }
      }
    },
    replace: {
      //
      // Add the Babel polyfill after the opening <head> tag
      //
      addPolyfills: {
        src: [dist + '/**/*.html'],
        overwrite: true,
        replacements: [
          {
            from: /(\s*?)(<head[^>]*>)/,
            to: '$2\n$1  <script src="../../resources/polyfill.min.js"></script>\n$1  <script src="../../resources/unfetch.js"></script>\n'
          }
        ]
      },

      removeFilesystemWarning: {
        src: [dist + '/**/*.html'],
        overwrite: true,
        replacements: [
          // Replace <script src="../../resources/filesystem-warning.js"></script>
          {
            from: /<script\s+src=["'](\.\.\/)*resources\/filesystem-warning\.js["'][^>]*>\s*(?:<\/script>)?/gi,
            to: ''
          }
        ]
      },

      cssReferences: {
        src: [dist + '/**/*.html'],
        overwrite: true,
        replacements: [
          {
            from: /(["'])((?:..\/)*)node_modules\/yfiles\/yfiles\.css["']/,
            to: `$1$2../lib/es-modules/yfiles.css$1`
          }
        ]
      },

      requirejs: {
        src: [dist + '/**/*.html'],
        overwrite: true,
        replacements: [
          // Replace <script type="module" src="foo.js"> with <script>require(["foo.js"])</script>
          {
            from: /<script[^>]+type=['"]module['"][^>]*>\s*(<\/script>)?/gi,
            to: match => {
              const fileName = match.replace(/.*src=['"]([^'"]+)['"].*/, '$1')
              return `<script src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.min.js"></script>
<script>require.config({paths: {yfiles: '../../lib/es-modules/'}, waitSeconds: 0});\nrequire(['${fileName}'])</script>`
            }
          }
        ]
      },

      noDefaultImports: {
        src: [`${demosDist}/**/*.js`],
        overwrite: true,
        replacements: [
          {
            from: /export default class (\w+)((?:\s|\S)*)/,
            to: (matchedWord, index, fullText, regexMatches) => {
              const [className, restOfFile] = regexMatches
              if (className === 'extends') {
                return matchedWord
              }
              return `class ${className}${restOfFile}\nexport const yDefaultExport = ${className}`
            }
          },
          {
            from: /export default/,
            to: `export const yDefaultExport =`
          },
          {
            from: /import (\w+)\s*(,\s*\{)?/g,
            to: (matchedWord, index, fullText, regexMatches) => {
              if (regexMatches[0] === 'yfiles') {
                return matchedWord
              }
              let replacement = `import {yDefaultExport as ${regexMatches[0]}`
              replacement += typeof regexMatches[1] !== 'undefined' ? ',' : '} '
              return replacement
            }
          }
        ]
      },

      addPolyfillWebworker: {
        // Remove yfiles-typeinfo reference and add polyfill in WebWorker demo
        src: [demosDist + '/loading/webworker-umd/**/*.js'],
        overwrite: true,
        replacements: [
          {
            from: /(\s*)importScripts\(.*?\)/,
            to: "$1importScripts('../../resources/polyfill.min.js');\n$1importScripts('../../resources/unfetch.js')\n$&;"
          }
        ]
      },

      packageJson: {
        src: [demosDist + '/package.json', demosDist + '/demo-server/package.json'],
        overwrite: true,
        replacements: [
          {
            from: /"start":\s*"node .*server\.js/,
            to: '$& /demos-js/README.html'
          }
        ]
      }
    }
  })

  // Load all grunt tasks listed in package.json, including grunt-yfiles-deployment
  require('load-grunt-tasks')(grunt)
}
