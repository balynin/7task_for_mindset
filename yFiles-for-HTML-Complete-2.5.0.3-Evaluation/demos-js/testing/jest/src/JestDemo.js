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
import { fetchLicense } from '../../../resources/fetch-license.js'
import { GraphComponent, GraphViewerInputMode, ICommand, License } from 'yfiles'
import { bindAction, bindCommand, showApp } from '../../../resources/demo-app.js'
import { createEdge, createNode } from './ItemFactory.js'
import { initDemoStyles } from '../../../resources/demo-styles'

async function run() {
  License.value = await fetchLicense()

  const graphComponent = new GraphComponent('graphComponent')
  graphComponent.inputMode = new GraphViewerInputMode()

  graphComponent.fitGraphBounds()

  initDemoStyles(graphComponent.graph)

  registerCommands(graphComponent)

  showApp(graphComponent)
}

/**
 * Wires up the UI.
 */
function registerCommands(graphComponent) {
  bindCommand("button[data-command='ZoomIn']", ICommand.INCREASE_ZOOM, graphComponent, null)
  bindCommand("button[data-command='ZoomOut']", ICommand.DECREASE_ZOOM, graphComponent, null)
  bindCommand("button[data-command='FitContent']", ICommand.FIT_GRAPH_BOUNDS, graphComponent, null)
  bindCommand("button[data-command='ZoomOriginal']", ICommand.ZOOM, graphComponent, 1.0)

  bindAction('#createNodeButton', () => {
    const viewport = graphComponent.viewport
    const x = viewport.x + Math.random() * viewport.width
    const y = viewport.y + Math.random() * viewport.height
    createNode(graphComponent.graph, x, y)
  })
  bindAction('#createEdgeButton', () => createEdge(graphComponent.graph, graphComponent.selection))
}

// noinspection JSIgnoredPromiseFromCall
run()
