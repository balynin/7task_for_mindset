const http = require('http')
const https = require('https')
const path = require('path')
const fs = require('fs')

async function fetchLibs (libs, outDir) {
  fs.mkdirSync(outDir, { recursive: true })
  const jsBundles = []
  const cssBundles = []
  for (const url of libs.js) {
    try {
      const contents = await fetchUrl(url)
      jsBundles.push(contents.toString('utf8'))
    } catch (e) {
      console.error(e.message)
    }
  }
  for (const url of libs.css) {
    try {
      let contents = await fetchUrl(url)
      contents = await downloadFonts(contents.toString('utf8'), url, outDir)
      cssBundles.push(contents)
    } catch (e) {
      console.error(e.message)
    }
  }
  fs.writeFileSync(path.join(outDir, 'bundle.js'), jsBundles.join('\n\n'), 'utf8')
  fs.writeFileSync(path.join(outDir, 'bundle.css'), cssBundles.join('\n\n'), 'utf8')
}

async function downloadFonts (cssContents, url, outDir) {
  let awesomeCss = cssContents
  const toDownload = []
  awesomeCss = awesomeCss.replace(/url\(([^)]*\.(?:woff2?|ttf))\)/g, (match, relativeUrl) => {
    const absoluteUrl = new URL(relativeUrl, url).href
    const fontFilename = absoluteUrl.replace(/.*\/(.*)/, '$1')
    toDownload.push({
      url: absoluteUrl,
      dest: path.join(outDir, fontFilename)
    })
    return `url(./${fontFilename})`
  })

  await Promise.all(toDownload.map(({ url, dest }) => {
    return fetchUrl(url).then(fontBuffer => {
      fs.writeFileSync(dest, fontBuffer)
    }).catch(e => console.error(e.message))
  }))
  return awesomeCss
}

/**
 * @param {string} url
 * @returns {Promise<Buffer>}
 */
function fetchUrl (url) {
  console.log(`Downloading ${url}`)
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    let request = client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Downloading ${url} failed with status code ${response.statusCode}`))
        request.destroy()
      } else {
        const data = []
        response.on('data', (chunk) => {
          data.push(chunk)
        }).on('end', () => {
          resolve(Buffer.concat(data))
        })
      }
    }).on('error', (err) => {
      reject(err)
    })
    request.end()
  })
}

module.exports = {
  fetchLibs
}

if (require.main === module) {
  console.log('Fetching libs...')
  const libsJson = process.argv.length > 2 ? process.argv[2] : path.join(__dirname, 'libs.json')
  const outDir = process.argv.length > 3 ? process.argv[3] : path.join(__dirname, '../lib')
  const libs = require(libsJson)

  fetchLibs(libs, outDir).catch(e => {
    console.error(e)
    process.exit(1)
  })
}

