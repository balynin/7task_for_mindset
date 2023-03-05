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
/**
 * @param {!string} licenseString
 * @returns {!Promise.<>}
 */
function getWebWorkerMessageHandler(licenseString) {
  // create a new module web worker
  const worker = new Worker(new URL('./layout-worker.ts', import.meta.url), { type: 'module' })
  worker.postMessage(licenseString)

  // helper function that performs the actual message passing to the web worker
  function webWorkerMessageHandler(data) {
    return new Promise(resolve => {
      worker.onmessage = e => resolve(e.data)
      worker.postMessage(data)
    })
  }

  return new Promise((resolve, reject) => {
    worker.onmessage = ev => {
      if (ev.data === 'started') {
        resolve(webWorkerMessageHandler)
      } else {
        reject()
      }
    }
  })
}

/** @type {Promise.<Promise.<Object>>} */
let promise = null

/**
 * @param {!Object} license
 * @returns {!Promise.<Promise.<Object>>}
 */
export function getLayoutExecutorAsyncMessageHandler(license) {
  if (!promise) {
    promise = getWebWorkerMessageHandler(JSON.stringify(license))
  }
  return promise
}
