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
  DefaultEdgePathCropper,
  Fill,
  GraphBuilder,
  GraphComponent,
  GraphViewerInputMode,
  ICommand,
  IGraph,
  INodeInsetsProvider,
  Insets,
  License,
  ShapeNodeStyle,
  Size,
  Stroke
} from 'yfiles'
import { bindCommand, showApp } from '../../resources/demo-app'
import type { ColorSetName } from '../../resources/demo-styles'
import {
  colorSets,
  createDemoEdgeStyle,
  createDemoNodeLabelStyle
} from '../../resources/demo-styles'
import { createFeatureLayoutConfiguration } from './CompactDiskGroups'
import { fetchLicense } from '../../resources/fetch-license'

async function run(): Promise<void> {
  License.value = await fetchLicense()
  const graphComponent = new GraphComponent('#graphComponent')
  graphComponent.inputMode = new GraphViewerInputMode()

  // initialize the styles of the graph items to look good for the compact disk layout example
  initializeStyleDefaults(graphComponent.graph)

  // load the sample graph
  await loadSampleGraph(graphComponent.graph)

  // configure and apply the layout to the graph
  const { layout, layoutData } = createFeatureLayoutConfiguration(graphComponent.graph)
  await graphComponent.morphLayout(layout, '0s', layoutData)

  registerCommands(graphComponent)
  showApp(graphComponent)
}

/**
 * Initializes the style defaults for the graph so that it uses round nodes and group nodes
 * for the purpose of this tutorial.
 */
function initializeStyleDefaults(graph: IGraph) {
  // initialize the basic style of the graph items
  const normalNodeTheme = 'demo-palette-91'

  // define a round style for normal nodes
  graph.nodeDefaults.style = new ShapeNodeStyle({
    fill: colorSets[normalNodeTheme].fill,
    stroke: `1.5px ${colorSets[normalNodeTheme].stroke}`,
    shape: 'ellipse'
  })
  graph.nodeDefaults.shareStyleInstance = false

  // define default size of nodes and an edge style
  graph.nodeDefaults.size = new Size(50, 50)
  graph.edgeDefaults.style = createDemoEdgeStyle({
    colorSetName: normalNodeTheme,
    showTargetArrow: false
  })
  graph.decorator.portDecorator.edgePathCropperDecorator.setImplementation(
    new DefaultEdgePathCropper({ cropAtPort: false, extraCropLength: 2 })
  )

  // also define a round style for group nodes
  graph.groupNodeDefaults.style = new ShapeNodeStyle({
    fill: 'white',
    stroke: `5px ${colorSets[normalNodeTheme].stroke}`,
    shape: 'ellipse'
  })

  // add additional insets to the round group nodes to avoid that content may be outside, since
  // the layout algorithms internally always use rectangular group node bounds
  graph.decorator.nodeDecorator.insetsProviderDecorator.setImplementation(
    node => graph.isGroupNode(node),
    INodeInsetsProvider.create(() => new Insets(20))
  )
}

/**
 * Loads the sample graph from the json file.
 * @yjs:keep = nodeList,edgeList
 */
async function loadSampleGraph(graph: IGraph): Promise<void> {
  // fetch the sample data
  const response = await fetch('sample.json')
  const data = await response.json()

  // use the graph builder to create the graph items from the sample data
  const builder = new GraphBuilder(graph)

  // define source and creation options for nodes and group nodes
  const nodesSource = builder.createNodesSource({
    data: data.nodeList.filter((node: any) => !node.isGroup),
    id: 'id',
    tag: 'tag',
    layout: 'layout',
    parentId: 'parent'
  })
  builder.createGroupNodesSource({
    data: data.nodeList.filter((node: any) => node.isGroup),
    id: 'id',
    tag: 'tag',
    layout: 'layout',
    parentId: 'parent'
  })

  // for nodes with a node type stored in the tag, add a label and change the color
  nodesSource.nodeCreator.addNodeCreatedListener((sender, evt) => {
    const node = evt.item
    if (node.tag && node.tag.nodeType) {
      let palette: ColorSetName
      if (node.tag.nodeType === 'C') {
        palette = 'demo-palette-94'
      } else if (node.tag.nodeType === 'B') {
        palette = 'demo-palette-93'
      } else {
        palette = 'demo-palette-92'
      }

      // change color of node depending on node type value
      const style = node.style as ShapeNodeStyle
      style.fill = Fill.from(colorSets[palette].fill)
      style.stroke = Stroke.from(`1.5px ${colorSets[palette].stroke}`)

      // add a label reflecting the node type
      graph.addLabel({
        owner: node,
        text: node.tag.nodeType,
        style: createDemoNodeLabelStyle(palette)
      })
    }
  })

  // define source for creation of edges
  builder.createEdgesSource({
    data: data.edgeList,
    id: 'id',
    tag: 'tag',
    sourceId: 'source',
    targetId: 'target'
  })

  // build the graph
  builder.buildGraph()
}

/**
 * Binds the various actions to the buttons in the toolbar.
 */
function registerCommands(graphComponent: GraphComponent): void {
  bindCommand("button[data-command='ZoomIn']", ICommand.INCREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='ZoomOut']", ICommand.DECREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='FitContent']", ICommand.FIT_GRAPH_BOUNDS, graphComponent)
  bindCommand("button[data-command='ZoomOriginal']", ICommand.ZOOM, graphComponent, 1.0)
}

// noinspection JSIgnoredPromiseFromCall
run()
