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
  EventRecognizers,
  GraphComponent,
  GraphEditorInputMode,
  GraphItemTypes,
  HandlePositions,
  IGraph,
  IReshapeHandleProvider,
  IReshapeHandler,
  License,
  MutableRectangle,
  NodeReshapeHandleProvider,
  Rect
} from 'yfiles'
import { showApp } from '../../resources/demo-app.js'
import LimitingRectangleDescriptor from './LimitingRectangleDescriptor.js'
import PurpleNodeReshapeHandleProvider from './PurpleNodeReshapeHandleProvider.js'
import {
  ApplicationState,
  ClickableNodeReshapeHandleProvider
} from './ClickableNodeReshapeHandleProvider.js'
import {
  applyDemoTheme,
  createDemoNodeLabelStyle,
  createDemoNodeStyle
} from '../../resources/demo-styles.js'
import { fetchLicense } from '../../resources/fetch-license.js'

/**
 * Registers a callback function as a decorator that provides a customized
 * {@link IReshapeHandleProvider} for each node.
 * This callback function is called whenever a node in the graph is queried
 * for its {@link IReshapeHandleProvider}. In this case, the 'node'
 * parameter will be set to that node.
 * @param {!IGraph} graph The given graph
 * @param {!Rect} boundaryRectangle The rectangle that limits the node's size.
 */
function registerReshapeHandleProvider(graph, boundaryRectangle) {
  const nodeDecorator = graph.decorator.nodeDecorator

  // deactivate reshape handling for the red node
  nodeDecorator.reshapeHandleProviderDecorator.hideImplementation(node => node.tag === 'red')

  // return customized reshape handle provider for the orange, blue and green node
  nodeDecorator.reshapeHandleProviderDecorator.setFactory(
    node =>
      node.tag === 'orange' ||
      node.tag === 'blue' ||
      node.tag === 'green' ||
      node.tag === 'purple' ||
      node.tag === 'darkblue' ||
      node.tag === 'gold',
    node => {
      // Obtain the tag from the node
      const nodeTag = node.tag

      // Create a default reshape handle provider for nodes
      const reshapeHandler = node.lookup(IReshapeHandler.$class)
      let provider = new NodeReshapeHandleProvider(node, reshapeHandler, HandlePositions.BORDER)

      // Customize the handle provider depending on the node's color
      if (nodeTag === 'orange') {
        // Restrict the node bounds to the boundaryRectangle
        provider.maximumBoundingArea = boundaryRectangle
      } else if (nodeTag === 'green') {
        // Show only handles at the corners and always use aspect ratio resizing
        provider.handlePositions = HandlePositions.CORNERS
        provider.ratioReshapeRecognizer = EventRecognizers.ALWAYS
      } else if (nodeTag === 'blue') {
        // Restrict the node bounds to the boundaryRectangle and
        // show only handles at the corners and always use aspect ratio resizing
        provider.maximumBoundingArea = boundaryRectangle
        provider.handlePositions = HandlePositions.CORNERS
        provider.ratioReshapeRecognizer = EventRecognizers.ALWAYS
      } else if (nodeTag === 'purple') {
        provider = new PurpleNodeReshapeHandleProvider(node, reshapeHandler)
      } else if (nodeTag === 'darkblue') {
        provider.handlePositions = HandlePositions.SOUTH_EAST
        provider.centerReshapeRecognizer = EventRecognizers.ALWAYS
      } else if (nodeTag === 'gold') {
        provider = new ClickableNodeReshapeHandleProvider(node, reshapeHandler, applicationState)
      }
      return provider
    }
  )
}

/** @type {ApplicationState} */
let applicationState

/**
 * @returns {!Promise}
 */
async function run() {
  License.value = await fetchLicense()
  // initialize the GraphComponent
  const graphComponent = new GraphComponent('graphComponent')
  applyDemoTheme(graphComponent)
  const graph = graphComponent.graph

  // Create a default editor input mode
  const graphEditorInputMode = new GraphEditorInputMode({
    // Just for user convenience: disable node, edge creation and clipboard operations,
    allowCreateEdge: false,
    allowCreateNode: false,
    allowClipboardOperations: false,
    movableItems: GraphItemTypes.NONE
  })

  applicationState = new ApplicationState(graphEditorInputMode, true)

  // and enable the undo feature.
  graph.undoEngineEnabled = true

  // Finally, set the input mode to the graph component.
  graphComponent.inputMode = graphEditorInputMode

  // Create the rectangle that limits the movement of some nodes
  // and add it to the graphComponent.
  const boundaryRectangle = new MutableRectangle(20, 20, 480, 550)
  graphComponent.backgroundGroup.addChild(boundaryRectangle, new LimitingRectangleDescriptor())

  registerReshapeHandleProvider(graph, boundaryRectangle.toRect())

  createSampleGraph(graph)

  showApp(graphComponent)
}

/**
 * Creates the sample graph of this demo.
 * @param {!IGraph} graph The input graph
 */
function createSampleGraph(graph) {
  createNode(graph, 80, 100, 140, 30, 'demo-red', 'red', 'Fixed size')
  createNode(graph, 300, 100, 140, 30, 'demo-green', 'green', 'Keep aspect ratio')
  createNode(graph, 80, 200, 140, 50, 'demo-blue', 'darkblue', 'Keep center')
  createNode(graph, 300, 200, 140, 50, 'demo-purple', 'purple', 'Keep aspect ratio\nat corners')
  createNode(graph, 80, 310, 140, 30, 'demo-orange', 'orange', 'Limited to rectangle')
  createNode(
    graph,
    300,
    300,
    140,
    50,
    'demo-lightblue',
    'blue',
    'Limited to rectangle\nand keep aspect ratio'
  )
  createNode(
    graph,
    80,
    400,
    140,
    50,
    'demo-palette-510',
    'gold',
    'Keep Aspect ratio\ndepending on state'
  )

  // clear undo after initial graph loading
  graph.undoEngine.clear()
}

/**
 * Creates a sample node for this demo.
 * @param {!IGraph} graph The given graph
 * @param {number} x The node's x-coordinate
 * @param {number} y The node's y-coordinate
 * @param {number} w The node's width
 * @param {number} h The node's height
 * @param {!ColorSetName} colorSet The color set that defines the node color
 * @param {!string} tag The tag to identify the reshape handler
 * @param {!string} labelText The nodes label's text
 */
function createNode(graph, x, y, w, h, colorSet, tag, labelText) {
  const node = graph.createNode({
    layout: new Rect(x, y, w, h),
    style: createDemoNodeStyle(colorSet),
    tag: tag
  })

  graph.addLabel({
    owner: node,
    text: labelText,
    style: createDemoNodeLabelStyle(colorSet)
  })
}

// noinspection JSIgnoredPromiseFromCall
run()
