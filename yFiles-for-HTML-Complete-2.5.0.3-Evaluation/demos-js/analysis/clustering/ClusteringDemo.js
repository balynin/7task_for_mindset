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
  BiconnectedComponentClustering,
  BiconnectedComponentClusteringResult,
  DefaultLabelStyle,
  DistanceMetric,
  EdgeBetweennessClustering,
  EdgeBetweennessClusteringResult,
  EdgePathLabelModel,
  EdgeSides,
  GraphBuilder,
  GraphComponent,
  GraphEditorInputMode,
  GraphItemTypes,
  HierarchicalClustering,
  HierarchicalClusteringResult,
  ICanvasObject,
  ICanvasObjectDescriptor,
  ICommand,
  IEdge,
  IEnumerable,
  IGraph,
  INode,
  Insets,
  IRectangle,
  IVisualCreator,
  KMeansClustering,
  KMeansClusteringResult,
  LabelPropagationClustering,
  LabelPropagationClusteringResult,
  License,
  LinkageMethod,
  LouvainModularityClustering,
  LouvainModularityClusteringResult,
  NodeStyleDecorationInstaller,
  Point,
  PolylineEdgeStyle,
  Rect,
  ShapeNodeShape
} from 'yfiles'

import * as ClusteringData from './resources/ClusteringData.js'
import { VoronoiDiagram } from './VoronoiDiagram.js'
import { PolygonVisual, VoronoiVisual } from './DemoVisuals.js'
import { DendrogramComponent } from './DendrogramSupport.js'
import {
  addNavigationButtons,
  bindAction,
  bindChangeListener,
  bindCommand,
  showApp
} from '../../resources/demo-app.js'
import {
  applyDemoTheme,
  createDemoEdgeStyle,
  createDemoShapeNodeStyle
} from '../../resources/demo-styles.js'
import { fetchLicense } from '../../resources/fetch-license.js'

/**
 * The {@link GraphComponent} which contains the {@link IGraph}.
 * @type {GraphComponent}
 */
let graphComponent

/**
 * The {@link GraphComponent} for the visualization of the dendrogram in the hierarchical clustering.
 * @type {DendrogramComponent}
 */
let dendrogramComponent

/**
 * The canvas object for the cluster visual
 * @type {ICanvasObject}
 */
let clusterVisualObject

/**
 * The canvas object for the k-means centroids visual
 * @type {ICanvasObject}
 */
let kMeansCentroidObject

/**
 * The style for the directed edges
 * @type {PolylineEdgeStyle}
 */
let directedEdgeStyle

/**
 * The result of the clustering algorithm
 * @type {(BiconnectedComponentClusteringResult|EdgeBetweennessClusteringResult|HierarchicalClusteringResult|KMeansClusteringResult|LouvainModularityClusteringResult|LabelPropagationClusteringResult)}
 */
let result

/**
 * Holds whether a clustering algorithm is running
 * @type {boolean}
 */
let busy = false

/**
 * The algorithm selected by the user
 * @type {ClusteringAlgorithm}
 */
let selectedAlgorithm

/**
 * Returns a reference to the first element with the specified ID in the current document.
 * @returns {!T} A reference to the first element with the specified ID in the current document.
 * @template {HTMLElement} T
 * @param {!string} id
 */
function getElementById(id) {
  return document.getElementById(id)
}

/**
 * @returns {!Promise}
 */
async function run() {
  License.value = await fetchLicense()

  graphComponent = new GraphComponent('graphComponent')
  applyDemoTheme(graphComponent)

  // initialize the default styles
  configureGraph(graphComponent.graph)

  // create the input mode
  configureUserInteraction(graphComponent)

  dendrogramComponent = new DendrogramComponent(graphComponent)

  // initialize the dendrogram component
  configureDendrogramComponent(dendrogramComponent)

  // load the graph and run the algorithm
  onAlgorithmChanged()

  // wire up the UI
  registerCommands()

  // show the demo
  showApp(graphComponent)
}

/**
 * Initializes the default styles and the highlight style.
 * @param {!IGraph} graph
 */
function configureGraph(graph) {
  graph.nodeDefaults.style = createDemoShapeNodeStyle(ShapeNodeShape.ELLIPSE, 'demo-palette-401')

  // sets the default edge style as 'undirected'
  graph.edgeDefaults.style = createDemoEdgeStyle({
    colorSetName: 'demo-palette-401',
    showTargetArrow: false
  })

  // sets the edge style of the algorithms that support edge direction
  directedEdgeStyle = createDemoEdgeStyle({ colorSetName: 'demo-palette-401' })

  // set the default style for node labels
  graph.nodeDefaults.labels.style = new DefaultLabelStyle({
    font: 'bold Arial'
  })

  // set the default style for edge labels
  graph.edgeDefaults.labels.style = new DefaultLabelStyle({
    font: 'bold 10px Arial'
  })

  // For edge labels, the default is a label that is rotated to match the associated edge segment
  // We'll start by creating a model that is similar to the default:
  const edgeLabelModel = new EdgePathLabelModel({
    autoRotation: true,
    sideOfEdge: EdgeSides.ABOVE_EDGE,
    distance: 2
  })
  // Finally, we can set this label model as the default for edge labels
  graph.edgeDefaults.labels.layoutParameter = edgeLabelModel.createDefaultParameter()

  // highlight node style
  const nodeHighlight = new NodeStyleDecorationInstaller({
    nodeStyle: createDemoShapeNodeStyle(ShapeNodeShape.ELLIPSE, 'demo-palette-23'),
    zoomPolicy: 'mixed',
    margins: 3
  })
  graph.decorator.nodeDecorator.highlightDecorator.setImplementation(nodeHighlight)
}

/**
 * Configures user interaction for the given graph component.
 * @param {!GraphComponent} graphComponent
 */
function configureUserInteraction(graphComponent) {
  const mode = new GraphEditorInputMode({
    allowEditLabel: false,
    showHandleItems: GraphItemTypes.NONE
  })

  // when an edge is created, run the algorithm again except for the k-means and hierarchical
  // because these two are independent of the edges of the graph
  mode.createEdgeInputMode.addEdgeCreatedListener((source, args) => {
    if (
      selectedAlgorithm === ClusteringAlgorithm.EDGE_BETWEENNESS &&
      getElementById('directed').checked
    ) {
      graphComponent.graph.setStyle(args.item, directedEdgeStyle)
    }
    if (
      selectedAlgorithm != ClusteringAlgorithm.kMEANS &&
      selectedAlgorithm != ClusteringAlgorithm.HIERARCHICAL
    ) {
      runAlgorithm()
    }
  })

  // when a node/edge is created/deleted, run the algorithm
  mode.addDeletedSelectionListener(() => {
    runAlgorithm()
  })
  mode.addNodeCreatedListener(() => {
    runAlgorithm()
  })

  // when a node is dragged, run the algorithm if this is HIERARCHICAL clustering or kMEANS
  mode.moveInputMode.addDragFinishedListener(() => {
    if (
      selectedAlgorithm === ClusteringAlgorithm.HIERARCHICAL ||
      selectedAlgorithm === ClusteringAlgorithm.kMEANS
    ) {
      runAlgorithm()
    }
  })

  // add the hover listener
  mode.itemHoverInputMode.hoverItems = GraphItemTypes.NODE
  mode.itemHoverInputMode.discardInvalidItems = false
  mode.itemHoverInputMode.addHoveredItemChangedListener((sender, event) => {
    // if a node is hovered and the algorithm is HIERARCHICAL clustering, hover the corresponding dendrogram node
    if (selectedAlgorithm === ClusteringAlgorithm.HIERARCHICAL) {
      const node = event.item
      graphComponent.highlightIndicatorManager.clearHighlights()
      if (node && result) {
        graphComponent.highlightIndicatorManager.addHighlight(node)
        dendrogramComponent.updateHighlight(result.getDendrogramNode(node))
      }
    }
  })
  graphComponent.inputMode = mode

  // add listeners for clipboard operations that might change the graph structure like cut and paste
  graphComponent.clipboard.addElementsPastedListener(() => {
    runAlgorithm()
  })

  graphComponent.clipboard.addElementsCutListener(() => {
    runAlgorithm()
  })
}

/**
 * Initializes the dendrogram component.
 * @param {!DendrogramComponent} dendrogramComponent
 */
function configureDendrogramComponent(dendrogramComponent) {
  // add a dragging listener to run the hierarchical algorithm's when the dragging of the cutoff line has finished
  dendrogramComponent.addDragFinishedListener(cutOffValue => {
    removeClusterVisuals()
    runHierarchicalClustering(cutOffValue)
  })
}

/**
 * Runs the clustering algorithm.
 */
function runAlgorithm() {
  if (!busy) {
    setUIDisabled(true)
    graphComponent.updateContentRect(new Insets(10))
    removeClusterVisuals()

    if (graphComponent.graph.nodes.size > 0) {
      switch (selectedAlgorithm) {
        default:
        case ClusteringAlgorithm.EDGE_BETWEENNESS:
          runEdgeBetweennessClustering()
          break
        case ClusteringAlgorithm.kMEANS:
          runKMeansClustering()
          break
        case ClusteringAlgorithm.HIERARCHICAL:
          runHierarchicalClustering()
          break
        case ClusteringAlgorithm.BICONNECTED_COMPONENTS:
          runBiconnectedComponentsClustering()
          break
        case ClusteringAlgorithm.LOUVAIN_MODULARITY:
          runLouvainModularityClustering()
          break
        case ClusteringAlgorithm.LABEL_PROPAGATION:
          runLabelPropagationClustering()
          break
      }
    } else {
      if (selectedAlgorithm === ClusteringAlgorithm.HIERARCHICAL) {
        dendrogramComponent.clearDendrogram()
      }
    }
    setUIDisabled(false)
  }
}

/**
 * Runs the edge betweenness clustering algorithm.
 */
function runEdgeBetweennessClustering() {
  updateInformationPanel('edge-betweenness')

  const graph = graphComponent.graph

  // get the algorithm preferences from the right panel
  let minClusterCount = parseFloat(getElementById('ebMinClusterNumber').value)
  const maxClusterCount = parseFloat(getElementById('ebMaxClusterNumber').value)

  if (minClusterCount > maxClusterCount) {
    alert(
      'Desired minimum number of clusters cannot be larger than the desired maximum number of clusters.'
    )
    getElementById('ebMinClusterNumber').value = maxClusterCount.toString()
    minClusterCount = maxClusterCount
  } else if (minClusterCount > graph.nodes.size) {
    alert(
      'Desired minimum number of clusters cannot be larger than the number of nodes in the graph.'
    )
    getElementById('ebMinClusterNumber').value = graph.nodes.size.toString()
    minClusterCount = graph.nodes.size
  }

  // run the algorithm
  result = new EdgeBetweennessClustering({
    directed: getElementById('directed').checked,
    minimumClusterCount: minClusterCount,
    maximumClusterCount: maxClusterCount,
    weights: getEdgeWeight
  }).run(graph)

  // visualize the result
  visualizeClusteringResult()
}

/**
 * Runs the k-means clustering algorithm.
 */
function runKMeansClustering() {
  updateInformationPanel('k-means')

  // get the algorithm preferences from the right panel
  let distanceMetric
  switch (getElementById('distanceMetricComboBox').selectedIndex) {
    default:
    case 0:
      distanceMetric = DistanceMetric.EUCLIDEAN
      break
    case 1:
      distanceMetric = DistanceMetric.MANHATTAN
      break
    case 2:
      distanceMetric = DistanceMetric.CHEBYCHEV
      break
  }

  // run the clustering algorithm
  result = new KMeansClustering({
    metric: distanceMetric,
    maximumIterations: parseFloat(getElementById('iterations').value),
    k: parseFloat(getElementById('kMeansMaxClusterNumber').value)
  }).run(graphComponent.graph)

  // visualize the result
  visualizeClusteringResult()
}

/**
 * Run the hierarchical clustering algorithm.
 * @param cutoff The given cut-off value to run the algorithm
 * @param {number} [cutoff]
 */
function runHierarchicalClustering(cutoff) {
  updateInformationPanel('hierarchical')

  const graph = graphComponent.graph
  // get the algorithm preferences from the right panel
  let linkage
  switch (getElementById('linkageComboBox').selectedIndex) {
    default:
    case 0:
      linkage = LinkageMethod.SINGLE
      break
    case 1:
      linkage = LinkageMethod.AVERAGE
      break
    case 2:
      linkage = LinkageMethod.COMPLETE
      break
  }

  // run the algorithm that calculates only the node clusters
  result = new HierarchicalClustering({
    metric: HierarchicalClustering.EUCLIDEAN,
    linkage,
    // if no cutoff is specified when runHierarchicalClustering is called, the clustering algorithm
    // should produce a single cluster with all nodes (i.e. not cut-off any nodes)
    // setting the algorithm's cutoff property to a negative value ensures a single cluster result
    cutoff: typeof cutoff === 'undefined' ? -1 : cutoff
  }).run(graph)

  // visualize the result
  visualizeClusteringResult()

  // draw the dendrogram from the algorithm's result
  dendrogramComponent.generateDendrogram(result, cutoff)
}

/**
 * Run the biconnected components clustering algorithm.
 */
function runBiconnectedComponentsClustering() {
  updateInformationPanel('biconnected-components')
  // run the algorithm
  result = new BiconnectedComponentClustering().run(graphComponent.graph)
  // visualize the result
  visualizeClusteringResult()
}

/**
 * Run the Louvain modularity clustering algorithm.
 */
function runLouvainModularityClustering() {
  updateInformationPanel('louvain-modularity')
  // run the algorithm
  result = new LouvainModularityClustering().run(graphComponent.graph)
  // visualize the result
  visualizeClusteringResult()
}

/**
 * Run the label propagation clustering algorithm.
 */
function runLabelPropagationClustering() {
  updateInformationPanel('label-propagation')
  // run the algorithm
  result = new LabelPropagationClustering().run(graphComponent.graph)
  // visualize the result
  visualizeClusteringResult()
}

/**
 * Visualizes the result of the clustering algorithm by adding the appropriate visuals.
 */
function visualizeClusteringResult() {
  const graph = graphComponent.graph

  // creates a map the holds for each cluster id, the list of nodes that belong to the particular cluster
  const clustering = new Map()
  graph.nodes.forEach(node => {
    let clusterId = result.nodeClusterIds.get(node)
    // biconnected components returns -1 as cluster id when only one node is present.
    // We change the clusterId manually here, as otherwise we'll get an exception in
    // DemoVisuals.PolygonVisual#createVisual
    if (clusterId === -1 && selectedAlgorithm === ClusteringAlgorithm.BICONNECTED_COMPONENTS) {
      clusterId = 0
    }
    let clusterNodesCoordinates = clustering.get(clusterId)
    if (!clusterNodesCoordinates) {
      clusterNodesCoordinates = []
      clustering.set(clusterId, clusterNodesCoordinates)
    }
    clusterNodesCoordinates.push(node.layout)
  })

  if (!clusterVisualObject) {
    let clusterVisual

    switch (selectedAlgorithm) {
      default:
      case ClusteringAlgorithm.EDGE_BETWEENNESS:
      case ClusteringAlgorithm.BICONNECTED_COMPONENTS: {
        // create a polygonal visual that encloses the nodes that belong to the same cluster
        const clusters = {
          number: clustering.size,
          clustering,
          centroids: IEnumerable.from([])
        }
        clusterVisual = new PolygonVisual(false, clusters)
        break
      }
      case ClusteringAlgorithm.kMEANS: {
        const centroids = result.centroids
        if (clustering.size >= 3 && graphComponent.contentRect) {
          // create a voronoi diagram
          const clusters = {
            centroids: centroids
          }
          clusterVisual = new VoronoiVisual(
            new VoronoiDiagram(centroids, graphComponent.contentRect),
            clusters
          )
        } else {
          // if there exist only two clusters, create a polygonal visual with center marking
          const clusters = {
            number: clustering.size,
            clustering,
            centroids: centroids
          }
          clusterVisual = new PolygonVisual(true, clusters)
        }
        break
      }
    }

    // add the visual to the graphComponent's background group
    clusterVisualObject = graphComponent.backgroundGroup.addChild(
      clusterVisual,
      ICanvasObjectDescriptor.ALWAYS_DIRTY_INSTANCE
    )
    clusterVisualObject.toBack()
  }

  // invalidate the graphComponent
  graphComponent.invalidate()
}

/**
 * Called when the clustering algorithm changes
 */
function onAlgorithmChanged() {
  const algorithmsComboBox = getElementById('algorithmsComboBox')
  selectedAlgorithm = algorithmsComboBox.selectedIndex

  // determine the file name that will be used for loading the graph
  const fileName = algorithmsComboBox.value

  // Adjusts the window appearance. This method is needed since when the selected clustering algorithm is
  // HIERARCHICAL, the window has to be split to visualize the dendrogram.
  const showDendrogram = selectedAlgorithm === ClusteringAlgorithm.HIERARCHICAL
  graphComponent.div.style.height = showDendrogram ? '44%' : 'calc(100% - 100px)'
  dendrogramComponent.toggleVisibility(showDendrogram)
  graphComponent.fitGraphBounds(new Insets(10))

  // load the graph and run the algorithm
  loadGraph(ClusteringData[fileName])
  runAlgorithm()
}

/**
 * Loads the sample graphs from a JSON file.
 * @param {*} sampleData The data samples
 */
function loadGraph(sampleData) {
  // remove all previous visuals
  removeClusterVisuals()

  const graph = graphComponent.graph
  graph.clear()

  const isEdgeBetweenness = selectedAlgorithm === ClusteringAlgorithm.EDGE_BETWEENNESS
  const styleFactory =
    isEdgeBetweenness && getElementById('directed').checked
      ? () => directedEdgeStyle
      : () => undefined // tell GraphBuilder to use default styles

  const labelsFactory =
    isEdgeBetweenness && getElementById('edgeCosts').checked
      ? () => Math.floor(Math.random() * 200 + 1).toString()
      : () => undefined // tell GraphBuilder not to create any labels

  // initialize a graph builder to parse the graph from the JSON file
  const builder = new GraphBuilder({
    graph: graph,
    nodes: [
      {
        data: sampleData.nodes,
        id: 'id',
        layout: data => new Rect(data.x, data.y, data.w, data.h),
        labels: ['label']
      }
    ],
    edges: [
      {
        data: sampleData.edges,
        sourceId: 'source',
        targetId: 'target',
        style: styleFactory,
        labels: [labelsFactory]
      }
    ]
  })

  builder.buildGraph()

  graphComponent.fitGraphBounds(new Insets(10))
}

/**
 * Wires up the UI.
 */
function registerCommands() {
  const graph = graphComponent.graph
  bindCommand("button[data-command='ZoomIn']", ICommand.INCREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='ZoomOriginal']", ICommand.ZOOM, graphComponent)
  bindCommand("button[data-command='ZoomOut']", ICommand.DECREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='FitContent']", ICommand.FIT_GRAPH_BOUNDS, graphComponent)

  const samplesComboBox = getElementById('algorithmsComboBox')
  addNavigationButtons(samplesComboBox)
  bindChangeListener("select[data-command='AlgorithmSelectionChanged']", onAlgorithmChanged)
  bindAction("button[data-command='RunAlgorithm']", runAlgorithm)

  // edge-betweenness menu
  const minInput = getElementById('ebMinClusterNumber')
  minInput.addEventListener('change', input => {
    const target = input.target
    const value = parseFloat(target.value)
    const maximumClusterNumber = parseFloat(getElementById('ebMaxClusterNumber').value)
    if (isNaN(value) || value < 1) {
      alert('Number of clusters should be non-negative.')
      target.value = '1'
      return
    } else if (value > maximumClusterNumber) {
      alert(
        'Desired minimum number of clusters cannot be larger than the desired maximum number of clusters.'
      )
      target.value = maximumClusterNumber.toString()
      return
    } else if (value > graph.nodes.size) {
      alert(
        'Desired minimum number of clusters cannot be larger than the number of nodes in the graph.'
      )
      target.value = graph.nodes.size.toString()
      return
    }
    runAlgorithm()
  })

  const maxInput = getElementById('ebMaxClusterNumber')
  maxInput.addEventListener('change', input => {
    const target = input.target
    const value = parseFloat(target.value)
    const minimumClusterNumber = parseFloat(getElementById('ebMinClusterNumber').value)
    if (isNaN(value) || value < minimumClusterNumber || minimumClusterNumber < 1) {
      const message =
        value < minimumClusterNumber
          ? 'Desired maximum number of clusters cannot be smaller than the desired minimum number of clusters.'
          : 'Number of clusters should be non-negative.'
      alert(message)
      target.value = minimumClusterNumber.toString()
      return
    }
    runAlgorithm()
  })

  const considerEdgeDirection = getElementById('directed')
  considerEdgeDirection.addEventListener('click', () => {
    const isChecked = considerEdgeDirection.checked
    graph.edges.forEach(edge => {
      graph.setStyle(edge, isChecked ? directedEdgeStyle : graph.edgeDefaults.style)
    })

    runAlgorithm()
  })

  const considerEdgeCosts = getElementById('edgeCosts')
  considerEdgeCosts.addEventListener('click', () => {
    graph.edges.forEach(edge => {
      if (considerEdgeCosts.checked) {
        const edgeCost = Math.floor(Math.random() * 200 + 1)
        if (edge.labels.size > 0) {
          graph.setLabelText(edge.labels.get(0), `${edgeCost}`)
        } else {
          graph.addLabel(edge, `${edgeCost}`)
        }
      } else {
        edge.labels.toArray().forEach(label => {
          graph.remove(label)
        })
      }
    })
    runAlgorithm()
  })

  // k-Means
  bindChangeListener("select[data-command='distanceMetricComboBox']", runAlgorithm)
  const kmeansInput = getElementById('kMeansMaxClusterNumber')
  kmeansInput.addEventListener('change', input => {
    const target = input.target
    const value = parseFloat(target.value)
    if (isNaN(value) || value < 1) {
      alert('Desired maximum number of clusters should be greater than zero.')
      target.value = '1'
      return
    }
    runAlgorithm()
  })
  const iterationsInput = getElementById('iterations')
  iterationsInput.addEventListener('change', input => {
    const target = input.target
    const value = parseFloat(target.value)
    if (isNaN(value) || value < 0) {
      alert('Desired maximum number of iterations should be non-negative.')
      target.value = '0'
      return
    }
    runAlgorithm()
  })

  // hierarchical
  bindChangeListener("select[data-command='linkageComboBox']", runAlgorithm)
}

/**
 * Remove all present cluster visuals.
 */
function removeClusterVisuals() {
  if (clusterVisualObject) {
    clusterVisualObject.remove()
    clusterVisualObject = null
  }

  if (kMeansCentroidObject) {
    kMeansCentroidObject.remove()
    kMeansCentroidObject = null
  }
}

/**
 * Returns the edge weight for the given edge.
 * @param {!IEdge} edge The given edge
 * @returns {number} The edge weight
 */
function getEdgeWeight(edge) {
  if (!getElementById('edgeCosts').checked) {
    return 1
  }

  // if edge has at least one label...
  if (edge.labels.size > 0) {
    // ..try to return it's value
    const edgeWeight = parseFloat(edge.labels.first().text)
    if (!isNaN(edgeWeight)) {
      return edgeWeight > 0 ? edgeWeight : 1
    }
  }
  return 1
}

/**
 * Updates the elements of the UI's state and checks whether the buttons should be enabled or not.
 * @param {boolean} disabled
 */
function setUIDisabled(disabled) {
  const samplesComboBox = getElementById('algorithmsComboBox')
  samplesComboBox.disabled = disabled
  graphComponent.inputMode.waiting = disabled
  busy = disabled
}

/**
 * Updates the description and the settings panel.
 * @param {!string} panelId The id of the panel to be updated
 */
function updateInformationPanel(panelId) {
  // set display none to all and then change only the desired one
  getElementById('edge-betweenness').style.display = 'none'
  getElementById('k-means').style.display = 'none'
  getElementById('hierarchical').style.display = 'none'
  getElementById('biconnected-components').style.display = 'none'
  getElementById('louvain-modularity').style.display = 'none'
  getElementById('label-propagation').style.display = 'none'
  getElementById(panelId).style.display = 'inline-block'
}

/**
 * @readonly
 * @enum {number}
 */
const ClusteringAlgorithm = {
  EDGE_BETWEENNESS: 0,
  kMEANS: 1,
  HIERARCHICAL: 2,
  BICONNECTED_COMPONENTS: 3,
  LOUVAIN_MODULARITY: 4,
  LABEL_PROPAGATION: 5
}

// noinspection JSIgnoredPromiseFromCall
run()
