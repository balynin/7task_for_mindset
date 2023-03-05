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
  GraphComponent,
  GraphEditorInputMode,
  ICommand,
  IGraph,
  IInputMode,
  INode,
  INodeStyle,
  InteriorLabelModel,
  License,
  NodeStylePortStyleAdapter,
  Point,
  ShapeNodeStyle,
  Size,
  SmartEdgeLabelModel
} from 'yfiles'

import { bindAction, bindCommand, showApp } from '../../resources/demo-app.js'
import LabelStyleDecorator from './LabelStyleDecorator.js'
import EdgeStyleDecorator from './EdgeStyleDecorator.js'
import NodeStyleDecorator from './NodeStyleDecorator.js'
import { applyDemoTheme, initDemoStyles } from '../../resources/demo-styles.js'
import { fetchLicense } from '../../resources/fetch-license.js'

/**
 * @returns {!Promise}
 */
async function run() {
  License.value = await fetchLicense()

  const graphComponent = new GraphComponent('graphComponent')
  applyDemoTheme(graphComponent)

  graphComponent.inputMode = createInputMode()

  configureGraph(graphComponent.graph)

  createSampleGraph(graphComponent.graph)
  graphComponent.fitGraphBounds()

  registerCommands(graphComponent)

  showApp(graphComponent)
}

/**
 * Creates an input mode that supports interactive editing like e.g. creating new nodes and edges or
 * editing labels.
 * @returns {!IInputMode}
 */
function createInputMode() {
  const geim = new GraphEditorInputMode({
    allowEditLabel: true
  })

  // set a random traffic value to edges created interactively
  geim.createEdgeInputMode.addEdgeCreatedListener((source, args) => {
    switch (Math.floor(Math.random() * 4)) {
      case 0:
        args.item.tag = 'TRAFFIC_VERY_HIGH'
        break
      case 1:
        args.item.tag = 'TRAFFIC_HIGH'
        break
      case 2:
        args.item.tag = 'TRAFFIC_NORMAL'
        break
      case 3:
      default:
        args.item.tag = 'TRAFFIC_LOW'
        break
    }
  })

  return geim
}

/**
 * Configures default styles for nodes and edges.
 * @param {!IGraph} graph
 */
function configureGraph(graph) {
  initDemoStyles(graph)

  graph.nodeDefaults.style = new NodeStyleDecorator(newBaseStyle(), 'resources/workstation.svg')
  graph.nodeDefaults.size = new Size(80, 40)

  graph.edgeDefaults.style = new EdgeStyleDecorator(
    new NodeStylePortStyleAdapter({
      nodeStyle: new ShapeNodeStyle({
        fill: 'lightgray',
        stroke: null,
        shape: 'ellipse'
      }),
      renderSize: [5, 5]
    })
  )

  graph.nodeDefaults.labels.style = new LabelStyleDecorator(
    new DefaultLabelStyle({ textFill: '224556', backgroundFill: '#B4DBED' })
  )
  graph.nodeDefaults.labels.layoutParameter = InteriorLabelModel.CENTER

  graph.edgeDefaults.labels.style = new LabelStyleDecorator(new DefaultLabelStyle())
  graph.edgeDefaults.labels.layoutParameter = new SmartEdgeLabelModel().createDefaultParameter()
}

/**
 * Creates the sample graph of this demo.
 * @param {!IGraph} graph The graph to which nodes and edges are added
 */
function createSampleGraph(graph) {
  graph.clear()

  const baseStyle = newBaseStyle()

  graph.createNodeAt({
    location: new Point(0, 0),
    style: new NodeStyleDecorator(baseStyle, 'resources/switch.svg'),
    tag: 'Root',
    labels: ['Root']
  })
  addNode(graph, 120, -50, baseStyle, 'Switch')
  addNode(graph, -130, 60, baseStyle, 'Switch')
  addNode(graph, 95, -180, baseStyle, 'Scanner')
  addNode(graph, 240, -110, baseStyle, 'Printer')
  addNode(graph, 200, 50, baseStyle, 'Workstation')
  addNode(graph, -160, -60, baseStyle, 'Printer')
  addNode(graph, -260, 40, baseStyle, 'Scanner')
  addNode(graph, -200, 170, baseStyle, 'Workstation')
  addNode(graph, -50, 160, baseStyle, 'Workstation')

  const nodes = graph.nodes.toArray()

  addEdge(graph, nodes[0], nodes[1], 'TRAFFIC_VERY_HIGH')
  addEdge(graph, nodes[0], nodes[2], 'TRAFFIC_HIGH')
  addEdge(graph, nodes[1], nodes[3], 'TRAFFIC_HIGH')
  addEdge(graph, nodes[1], nodes[4], 'TRAFFIC_NORMAL')
  addEdge(graph, nodes[1], nodes[5], 'TRAFFIC_HIGH')
  addEdge(graph, nodes[2], nodes[6], 'TRAFFIC_LOW')
  addEdge(graph, nodes[2], nodes[7], 'TRAFFIC_LOW')
  addEdge(graph, nodes[2], nodes[8], 'TRAFFIC_NORMAL')
  addEdge(graph, nodes[2], nodes[9], 'TRAFFIC_LOW')

  // add some bends
  for (const edge of graph.edges) {
    const sp = edge.sourcePort
    const tp = edge.targetPort
    graph.addBend(edge, sp.location.add(tp.location).multiply(0.5))
  }
}

/**
 * Creates a new node style instance that is used as the base style or decorated style for
 * the NodeStyleDecorator instances created in this demo.
 * @returns {!INodeStyle}
 */
function newBaseStyle() {
  return new ShapeNodeStyle({
    fill: '#46A8D5',
    stroke: null,
    shape: 'rectangle'
  })
}

/**
 * Creates a new node in the given graph at the given location.
 * @param {!IGraph} graph
 * @param {number} x
 * @param {number} y
 * @param {!INodeStyle} baseStyle
 * @param {!string} type
 */
function addNode(graph, x, y, baseStyle, type) {
  graph.createNodeAt({
    location: new Point(x, y),
    style: new NodeStyleDecorator(baseStyle, `resources/${type.toLowerCase()}.svg`),
    tag: type,
    labels: [type]
  })
}

/**
 * Creates a new edge in the given graph between the two given nodes.
 * @param {!IGraph} graph
 * @param {!INode} source
 * @param {!INode} target
 * @param {!string} type
 */
function addEdge(graph, source, target, type) {
  graph.createEdge({
    source: source,
    target: target,
    tag: type
  })
}

/**
 * Binds actions and commands to the demo's UI controls.
 * @param {!GraphComponent} graphComponent
 */
function registerCommands(graphComponent) {
  bindAction("button[data-command='Reload']", () => {
    graphComponent.graph.clear()
    createSampleGraph(graphComponent.graph)
    ICommand.FIT_GRAPH_BOUNDS.execute(null, graphComponent)
  })
  bindCommand("button[data-command='ZoomIn']", ICommand.INCREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='ZoomOut']", ICommand.DECREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='FitContent']", ICommand.FIT_GRAPH_BOUNDS, graphComponent)
  bindCommand("button[data-command='ZoomOriginal']", ICommand.ZOOM, graphComponent, 1.0)
}

// noinspection JSIgnoredPromiseFromCall
run()
