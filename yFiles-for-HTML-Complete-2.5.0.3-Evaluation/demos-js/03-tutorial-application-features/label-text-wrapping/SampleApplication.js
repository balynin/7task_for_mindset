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
  DefaultLabelStyle,
  EdgePathLabelModel,
  EdgeSides,
  ExteriorLabelModel,
  ExteriorLabelModelPosition,
  Font,
  GraphComponent,
  GraphEditorInputMode,
  ICommand,
  IGraph,
  InteriorStretchLabelModel,
  InteriorStretchLabelModelPosition,
  License,
  Rect,
  RectangleNodeStyle,
  ShapeNodeStyle,
  Size
} from 'yfiles'

import { bindAction, bindCommand, showApp } from '../../resources/demo-app.js'
import { applyDemoTheme, initDemoStyles } from '../../resources/demo-styles.js'
import { fetchLicense } from '../../resources/fetch-license.js'

/** @type {GraphComponent} */
let graphComponent

/**
 * Bootstraps the demo.
 * @returns {!Promise}
 */
async function run() {
  License.value = await fetchLicense()
  // initialize graph component
  graphComponent = new GraphComponent('#graphComponent')
  applyDemoTheme(graphComponent)
  graphComponent.inputMode = new GraphEditorInputMode({
    allowGroupingOperations: true
  })
  graphComponent.graph.undoEngineEnabled = true

  // configures default styles for newly created graph elements
  initTutorialDefaults(graphComponent.graph)

  // Configure default label model parameters for newly created graph elements
  setDefaultLabelLayoutParameters()

  // add a sample graph
  createGraph()

  // bind the buttons to their commands
  registerCommands()

  // initialize the application's CSS and JavaScript for the description
  showApp(graphComponent)
}

/**
 * Sets up default label model parameters for graph elements.
 * Label model parameters control the actual label placement as well as the available
 * placement candidates when moving the label interactively.
 */
function setDefaultLabelLayoutParameters() {
  // Use a label model that stretches the label over the full node layout, with small insets. The label style
  // is responsible for drawing the label in the given space. Depending on its implementation, it can either
  // ignore the given space, clip the label at the width or wrapping the text.
  // See the createGraph function where labels are added with different style options.
  const centerLabelModel = new InteriorStretchLabelModel({ insets: 5 })
  graphComponent.graph.nodeDefaults.labels.layoutParameter = centerLabelModel.createParameter(
    InteriorStretchLabelModelPosition.CENTER
  )
}

/**
 * Initializes the defaults for the styling in this tutorial.
 *
 * @param {!IGraph} graph The graph.
 */
function initTutorialDefaults(graph) {
  // set styles that are the same for all tutorials
  initDemoStyles(graph)

  // set sizes and locations specific for this tutorial
  graph.nodeDefaults.size = new Size(40, 40)
  graph.nodeDefaults.labels.layoutParameter = new ExteriorLabelModel({
    insets: 5
  }).createParameter('south')
  graph.edgeDefaults.labels.layoutParameter = new EdgePathLabelModel({
    distance: 5,
    autoRotation: true
  }).createRatioParameter({ sideOfEdge: EdgeSides.BELOW_EDGE })
}

/**
 * Creates a simple sample graph.
 */
function createGraph() {
  // label model and style for the description labels north of the node
  const northLabelModel = new ExteriorLabelModel({ insets: 10 })
  const northParameter = northLabelModel.createParameter(ExteriorLabelModelPosition.NORTH)
  const northLabelStyle = new DefaultLabelStyle({
    horizontalTextAlignment: 'center'
  })
  const graph = graphComponent.graph
  const defaultNodeStyle = graph.nodeDefaults.style

  // create nodes
  const node1 = graph.createNode(new Rect(0, 0, 190, 200))
  const node2 = graph.createNode(new Rect(250, -150, 190, 200))
  const node3 = graph.createNode(new Rect(250, 150, 190, 200))
  const node4 = graph.createNode(new Rect(500, -150, 190, 200))
  const node5 = graph.createNode(new Rect(500, 150, 190, 200))
  const node6 = graph.createNode(
    new Rect(750, -150, 190, 200),
    new ShapeNodeStyle({
      shape: 'hexagon',
      fill: defaultNodeStyle.fill,
      stroke: defaultNodeStyle.stroke
    })
  )
  const node7 = graph.createNode(
    new Rect(750, 150, 190, 200),
    new ShapeNodeStyle({
      shape: 'triangle2',
      fill: defaultNodeStyle.fill,
      stroke: defaultNodeStyle.stroke
    })
  )
  const node8 = graph.createNode(
    new Rect(1000, 150, 190, 200),
    new ShapeNodeStyle({
      shape: 'ellipse',
      fill: defaultNodeStyle.fill,
      stroke: defaultNodeStyle.stroke
    })
  )
  const node9 = graph.createNode(
    new Rect(1000, -150, 190, 200),
    new ShapeNodeStyle({
      shape: 'octagon',
      fill: defaultNodeStyle.fill,
      stroke: defaultNodeStyle.stroke
    })
  )

  // use a label model that stretches the label over the full node layout, with small insets
  const centerLabelModel = new InteriorStretchLabelModel({ insets: 5 })
  const centerParameter = centerLabelModel.createParameter(InteriorStretchLabelModelPosition.CENTER)

  // maybe showcase right-to-left text direction
  const rtlDirection = document.getElementById('trl-toggle').checked

  // the text that should be displayed
  const longText = rtlDirection
    ? 'סעיף א. כל בני אדם נולדו בני חורין ושווים בערכם ובזכויותיהם. כולם חוננו בתבונה ובמצפון, לפיכך חובה עליהם לנהוג איש ברעהו ברוח של אחוה.'
    : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n' +
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n \n' +
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\n' +
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
  const font = new Font({ fontSize: 16 })

  // A label that does not wrap at all. By default, it is clipped at the given bounds, though this can also be
  // disabled with the clipText property of the DefaultLabelStyle.
  const noWrappingStyle = new DefaultLabelStyle({
    font,
    wrapping: 'none',
    verticalTextAlignment: 'center',
    horizontalTextAlignment: rtlDirection ? 'right' : 'left'
  })
  graph.addLabel(node1, longText, centerParameter, noWrappingStyle)
  graph.addLabel(node1, 'No Wrapping', northParameter, northLabelStyle)

  // A label that is wrapped at word boundaries.
  const wordWrappingStyle = new DefaultLabelStyle({
    font,
    wrapping: 'word',
    verticalTextAlignment: 'center',
    horizontalTextAlignment: rtlDirection ? 'right' : 'left'
  })
  graph.addLabel(node2, longText, centerParameter, wordWrappingStyle)
  graph.addLabel(node2, 'Word Wrapping', northParameter, northLabelStyle)

  // A label that is wrapped at single characters.
  const characterWrappingStyle = new DefaultLabelStyle({
    font,
    wrapping: 'character',
    verticalTextAlignment: 'center',
    horizontalTextAlignment: rtlDirection ? 'right' : 'left'
  })
  graph.addLabel(node3, longText, centerParameter, characterWrappingStyle)
  graph.addLabel(node3, 'Character Wrapping', northParameter, northLabelStyle)

  // A label that is wrapped at word boundaries but also renders ellipsis if there is not enough space.
  const ellipsisWordWrappingStyle = new DefaultLabelStyle({
    font,
    wrapping: 'word-ellipsis',
    verticalTextAlignment: 'center',
    horizontalTextAlignment: rtlDirection ? 'right' : 'left'
  })
  graph.addLabel(node4, longText, centerParameter, ellipsisWordWrappingStyle)
  graph.addLabel(node4, 'Word Wrapping\nwith Ellipsis', northParameter, northLabelStyle)

  // A label that is wrapped at single characters but also renders ellipsis if there is not enough space.
  const ellipsisCharacterWrappingStyle = new DefaultLabelStyle({
    font,
    wrapping: 'character-ellipsis',
    verticalTextAlignment: 'center',
    horizontalTextAlignment: rtlDirection ? 'right' : 'left'
  })
  graph.addLabel(node5, longText, centerParameter, ellipsisCharacterWrappingStyle)
  graph.addLabel(node5, 'Character Wrapping\nwith Ellipsis', northParameter, northLabelStyle)

  // A label that is wrapped at word boundaries but uses a hexagon shape to fit the text inside.
  // The textWrappingShape can be combined with any wrapping and the textWrappingPadding is kept
  // empty inside this shape.
  const wordHexagonShapeStyle = new DefaultLabelStyle({
    font,
    wrapping: 'word',
    verticalTextAlignment: 'center',
    horizontalTextAlignment: rtlDirection ? 'right' : 'left',
    textWrappingShape: 'hexagon',
    textWrappingPadding: 5
  })
  graph.addLabel(node6, longText, centerParameter, wordHexagonShapeStyle)
  graph.addLabel(node6, 'Word Wrapping\nat Hexagon Shape', northParameter, northLabelStyle)

  // A label that is wrapped at single characters inside a triangular shape.
  const characterEllipsisTriangleShapeStyle = new DefaultLabelStyle({
    font,
    wrapping: 'character-ellipsis',
    verticalTextAlignment: 'center',
    horizontalTextAlignment: rtlDirection ? 'right' : 'left',
    textWrappingShape: 'triangle2',
    textWrappingPadding: 5
  })
  graph.addLabel(node7, longText, centerParameter, characterEllipsisTriangleShapeStyle)
  graph.addLabel(node7, 'Character Wrapping\nat Triangle Shape', northParameter, northLabelStyle)

  // A label that is wrapped at single characters inside an elliptic shape.
  // In addition to the textWrappingPadding some insets are defined for the top and bottom side
  // to keep the upper and lower part of the ellipse empty.
  const characterEllipsisEllipseShapeStyle = new DefaultLabelStyle({
    font,
    wrapping: 'character-ellipsis',
    verticalTextAlignment: 'center',
    horizontalTextAlignment: rtlDirection ? 'right' : 'left',
    textWrappingShape: 'ellipse',
    textWrappingPadding: 5,
    insets: [40, 0, 40, 0]
  })
  graph.addLabel(node8, longText, centerParameter, characterEllipsisEllipseShapeStyle)
  graph.addLabel(
    node8,
    'Character Wrapping\nat Ellipse Shape\nwith Top/Bottom Insets',
    northParameter,
    northLabelStyle
  )

  // A label that is wrapped at word boundaries inside an octagon shape.
  // In addition to the textWrappingPadding some insets are defined for the top and bottom side
  // to keep the upper and lower part of the octagon empty.
  const wordEllipsisOctagonShapeStyle = new DefaultLabelStyle({
    font,
    wrapping: 'word-ellipsis',
    verticalTextAlignment: 'center',
    horizontalTextAlignment: rtlDirection ? 'right' : 'left',
    textWrappingShape: 'octagon',
    textWrappingPadding: 5,
    insets: [40, 0, 40, 0]
  })
  graph.addLabel(node9, longText, centerParameter, wordEllipsisOctagonShapeStyle)
  graph.addLabel(
    node9,
    'Word Wrapping\nat Octagon Shape\nwith Top/Bottom Insets',
    northParameter,
    northLabelStyle
  )

  graph.undoEngine.clear()
  graphComponent.fitGraphBounds()
}

/**
 * Rebuilds the demo when the text direction changes.
 */
function reinitializeDemo() {
  graphComponent.cleanUp()
  const gcContainer = document.getElementById('graphComponent')
  while (gcContainer.childElementCount > 0) {
    gcContainer.removeChild(gcContainer.firstElementChild)
  }
  graphComponent = new GraphComponent('#graphComponent')
  applyDemoTheme(graphComponent)
  graphComponent.inputMode = new GraphEditorInputMode({
    allowGroupingOperations: true
  })
  graphComponent.graph.undoEngineEnabled = true
  initTutorialDefaults(graphComponent.graph)
  setDefaultLabelLayoutParameters()
  createGraph()
}

/**
 * Binds the various commands available in yFiles for HTML to the buttons in the tutorial's toolbar.
 */
function registerCommands() {
  bindAction("button[data-command='New']", () => {
    graphComponent.graph.clear()
    ICommand.FIT_GRAPH_BOUNDS.execute(null, graphComponent)
  })
  bindCommand("button[data-command='Cut']", ICommand.CUT, graphComponent)
  bindCommand("button[data-command='Copy']", ICommand.COPY, graphComponent)
  bindCommand("button[data-command='Paste']", ICommand.PASTE, graphComponent)
  bindCommand("button[data-command='FitContent']", ICommand.FIT_GRAPH_BOUNDS, graphComponent)
  bindCommand("button[data-command='ZoomOriginal']", ICommand.ZOOM, graphComponent, 1.0)
  bindCommand("button[data-command='Undo']", ICommand.UNDO, graphComponent)
  bindCommand("button[data-command='Redo']", ICommand.REDO, graphComponent)
  bindCommand("button[data-command='GroupSelection']", ICommand.GROUP_SELECTION, graphComponent)
  bindCommand("button[data-command='UngroupSelection']", ICommand.UNGROUP_SELECTION, graphComponent)
  bindAction('#trl-toggle', () => {
    const gcContainer = document.getElementById('graphComponent')
    gcContainer.style.direction = document.getElementById('trl-toggle').checked ? 'rtl' : 'ltr'
    reinitializeDemo()
  })
}

// noinspection JSIgnoredPromiseFromCall
run()
