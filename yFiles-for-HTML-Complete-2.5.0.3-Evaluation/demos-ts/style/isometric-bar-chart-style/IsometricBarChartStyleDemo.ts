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
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Color,
  GraphComponent,
  GraphMLIOHandler,
  GraphModelManager,
  GraphViewerInputMode,
  ICommand,
  INode,
  License,
  Matrix,
  Rect,
  ShapeNodeStyle,
  Size,
  SolidColorFill
} from 'yfiles'

import {
  addNavigationButtons,
  bindChangeListener,
  bindCommand,
  showApp
} from '../../resources/demo-app'
import AugmentationNodeDescriptor from './AugmentationNodeDescriptor'
import NodeGraphModelManager from './NodeGraphModelManager'
import IsometricWebGLNodeStyle from '../../complete/isometricdrawing/IsometricWebGLNodeStyle'
import { IsometricBarLabelNodeStyle } from './IsometricBarLabelNodeStyle'
import { fetchLicense } from '../../resources/fetch-license'

let graphComponent: GraphComponent

let barDataComboBox: HTMLSelectElement

let barManager: GraphModelManager
let barLabelManager: GraphModelManager

/**
 * Demo that shows how to augment a graph with additional information by displaying
 * isometric bars. The sample graph, which is loaded from a GRAPHML file consists of
 * multiple, already styled nodes which are associated with precomputed centrality values.
 * These values are then used in two additional NodeStyles to display a bar and a label each
 * and added as additional visualization via a custom @link{GraphModelManager}.
 */
async function run(): Promise<void> {
  License.value = await fetchLicense()
  barDataComboBox = document.getElementById('barDataComboBox') as HTMLSelectElement
  addNavigationButtons(barDataComboBox)

  // initialize the GraphComponent and place it in the div with CSS selector #graphComponent
  graphComponent = new GraphComponent('#graphComponent')

  // use an isometric projection and allow fitContent to use a zoom > 1
  graphComponent.projection = Matrix.ISOMETRIC
  graphComponent.limitFitContentZoom = false

  // setup the additional GraphModelManagers to add the isometric bar augmentation to the GraphComponent
  initializeAugmentations()

  // configure interaction
  graphComponent.inputMode = new GraphViewerInputMode()

  // bind the demo buttons to their commands
  registerCommands()

  // Read a sample graph from an embedded resource file
  loadSampleGraph().then(() => {
    // Manages the viewport
    graphComponent.fitGraphBounds()
  })

  // Initialize the demo application's CSS and Javascript for the description
  showApp(graphComponent)
}

/**
 * Enable the isometric bar augmentations and their labels.
 */
function initializeAugmentations() {
  // bars should have a floor space of 10x10 at the node center
  const layoutProvider = (node: INode) => Rect.fromCenter(node.layout.center, new Size(10, 10))

  // bars should be visualized on top of the normal content group
  const barGroup = graphComponent.rootGroup.addGroup()
  barGroup.above(graphComponent.contentGroup)

  // use the layoutProvider and getTagData method to provide render information to the IsometricWebGLNodeStyle
  // which uses WebGL rendering
  const barDescriptor = new AugmentationNodeDescriptor(
    new IsometricWebGLNodeStyle(),
    layoutProvider,
    getTagData
  )
  // the additional GraphModelManager adds the visualization provided by the AugmentationNodeDescriptor
  // to the GraphComponent
  barManager = new NodeGraphModelManager(graphComponent, barGroup, barDescriptor)

  // place the additional labels on top of the bars
  const labelGroup = graphComponent.rootGroup.addGroup()
  labelGroup.above(barGroup)
  // the IsometricBarLabelNodeStyle also uses the layoutProvider and getTagData method to place
  // the label close to the top of the bars
  const barLabelDescriptor = new AugmentationNodeDescriptor(
    new IsometricBarLabelNodeStyle(),
    layoutProvider,
    getTagData
  )
  // add another GraphModelManager for the bar labels that use SVG rendering
  // Note that we could have used just one additional GraphModelManager if both would use the
  // same rendering technique
  barLabelManager = new NodeGraphModelManager(graphComponent, labelGroup, barLabelDescriptor)
}

/**
 * Handles a selection change in the bar data combo box.
 */
function onBarDataChanged() {
  // check if augmentations should be disabled
  const disableBars = barDataComboBox.options[barDataComboBox.selectedIndex].value === 'None'
  // check if augmentations are currently active
  const barManagersActive = barManager.graph != null
  if (disableBars && barManagersActive) {
    // disable the augmentations by uninstalling the additional GraphModelManagers
    barManager.uninstall(graphComponent)
    barLabelManager.uninstall(graphComponent)
  } else if (!disableBars && !barManagersActive) {
    // enable the augmentations by installing the additional GraphModelManagers
    barManager.install(graphComponent, graphComponent.graph)
    barLabelManager.install(graphComponent, graphComponent.graph)
  }
  // update the augmentations
  graphComponent.invalidate()
}

/**
 * Provides the data to be visualized by the bar chart.
 * @yjs:keep = degreeCentrality,graphCentrality,pageRank
 * @param node The node to provide the bar chart data for.
 */
function getTagData(node: INode): any {
  // extract the color used by the style of the node so it can be used as base color for the bar
  const fill = (node.style as ShapeNodeStyle).fill as SolidColorFill
  const color = getColorValues(fill.color)

  // take the selected node info from the node's tag
  // height will be the height of the bar while value is used for the label of the bar
  const key = barDataComboBox.options[barDataComboBox.selectedIndex].value
  switch (key) {
    case 'Degree Centrality':
      return {
        color: color,
        height: round(node.tag.normalizedDegreeCentrality) * 100,
        value: round(node.tag.degreeCentrality)
      }
    case 'Graph Centrality':
      return {
        color: color,
        height: round(node.tag.normalizedGraphCentrality) * 100,
        value: round(node.tag.graphCentrality)
      }
    case 'PageRank':
      return {
        color: color,
        height: round(node.tag.normalizedPageRank) * 100,
        value: round(node.tag.pageRank)
      }
    case 'None':
    default:
      return { color: color, value: 0, height: 0 }
  }
}

/**
 * Shows or hides the labels
 */
function toggleLabels(enabled: boolean) {
  if (barManager.graph != null) {
    if (!enabled) {
      barLabelManager.install(graphComponent, graphComponent.graph)
    } else {
      barLabelManager.uninstall(graphComponent)
    }
    graphComponent.invalidate()
  }
}

/**
 * Extracts the color components to the format used by the IsometricWebGLNodeStyle.
 * @param color The color to get the components for.
 */
function getColorValues(color: Color) {
  return { r: color.r / 255.0, g: color.g / 255.0, b: color.b / 255.0, a: color.a / 255.0 }
}

/**
 * Round the given number to two digits.
 * @param number The number to round.
 */
function round(number: number): number {
  return Math.round(number * 100) / 100
}

/**
 * Reads the sample graph.
 */
async function loadSampleGraph() {
  const graphMLIOHandler = new GraphMLIOHandler()
  await graphMLIOHandler.readFromURL(graphComponent.graph, 'resources/sample.graphml')
}

/**
 * Helper method that binds the various commands available in yFiles for HTML to the buttons
 * in the demo's toolbar.
 */
function registerCommands(): void {
  bindCommand("button[data-command='Open']", ICommand.OPEN, graphComponent)
  bindCommand("button[data-command='Save']", ICommand.SAVE, graphComponent)

  bindCommand("button[data-command='ZoomIn']", ICommand.INCREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='ZoomOut']", ICommand.DECREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='FitContent']", ICommand.FIT_GRAPH_BOUNDS, graphComponent)
  bindCommand("button[data-command='ZoomOriginal']", ICommand.ZOOM, graphComponent, 1.0)

  bindChangeListener("select[data-command='BarDataChanged']", onBarDataChanged)
  bindChangeListener("input[data-command='ToggleShowLabels']", checked =>
    toggleLabels(checked as boolean)
  )
}

// noinspection JSIgnoredPromiseFromCall
run()
