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
  AdjacencyGraphBuilder,
  GraphComponent,
  GraphViewerInputMode,
  HierarchicLayout,
  HierarchicLayoutData,
  HierarchicLayoutLayeringStrategy,
  ICommand,
  IIncrementalHintsFactory,
  IList,
  IModelItem,
  INode,
  LabelPlacements,
  LabelSideReferences,
  LayoutMode,
  License,
  PreferredPlacementDescriptor,
  TemplateNodeStyle
} from 'yfiles'
import {
  addNavigationButtons,
  bindAction,
  bindChangeListener,
  bindCommand,
  reportDemoError,
  showApp
} from '../../resources/demo-app'
import { SchemaComponent } from './SchemaComponent'
import samples from './samples'

import { applyDemoTheme } from '../../resources/demo-styles'
import { fetchLicense } from '../../resources/fetch-license'

const samplesComboBox = document.getElementById('samplesComboBox') as HTMLSelectElement

let layout: HierarchicLayout
let layoutData: HierarchicLayoutData
let layouting = false

let graphComponent: GraphComponent
let schemaComponent: SchemaComponent

let existingNodes: IList<INode>

/**
 * Shows building a graph from business data with class
 * {@link AdjacencyGraphBuilder}.
 * This demo provides a schema graph component for interactive manipulation
 * of the result graph structure and content.
 *
 * In order to visualize the nodes, {@link TemplateNodeStyle} is used. The style's
 * node template can also be changed interactively in order to display arbitrary data
 * of the business data associated with the node.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function run(): Promise<void> {
  License.value = await fetchLicense()

  graphComponent = new GraphComponent('graphComponent')
  applyDemoTheme(graphComponent)

  schemaComponent = new SchemaComponent('schemaGraphComponent', graphComponent.graph, () => {
    // noinspection JSIgnoredPromiseFromCall
    buildGraphFromData(true)
  })

  // configure the input mode
  graphComponent.inputMode = new GraphViewerInputMode()

  // initialize the layout algorithm used in this demo
  initializeLayout()

  initializeSamplesComboBox()

  // load the initial data from samples
  // noinspection JSIgnoredPromiseFromCall
  loadSample(samples[0])

  // register toolbar and other GUI element commands
  registerCommands()

  // initialize the demo
  showApp(graphComponent)
}

/**
 * Bind various UI elements to the appropriate commands
 */
function registerCommands(): void {
  bindCommand("button[data-command='ZoomIn']", ICommand.INCREASE_ZOOM, graphComponent, null)
  bindCommand("button[data-command='ZoomOut']", ICommand.DECREASE_ZOOM, graphComponent, null)
  bindCommand("button[data-command='ZoomOriginal']", ICommand.ZOOM, graphComponent, 1.0)
  bindCommand("button[data-command='FitContent']", ICommand.FIT_GRAPH_BOUNDS, graphComponent, null)

  bindAction("button[data-command='BuildGraph']", async (): Promise<void> => {
    samplesComboBox.disabled = true
    await buildGraphFromData(false)
    samplesComboBox.disabled = false
  })
  bindAction("button[data-command='UpdateGraph']", async (): Promise<void> => {
    samplesComboBox.disabled = true
    await buildGraphFromData(true)
    samplesComboBox.disabled = false
  })
  bindChangeListener("select[data-command='SetSampleData']", async (): Promise<void> => {
    const i = samplesComboBox.selectedIndex
    if (samples && samples[i]) {
      samplesComboBox.disabled = true
      await loadSample(samples[i])
      await buildGraphFromData(true)
      samplesComboBox.disabled = false
    }
  })
  addNavigationButtons(samplesComboBox)
}

/**
 * Builds the graph from data.
 * @param update `true` when the following layout should be incremental, `false`
 *   otherwise
 */
async function buildGraphFromData(update: boolean): Promise<void> {
  if (layouting) {
    return
  }

  if (update) {
    // remember existing nodes
    existingNodes = graphComponent.graph.nodes.toList()
    try {
      schemaComponent.adjacencyGraphBuilder.updateGraph()
    } catch (e) {
      alert(`${(e as Error).message}`)
    }
  } else {
    graphComponent.graph.clear()
    try {
      schemaComponent.adjacencyGraphBuilder.buildGraph()
    } catch (e) {
      alert(`${(e as Error).message}`)
    }
    graphComponent.fitGraphBounds()
  }

  await applyLayout(update)
}

/**
 * Applies the layout.
 * @param update `true` when the following layout should be incremental, `false`
 *   otherwise
 */
async function applyLayout(update: boolean): Promise<void> {
  if (layouting) {
    return
  }

  if (update) {
    // configure from scratch layout
    layout.layoutMode = LayoutMode.INCREMENTAL
  } else {
    layout.layoutMode = LayoutMode.FROM_SCRATCH
  }

  layouting = true
  try {
    await graphComponent.morphLayout(layout, '1s', layoutData)
  } catch (error) {
    reportDemoError(error)
  } finally {
    layouting = false
  }
}

/**
 * Loads the given sample data and builds the graph using the {@link SchemaComponent}
 * @param sample The sample to use for instantiation / initialization
 */
async function loadSample(sample: object): Promise<void> {
  graphComponent.graph.clear()

  const sampleClone = JSON.parse(JSON.stringify(sample))
  schemaComponent.loadSample(sampleClone)
  schemaComponent.adjacencyGraphBuilder.buildGraph()
  await applyLayout(false)
}

/**
 * Initializes the samples combobox with the loaded sample data
 */
function initializeSamplesComboBox(): void {
  for (let i = 0; i < samples.length; i++) {
    const option = document.createElement('option')
    option.textContent = samples[i].name
    // @ts-ignore
    option.value = samples[i]
    samplesComboBox.appendChild(option)
  }
}

/**
 * Configures the demo's layout algorithm as well as suitable layout data.
 */
function initializeLayout() {
  // initialize layout algorithm
  layout = new HierarchicLayout()
  layout.orthogonalRouting = true
  layout.integratedEdgeLabeling = true
  layout.fromScratchLayeringStrategy = HierarchicLayoutLayeringStrategy.HIERARCHICAL_TOPMOST

  // initialize layout data
  // configure label placement
  const preferredPlacementDescriptor = new PreferredPlacementDescriptor({
    sideOfEdge: LabelPlacements.RIGHT_OF_EDGE,
    sideReference: LabelSideReferences.ABSOLUTE_WITH_RIGHT_IN_NORTH,
    distanceToEdge: 5
  })
  preferredPlacementDescriptor.freeze()

  layoutData = new HierarchicLayoutData({
    incrementalHints: (item: IModelItem, hintsFactory: IIncrementalHintsFactory): Object | null => {
      if (item instanceof INode && !existingNodes!.includes(item)) {
        return hintsFactory.createLayerIncrementallyHint(item)
      }
      return null
    },
    edgeLabelPreferredPlacement: preferredPlacementDescriptor
  })
}

// noinspection JSIgnoredPromiseFromCall
run()
