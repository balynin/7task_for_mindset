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
import type { LayoutDescriptor, LayoutGraph } from 'yfiles'
import { LayoutExecutorAsyncWorker, License } from 'yfiles'

const workerSelf = self as unknown as Worker

export function createLayoutExecutorAsyncWorker(
  handler: (graph: LayoutGraph, descriptor: LayoutDescriptor) => Promise<void> | void
): LayoutExecutorAsyncWorker {
  // create a new LayoutExecutor for the web worker
  const executorWorker = new LayoutExecutorAsyncWorker(handler)
  let initialized = false

  // when a message is received..
  workerSelf.addEventListener(
    'message',
    e => {
      if (!initialized) {
        License.value = JSON.parse(e.data)
        workerSelf.postMessage('started')
        initialized = true
      } else {
        // send it to the executor for processing and post the results
        // back to the caller
        executorWorker
          .process(e.data)
          .then(data => workerSelf.postMessage(data))
          .catch(errorObj => workerSelf.postMessage(errorObj))
      }
    },
    false
  )
  return executorWorker
}
