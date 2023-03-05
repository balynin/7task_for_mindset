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
import { getLayoutExecutorAsyncMessageHandler } from './web-worker-client-message-handler.js'
import licenseData from 'license'
import { GraphComponent, HierarchicLayoutData, LayoutExecutorAsync } from 'yfiles'

/**
 * Creates the button used for the layout and configures the layout algorithm.
 * @param {!HTMLButtonElement} button The HTMLNButtonElement that has to be bind with the layout command
 * @param {!GraphComponent} graphComponent The input graphComponent
 */
export function addLayoutButton(button, graphComponent) {
  button.addEventListener('click', runLayout)
  getLayoutExecutorAsyncMessageHandler(licenseData).then(() => button.removeAttribute('disabled'))

  /**
   * Runs the layout using the hierarchic layout algorithm and an asynchronous layout executor.
   */
  async function runLayout() {
    button.setAttribute('disabled', 'disabled')
    // configure layout algorithm options ...
    const layoutDescriptor = {
      name: 'HierarchicLayout',
      properties: { nodeToNodeDistance: 20 }
    }

    const layoutData = new HierarchicLayoutData()
    // configure graph specific options ...

    // create an asynchronous layout executor that calculates a layout on the worker
    const executor = new LayoutExecutorAsync({
      messageHandler: await getLayoutExecutorAsyncMessageHandler(licenseData),
      graphComponent: graphComponent,
      layoutDescriptor: layoutDescriptor,
      layoutData: layoutData,
      animateViewport: true,
      easedAnimation: true,
      duration: '1s'
    })

    // run the layout
    await executor.start()
    button.removeAttribute('disabled')
  }
}
