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
  EdgeRouter,
  EdgeRouterBusDescriptor,
  EdgeRouterData,
  EdgeRouterScope,
  Fill,
  GraphBuilder,
  GraphComponent,
  GraphEditorInputMode,
  GraphItemTypes,
  GraphSnapContext,
  ICollection,
  ICommand,
  IEdge,
  IGraph,
  License,
  OrthogonalEdgeEditingContext,
  PolylineEdgeStyle,
  Size,
  SolidColorFill,
  Stroke
} from 'yfiles'
import { bindAction, bindCommand, reportDemoError, showApp } from '../../resources/demo-app'
import SampleData from './resources/SampleData'
import { applyDemoTheme, initDemoStyles } from '../../resources/demo-styles'
import { fetchLicense } from '../../resources/fetch-license'

/**
 * Provides different color fills for new edge busses in this demo.
 */
class ColorUtil {
  private fills = ColorUtil.newFills()
  private index = 0

  /**
   * Returns a fill not yet in use.
   * @see {@link connectNodes}
   */
  nextFill(): Fill {
    if (this.index >= this.fills.length) {
      const r = Math.floor(Math.random() * 150)
      const g = Math.floor(Math.random() * 150)
      const b = Math.floor(Math.random() * 150)
      this.fills.push(new SolidColorFill(r, g, b))
    }

    return this.fills[this.index++]
  }

  /**
   * Returns the fills already in use.
   */
  usedFills(): Fill[] {
    const copy = []
    for (let i = 0; i < this.index + 1; ++i) {
      copy.push(this.fills[i])
    }
    return copy
  }

  /**
   * Creates an initial set of fills for new edges.
   */
  private static newFills(): Fill[] {
    const fills = []
    fills.push(Fill.from('#AB2346')) // sample graph edge color
    fills.push(Fill.from('#662b00')) // sample graph edge color
    fills.push(Fill.from('#0B7189')) // sample graph edge color
    fills.push(Fill.from('#0B7189'))
    fills.push(Fill.from('#111D4A'))
    fills.push(Fill.from('#17BEBB'))
    fills.push(Fill.from('#FFC914'))
    fills.push(Fill.from('#FF6C00'))
    fills.push(Fill.from('#2E282A'))
    fills.push(Fill.from('#76B041'))
    return fills
  }
}

/**
 * Display's the demo's graph.
 */
let graphComponent: GraphComponent = null!

/**
 * State guard to prevent concurrent layout calculations.
 */
let layoutRunning = false

/**
 * Manages the different color fills for grouping edges to busses.
 */
const colorUtil = new ColorUtil()

/**
 * Runs the demo.
 */
async function run(): Promise<void> {
  License.value = await fetchLicense()

  registerCommands()

  graphComponent = new GraphComponent('#graphComponent')
  applyDemoTheme(graphComponent)

  configureUserInteraction(graphComponent)

  configureGraph(graphComponent.graph)

  loadGraph(graphComponent.graph)

  graphComponent.fitGraphBounds()

  await routeEdges()

  showApp(graphComponent)
}

/**
 * Configures the demo's user interaction.
 * @param graphComponent The demo's graph view.
 */
function configureUserInteraction(graphComponent: GraphComponent): void {
  // create an input mode for interactive graph editing
  const mode = new GraphEditorInputMode()
  // disable interactive edge creation
  mode.allowCreateEdge = false
  // restrict marquee selection to nodes
  mode.marqueeSelectableItems = GraphItemTypes.NODE
  // since EdgeRouter creates and works with orthogonal edge routes,
  // ensure interactive edge editing will keep edges orthogonal
  mode.orthogonalEdgeEditingContext = new OrthogonalEdgeEditingContext()
  // disable interactive node resizing
  mode.showHandleItems = GraphItemTypes.BEND | GraphItemTypes.EDGE
  // turn on default snapping for graph elements
  mode.snapContext = new GraphSnapContext()

  graphComponent.inputMode = mode
}

/**
 * Configures default visualizations for the given graph.
 * @param graph The demo's graph.
 */
function configureGraph(graph: IGraph): void {
  initDemoStyles(graph)

  // increase the default node size to 50x50 pixel
  graph.nodeDefaults.size = Size.from([50, 50])
}

/**
 * Creates a sample graph structure from the demo's sample data.
 * The sample graph will have edges in three different colors (i.e. red, brown, and blue)
 * and thus start out with three edge busses.
 */
function loadGraph(graph: IGraph) {
  // the style to be used for red edges
  const red = newEdgeStyle()
  // the style to be used for brown edges
  const brown = newEdgeStyle()
  // the default style to be used for all edges that are neither red nor brown
  const blue = newEdgeStyle()

  // the demo's sample data
  const data = SampleData

  const builder = new GraphBuilder(graph)
  builder.createNodesSource({
    data: data.nodes, // array of { id: string, bounds: number[] }
    id: 'id', // uses the 'id' property to uniquely identify each created node
    layout: 'bounds' // uses the 'bounds' property to determine each node's geometry
  })
  builder.createEdgesSource({
    data: data.edges, // array of { source: string, target: string, color: string }
    sourceId: 'source', // uses the 'source' property to determine the source node for each created edge
    targetId: 'target', // uses the 'target' property to determine the target node for each created edge
    style: (item: any) => {
      // uses the 'color' property to determine the style for each created edge
      if ('#AB2346' === item.color) {
        return red
      } else if ('#662b00' === item.color) {
        return brown
      } else {
        return blue
      }
    }
  })
  builder.buildGraph()
}

/**
 * Triggers a new layout calculation for the edges associated to the given scope.
 * @param edgesToRoute Determines which edges to route. If provided only these edges are routed,
 * otherwise all edges are routed.
 */
async function routeEdges(edgesToRoute: IEdge[] | null = null): Promise<void> {
  // prevent concurrent layout calculations or animations
  if (layoutRunning) {
    return
  }

  layoutRunning = true
  disableUI(true)

  try {
    await routeEdgesCore(edgesToRoute)
  } catch (error) {
    reportDemoError(error)
  } finally {
    layoutRunning = false
    disableUI(false)
  }
}

/**
 * Routes the edges associated to the given scope and applies the result in an animated fashion.
 * @param edgesToRoute Determines which edges to route. If provided only these edges are routed,
 * otherwise all edges are routed.
 */
async function routeEdgesCore(edgesToRoute: IEdge[] | null): Promise<void> {
  // configure bus structures
  const layoutData = new EdgeRouterData()

  if (edgesToRoute && edgesToRoute.length > 0) {
    // affected edges are all the edges created in the last connectNodes action
    // mark those edges for routing ...
    layoutData.affectedEdges.source = ICollection.from(edgesToRoute)
    // ... and assign those edges to a new edge bus
    layoutData.buses.add(new EdgeRouterBusDescriptor({ multipleBackboneSegments: false })).items =
      ICollection.from(edgesToRoute)
  } else {
    // affected edges are all edges

    // assign each edge to a bus depending on the edge's color
    for (const fill of colorUtil.usedFills()) {
      layoutData.buses.add(
        new EdgeRouterBusDescriptor({ multipleBackboneSegments: false })
      ).delegate = edge => {
        const edgeFill = (edge.style as PolylineEdgeStyle).stroke!.fill
        return fill.hasSameValue(edgeFill)
      }
    }
  }

  // the algorithm used for edge routing
  const algorithm = new EdgeRouter()
  algorithm.scope =
    edgesToRoute && edgesToRoute.length > 0
      ? EdgeRouterScope.ROUTE_AFFECTED_EDGES
      : EdgeRouterScope.ROUTE_ALL_EDGES

  // calculate the new edge routes and apply the result in an animated fashion
  await graphComponent.morphLayout({ layout: algorithm, layoutData: layoutData })
}

/**
 * Connects all the currently selected nodes and routes the new edges.
 * All new edges will have the same color and thus will be assigned to the same edge bus.
 */
async function connectNodes() {
  // prevent previously created edges from being routed as well
  const edgesToRoute: IEdge[] = []

  // determine the currently selected nodes
  const nodes = graphComponent.selection.selectedNodes.toArray()
  const n = nodes.length
  if (n < 1) {
    return
  }

  // create a new style with an as-to-now unused color
  const style = newEdgeStyle()

  // connect the selected nodes; assign each new edge the new style
  for (let i = 0; i < n; ++i) {
    for (let j = i + 1; j < n; ++j) {
      edgesToRoute.push(graphComponent.graph.createEdge(nodes[i], nodes[j], style))
    }
  }

  // route the new edges and only the new edges
  await routeEdges(edgesToRoute)
}

/**
 * Creates a new edge style with an as-to-now unused color fill.
 */
function newEdgeStyle(): PolylineEdgeStyle {
  return new PolylineEdgeStyle({ stroke: new Stroke(colorUtil.nextFill(), 2) })
}

/**
 * Helper function to disable UI during layout animation
 */
function disableUI(disabled: boolean) {
  const connect = document.getElementById('connect') as HTMLButtonElement
  connect.disabled = disabled
  const layout = document.getElementById('route') as HTMLButtonElement
  layout.disabled = disabled
}

/**
 * Binds commands to the buttons in the toolbar.
 */
function registerCommands() {
  bindCommand("button[data-command='ZoomIn']", ICommand.INCREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='ZoomOut']", ICommand.DECREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='FitContent']", ICommand.FIT_GRAPH_BOUNDS, graphComponent)

  bindAction("button[data-command='Route']", () => routeEdges())
  bindAction("button[data-command='Connect']", connectNodes)
}

// noinspection JSIgnoredPromiseFromCall
run()
