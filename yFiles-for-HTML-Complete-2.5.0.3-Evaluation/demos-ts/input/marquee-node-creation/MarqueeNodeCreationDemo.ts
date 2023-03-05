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
import {
  GraphComponent,
  GraphEditorInputMode,
  GraphSnapContext,
  ICommand,
  License,
  Rect
} from 'yfiles'

import { bindCommand, showApp } from '../../resources/demo-app'
import { applyDemoTheme, initDemoStyles } from '../../resources/demo-styles'
import MyMarqueeSelectionInputMode from './MyMarqueeSelectionInputMode'
import { fetchLicense } from '../../resources/fetch-license'

let graphComponent: GraphComponent

async function run(): Promise<void> {
  License.value = await fetchLicense()

  // initialize the graph component
  graphComponent = new GraphComponent('graphComponent')
  applyDemoTheme(graphComponent)

  // initialize the graph
  initializeGraph()

  // initialize the input mode
  graphComponent.inputMode = createEditorMode()

  // center the graph
  graphComponent.fitGraphBounds()

  // register some basic commands
  registerCommands()

  // Initialize the demo application's CSS and Javascript for the description
  showApp(graphComponent)
}

/**
 * Helper method that binds the various commands available in yFiles for HTML to the buttons
 * in the demo's toolbar.
 */
function registerCommands(): void {
  bindCommand("button[data-command='FitContent']", ICommand.FIT_GRAPH_BOUNDS, graphComponent)
  bindCommand("button[data-command='ZoomIn']", ICommand.INCREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='ZoomOut']", ICommand.DECREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='ZoomOriginal']", ICommand.ZOOM, graphComponent, 1.0)
}

function initializeGraph(): void {
  // Set custom style defaults that will be used for newly created graph items
  initDemoStyles(graphComponent.graph)
  createSampleGraph()
}

/**
 * Creates the default input mode for the GraphComponent,
 * a {@link GraphEditorInputMode}.
 * @returns a new GraphEditorInputMode instance
 */
function createEditorMode(): GraphEditorInputMode {
  const mode = new GraphEditorInputMode({
    allowEditLabel: true
  })

  // Initializes snapping for labels and other graph items.
  mode.snapContext = new GraphSnapContext()

  // Setting the custom input mode which handles snapping as well as a custom visualization for the marquee rectangle
  const myMarqueeSelectionInputMode = new MyMarqueeSelectionInputMode()
  // Set to the new input mode the priority of the default marqueeSelectionInputMode
  myMarqueeSelectionInputMode.priority = mode.marqueeSelectionInputMode.priority
  // Add the new input mode to the GraphEditorInputMode
  mode.add(myMarqueeSelectionInputMode)
  // Disable the default marqueeSelectionInputMode
  mode.marqueeSelectionInputMode.enabled = false

  // When a marquee selection is finished, create a new node at the position and size of the marquee rectangle
  myMarqueeSelectionInputMode.addDragFinishingListener((sender, evt) => {
    graphComponent.graph.createNode(evt.rectangle)
  })

  return mode
}

/**
 * Creates the initial sample graph.
 */
function createSampleGraph(): void {
  const graph = graphComponent.graph

  graph.createNode(new Rect(180, 40, 30, 30))
  graph.createNode(new Rect(260, 50, 50, 50))
  graph.createNode(new Rect(284, 200, 50, 30))
}

// noinspection JSIgnoredPromiseFromCall
run()
