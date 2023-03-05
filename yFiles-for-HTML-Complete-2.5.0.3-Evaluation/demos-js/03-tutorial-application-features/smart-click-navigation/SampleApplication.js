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
  EdgeStyleDecorationInstaller,
  GraphBuilder,
  GraphComponent,
  GraphItemTypes,
  GraphViewerInputMode,
  ICommand,
  IEdge,
  IGraph,
  IModelItem,
  INode,
  ItemClickedEventArgs,
  License,
  NodeStyleDecorationInstaller,
  Point,
  PolylineEdgeStyle,
  ShapeNodeStyle
} from 'yfiles'

import { bindAction, bindCommand, showApp } from '../../resources/demo-app.js'
import GraphBuilderData from './resources/graph.js'
import { applyDemoTheme, initDemoStyles } from '../../resources/demo-styles.js'
import { fetchLicense } from '../../resources/fetch-license.js'

const graphChooserBox = document.getElementById('graphChooserBox')

/** @type {GraphComponent} */
let graphComponent

/**
 * Bootstraps the demo.
 * @returns {!Promise}
 */
async function run() {
  License.value = await fetchLicense()
  graphComponent = new GraphComponent('#graphComponent')
  applyDemoTheme(graphComponent)
  // Conveniently store a reference to the graph that is displayed
  graphComponent.selectionIndicatorManager.enabled = false
  graphComponent.focusIndicatorManager.enabled = false

  // Initializes the input mode
  initializeInputMode()

  // Initializes the highlight style
  initHighlightingStyle(graphComponent.graph)

  // Configures default styles for newly created graph elements
  initTutorialDefaults(graphComponent.graph)

  // Create an initial sample graph
  createSampleGraph()
  graphComponent.fitGraphBounds()

  // Enable the undo engine. This prevents undoing of the graph creation
  graphComponent.graph.undoEngineEnabled = true

  // Bind the buttons to their commands
  registerCommands()

  // Zoom to a node that has "Sport" label
  graphComponent.zoomToAnimated(new Point(1637.468, 1828), 1)

  // Initializes the application's CSS and JavaScript for the description
  showApp(graphComponent)
}

/**
 * Creates the sample graph.
 */
function createSampleGraph() {
  const builder = new GraphBuilder({
    graph: graphComponent.graph,
    nodes: [
      {
        data: GraphBuilderData.nodes,
        id: 'id',
        layout: 'layout',
        labels: ['label']
      }
    ],
    edges: [
      {
        data: GraphBuilderData.edges,
        sourceId: 'source',
        targetId: 'target',
        id: 'id'
      }
    ]
  })

  builder.buildGraph()
}

/**
 * Configures the highlight style that will be used for the nodes that match the searched query.
 * @param {!IGraph} graph The graph.
 */
function initHighlightingStyle(graph) {
  const nodeHighlightStyle = new NodeStyleDecorationInstaller({
    // We choose a shape node style
    nodeStyle: new ShapeNodeStyle({
      shape: 'rectangle',
      stroke: '3px #621B00',
      fill: 'transparent'
    }),
    // With a margin for the decoration
    margins: 7
  })
  graph.decorator.nodeDecorator.highlightDecorator.setImplementation(nodeHighlightStyle)

  const edgeHighlightStyle = new EdgeStyleDecorationInstaller({
    // We choose a shape node style
    edgeStyle: new PolylineEdgeStyle({
      stroke: '3px #621B00'
    })
  })
  graph.decorator.edgeDecorator.highlightDecorator.setImplementation(edgeHighlightStyle)
}

/**
 * Initializes the input mode for this component.
 */
function initializeInputMode() {
  const inputMode = new GraphViewerInputMode()
  inputMode.itemHoverInputMode.hoverItems = GraphItemTypes.NODE || GraphItemTypes.EDGE
  // Implements the smart click navigation
  inputMode.addItemLeftClickedListener((sender, args) => {
    // Zooms to the suitable point
    zoomToLocation(args.item, args.location)
    // Highlights the concerned objects(node or edge with target and source node)
    updateHighlight(args.item)
  })
  graphComponent.inputMode = inputMode
}

/**
 * Zooms to the suitable point.
 * @param {!IModelItem} item The element that we clicked.
 * @param {!Point} currentMouseClickLocation The arguments that is used by the event.
 */
function zoomToLocation(item, currentMouseClickLocation) {
  // Get the point where we should zoom in
  const location = getFocusPoint(item)
  // Check the type of zooming
  const selectedItem = graphChooserBox.options[graphChooserBox.selectedIndex].value
  if (selectedItem === 'Zoom to Mouse Location') {
    // The distance between where we clicked and the viewport center
    const offset = currentMouseClickLocation.subtract(graphComponent.viewport.center)
    // Zooms to the new location of the mouse
    graphComponent.zoomToAnimated(location.subtract(offset), graphComponent.zoom)
  } else {
    graphComponent.zoomToAnimated(location, graphComponent.zoom)
  }
}

/**
 * Gets the focus point.
 * @param {!IModelItem} item The element that we clicked.
 * @returns {?Point} The point that we should zoom to.
 */
function getFocusPoint(item) {
  if (IEdge.isInstance(item)) {
    // If the source and the target node are in the view port, then zoom to the middle point of the edge
    const targetNodeCenter = item.targetNode.layout.center
    const sourceNodeCenter = item.sourceNode.layout.center
    const viewport = graphComponent.viewport
    if (viewport.contains(targetNodeCenter) && viewport.contains(sourceNodeCenter)) {
      return new Point(
        (sourceNodeCenter.x + targetNodeCenter.x) / 2,
        (sourceNodeCenter.y + targetNodeCenter.y) / 2
      )
    } else {
      if (
        viewport.center.subtract(targetNodeCenter).vectorLength <
        viewport.center.subtract(sourceNodeCenter).vectorLength
      ) {
        // If the source node is out of the view port, then zoom to it
        return sourceNodeCenter
      } else {
        // Else zoom to the target node
        return targetNodeCenter
      }
    }
  } else if (INode.isInstance(item)) {
    return item.layout.center
  }
  return null
}

/**
 * Initializes the input mode for this component.
 * @param {!IModelItem} item
 */
function updateHighlight(item) {
  const manager = graphComponent.highlightIndicatorManager
  if (IEdge.isInstance(item)) {
    manager.addHighlight(item)
    manager.addHighlight(item.sourceNode)
    manager.addHighlight(item.targetNode)
  } else if (INode.isInstance(item)) {
    manager.addHighlight(item)
  }

  // clear highlights after one second
  setTimeout(() => {
    manager.clearHighlights()
  }, 1000)
}

/**
 * Initializes the defaults for the styling in this tutorial.
 *
 * @param {!IGraph} graph The graph.
 */
function initTutorialDefaults(graph) {
  // set styles that are the same for all tutorials
  initDemoStyles(graph)
}

/**
 * Binds the various commands available in yFiles for HTML to the buttons in the tutorial's toolbar.
 */
function registerCommands() {
  bindCommand("button[data-command='FitContent']", ICommand.FIT_GRAPH_BOUNDS, graphComponent)
  bindAction("button[data-command='ZoomOriginal']", () => {
    graphComponent.zoomToAnimated(new Point(1637.468, 1828), 1)
  })
}

// noinspection JSIgnoredPromiseFromCall
run()
