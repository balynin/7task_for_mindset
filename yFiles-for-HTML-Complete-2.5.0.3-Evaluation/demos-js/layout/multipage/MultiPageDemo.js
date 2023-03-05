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
  CircularLayout,
  CompactNodePlacer,
  CompactOrthogonalLayout,
  GraphComponent,
  GraphItemTypes,
  GraphMLIOHandler,
  GraphViewerInputMode,
  HierarchicLayout,
  HoveredItemChangedEventArgs,
  ICanvasObjectDescriptor,
  ICommand,
  IEdge,
  IGraph,
  ILabel,
  ILayoutCallback,
  INode,
  LayoutGraphAdapter,
  License,
  MultiPageLayout,
  MultiPageLayoutData,
  MultiPageLayoutResult,
  OrganicLayout,
  OrthogonalLayout,
  Point,
  TreeLayout,
  TreeReductionStage,
  YDimension
} from 'yfiles'

import {
  applyDemoTheme,
  createDemoEdgeStyle,
  createDemoNodeLabelStyle,
  createDemoNodeStyle,
  initDemoStyles
} from '../../resources/demo-styles.js'
import {
  bindAction,
  bindChangeListener,
  bindCommand,
  readGraph,
  showApp,
  showLoadingIndicator
} from '../../resources/demo-app.js'
import MultiPageIGraphBuilder from './MultiPageIGraphBuilder.js'
import PageBoundsVisualCreator from './PageBoundsVisualCreator.js'
import { fetchLicense } from '../../resources/fetch-license.js'
import { BrowserDetection } from '../../utils/BrowserDetection.js'

/**
 * This demo demonstrates how the result of a multi-page layout calculation
 * can be displayed in a graph component.
 * A multi-page layout splits a large graph into multiple pages with a fixed maximum width and height.
 * Each of these pages is displayed by a different graph.
 * @returns {!Promise}
 */
async function run() {
  License.value = await fetchLicense()
  // initialize both graph components
  graphComponent = new GraphComponent('graphComponent')
  modelGraphComponent = new GraphComponent('modelGraphComponent')
  applyDemoTheme(graphComponent)
  applyDemoTheme(modelGraphComponent)
  initDemoStyles(modelGraphComponent.graph, { theme: 'demo-palette-21' })

  registerCommands()
  initializeCoreLayouts()
  initializeInputModes()
  loadModelGraph('Pop Artists')

  showApp(graphComponent)
}

/**
 * Shows the current page of the multi-page layout.
 * @type {GraphComponent}
 */
let graphComponent

/**
 * Shows the complete model graph.
 * @type {GraphComponent}
 */
let modelGraphComponent

/**
 * The calculated page graphs.
 * @type {Array.<IGraph>}
 */
let viewGraphs

/**
 * The currently selected page.
 * @type {number}
 */
let pageNumber = 0

/**
 * The visual creator for rendering the page bounds.
 * @type {PageBoundsVisualCreator}
 */
let pageBoundsVisualCreator

/**
 * A flag that prevents re-entrant layout calls.
 * @type {boolean}
 */
let layouting = false

/**
 * Starts the multi page layout calculation.
 */
function runMultiPageLayout() {
  if (layouting) {
    // return if a layout is already running
    return
  }
  layouting = true

  // parse the pageWidth and pageHeight parameters
  const pageWidthTextBox = document.getElementById('pageWidthTextBox')
  let pageWidth = parseFloat(pageWidthTextBox.value)
  if (isNaN(pageWidth)) {
    pageWidth = 800
  }
  const pageHeightTextBox = document.getElementById('pageHeightTextBox')
  let pageHeight = parseFloat(pageHeightTextBox.value)
  if (isNaN(pageHeight)) {
    pageHeight = 800
  }

  // get the core layout
  const coreLayoutComboBox = document.getElementById('coreLayoutComboBox')
  const layoutIndex = coreLayoutComboBox.selectedIndex
  const coreLayout = coreLayoutComboBox.options[layoutIndex > -1 ? layoutIndex : 0].myValue
  if (coreLayoutComboBox.value === 'Tree') {
    // configure CompactNodePlacer to respect the aspect ratio of the page
    coreLayout.defaultNodePlacer.aspectRatio = pageWidth / pageHeight
  }

  const createProxyReferenceNodes = document.getElementById('createProxyReferenceNodes')
  const createProxyNodes = createProxyReferenceNodes.checked
  const placeMultipleComponentsOnSinglePage = document.getElementById(
    'placeMultipleComponentsOnSinglePage'
  )
  const placeComponentsOnSinglePage = placeMultipleComponentsOnSinglePage.checked

  const multiPageLayout = new MultiPageLayout({
    coreLayout,
    maximumPageSize: new YDimension(pageWidth, pageHeight),
    createProxyReferenceNodes: createProxyNodes,
    multipleComponentsOnSinglePage: placeComponentsOnSinglePage,
    additionalParentCount: Number.parseInt(document.getElementById('additionalParentCount').value),
    layoutCallback: ILayoutCallback.create(async result => {
      await applyLayoutResult(result, pageWidth, pageHeight)
    })
  })

  const multiPageLayoutData = new MultiPageLayoutData({
    nodeIds: key => key,
    edgeIds: key => key,
    nodeLabelIds: key => key,
    edgeLabelIds: key => key
  })

  setTimeout(() => {
    const adapter = new LayoutGraphAdapter(modelGraphComponent.graph)
    // Note that unlike other layouts, MultiPageLayout does not alter the input graph.
    // Instead, the result is available via the function set to the 'layoutCallback' property.
    adapter.applyLayout(multiPageLayout, multiPageLayoutData)
    layouting = false
  }, 0)
}

/**
 * Applies the result of the multi-page layout using a {@link MultiPageIGraphBuilder}.
 * @param {!MultiPageLayoutResult} multiPageLayoutResult
 * @param {number} pageWidth
 * @param {number} pageHeight
 * @returns {!Promise}
 */
async function applyLayoutResult(multiPageLayoutResult, pageWidth, pageHeight) {
  // use the MultiPageGraphBuilder to create a list of IGraph instances that represent the single pages
  const builder = new MultiPageIGraphBuilder(multiPageLayoutResult)
  builder.normalNodeDefaults.style = createDemoNodeStyle('demo-palette-21')
  builder.normalNodeDefaults.labels.style = createDemoNodeLabelStyle('demo-palette-21')
  builder.connectorNodeDefaults.style = createDemoNodeStyle('demo-palette-23')
  builder.connectorNodeDefaults.labels.style = createDemoNodeLabelStyle('demo-palette-23')
  builder.proxyNodeDefaults.style = createDemoNodeStyle('demo-palette-25')
  builder.proxyNodeDefaults.labels.style = createDemoNodeLabelStyle('demo-palette-25')
  builder.proxyReferenceNodeDefaults.style = createDemoNodeStyle('demo-palette-14')
  builder.proxyReferenceNodeDefaults.labels.style = createDemoNodeLabelStyle('demo-palette-14')
  builder.normalEdgeDefaults.style = createDemoEdgeStyle({
    colorSetName: 'demo-palette-21',
    showTargetArrow: false
  })
  builder.connectorEdgeDefaults.style = createDemoEdgeStyle({
    colorSetName: 'demo-palette-23',
    showTargetArrow: false
  })
  builder.proxyEdgeDefaults.style = createDemoEdgeStyle({
    colorSetName: 'demo-palette-25',
    showTargetArrow: false
  })
  builder.proxyReferenceEdgeDefaults.style = createDemoEdgeStyle({
    colorSetName: 'demo-palette-14'
  })

  // create the graphs
  viewGraphs = builder.createViewGraphs()
  setPageNumber(0)

  if (pageBoundsVisualCreator != null) {
    pageBoundsVisualCreator.pageWidth = pageWidth
    pageBoundsVisualCreator.pageHeight = pageHeight
  }

  document.getElementById('previousPage').disabled = true
  document.getElementById('nextPage').disabled = viewGraphs.length <= 1

  await showLoadingIndicator(false)
}

/**
 * @param {number} newPageNumber
 * @param {?INode} [targetNode=null]
 */
function setPageNumber(newPageNumber, targetNode = null) {
  graphComponent.highlightIndicatorManager.clearHighlights()
  graphComponent.focusIndicatorManager.focusedItem = null

  if (viewGraphs.length <= 0) {
    document.getElementById('previousPage').disabled = true
    document.getElementById('nextPage').disabled = true
    return
  }

  pageNumber =
    newPageNumber < 0
      ? 0
      : newPageNumber > viewGraphs.length - 1
      ? viewGraphs.length - 1
      : newPageNumber

  const pageNumberTextBox = document.getElementById('pageNumberTextBox')
  pageNumberTextBox.value = (pageNumber + 1).toString()
  pageNumberTextBox.setAttribute('min', '1')
  pageNumberTextBox.setAttribute('max', `${viewGraphs.length}`)

  graphComponent.graph = viewGraphs[pageNumber]
  graphComponent.updateContentRect()

  if (pageBoundsVisualCreator == null) {
    pageBoundsVisualCreator = new PageBoundsVisualCreator()
    graphComponent.backgroundGroup.addChild(
      pageBoundsVisualCreator,
      ICanvasObjectDescriptor.ALWAYS_DIRTY_INSTANCE
    )
  }
  pageBoundsVisualCreator.center = graphComponent.contentRect.center

  // place target node under mouse cursor
  if (targetNode !== null && graphComponent.graph.contains(targetNode)) {
    const targetCenter = targetNode.layout.center
    const mousePosition = graphComponent.lastMouseEvent.location
    const controlCenter = graphComponent.toWorldCoordinates(
      new Point(graphComponent.size.width * 0.5, graphComponent.size.height * 0.5)
    )
    graphComponent.zoomTo(
      targetCenter.subtract(mousePosition.subtract(controlCenter)),
      graphComponent.zoom
    )
    graphComponent.highlightIndicatorManager.addHighlight(targetNode)
  } else {
    graphComponent.fitGraphBounds()
  }

  document.getElementById('previousPage').disabled = !checkPageNumber(pageNumber - 1)
  document.getElementById('nextPage').disabled = !checkPageNumber(pageNumber + 1)
}

/**
 * "Jump" to a referencing node of a clicked auxiliary multi-page node.
 * @param {!INode} viewNode The multi page node that has been clicked
 */
function goToReferencingNode(viewNode) {
  // get the ID of the referencing node
  if (viewNode.tag && viewNode.tag.isReferenceNode) {
    const referencedNode = viewNode.tag.referencedNode
    if (referencedNode) {
      const targetPage = referencedNode.tag ? referencedNode.tag.pageNumber : -1
      if (checkPageNumber(targetPage)) {
        // open the page and center on the referencing node
        setPageNumber(targetPage, referencedNode)
      }
    }
  }
}

/**
 * Checks if the given page number is valid.
 * A valid page number lies between 0 and the number of pages.
 * @param {*} pageNo
 * @returns {boolean}
 */
function checkPageNumber(pageNo) {
  return !isNaN(pageNo) && viewGraphs && pageNo >= 0 && pageNo < viewGraphs.length
}

/**
 * Registers the JavaScript commands for the GUI elements, typically the
 * tool bar buttons, during the creation of this application.
 */
function registerCommands() {
  bindCommand("button[data-command='ZoomIn']", ICommand.INCREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='ZoomOut']", ICommand.DECREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='FitContent']", ICommand.FIT_GRAPH_BOUNDS, graphComponent)
  bindCommand("button[data-command='ZoomOriginal']", ICommand.ZOOM, graphComponent, 1.0)

  bindAction("button[data-command='PreviousPage']", () => {
    if (checkPageNumber(pageNumber - 1)) {
      setPageNumber(pageNumber - 1)
    }
  })
  bindAction("button[data-command='NextPage']", () => {
    if (checkPageNumber(pageNumber + 1)) {
      setPageNumber(pageNumber + 1)
    }
  })
  bindChangeListener("input[data-command='PageNumberTextBox']", page => {
    const pageNo = parseInt(page) - 1
    if (!isNaN(pageNo) && checkPageNumber(pageNo)) {
      setPageNumber(pageNo)
    }
  })

  bindChangeListener("select[data-command='SampleComboBox']", value => {
    if (value === 'yFiles Layout Namespaces') {
      document.getElementById('coreLayoutComboBox').value = 'Tree'
    }
    loadModelGraph(value)
  })

  bindAction("button[data-command='DoLayout']", async () => {
    await showLoadingIndicator(true)
    runMultiPageLayout()
  })
}

/**
 * Creates the core layout algorithms and populates the layouts box.
 */
function initializeCoreLayouts() {
  const hierarchicLayout = new HierarchicLayout({
    considerNodeLabels: true,
    integratedEdgeLabeling: true,
    orthogonalRouting: true
  })

  const organicLayout = new OrganicLayout({
    minimumNodeDistance: 10,
    deterministic: true
  })

  const treeLayout = new TreeLayout({
    defaultNodePlacer: new CompactNodePlacer()
  })
  treeLayout.prependStage(new TreeReductionStage())

  const additionalParentCount = document.getElementById('additionalParentCount')
  const coreLayoutComboBox = document.getElementById('coreLayoutComboBox')
  addOption(coreLayoutComboBox, 'Hierarchic', hierarchicLayout)
  addOption(coreLayoutComboBox, 'Circular', new CircularLayout())
  addOption(coreLayoutComboBox, 'Compact Orthogonal', new CompactOrthogonalLayout())
  addOption(coreLayoutComboBox, 'Organic', organicLayout)
  addOption(coreLayoutComboBox, 'Orthogonal', new OrthogonalLayout())
  addOption(coreLayoutComboBox, 'Tree', treeLayout)
  coreLayoutComboBox.selectedIndex = 0
  coreLayoutComboBox.addEventListener(
    'change',
    () => {
      additionalParentCount.disabled = coreLayoutComboBox.value !== 'Tree'
    },
    BrowserDetection.passiveEventListeners ? { passive: false } : false
  )
}

/**
 * Adds a new option to the given combo-box
 * @param {!HTMLSelectElement} comboBox The combo-box to extend.
 * @param {!string} text The text that describes the option.
 * @param {*} value The value object for this option.
 */
function addOption(comboBox, text, value) {
  const option = document.createElement('option')
  option.text = text
  option.myValue = value // use myValue because value would be converted to a string
  comboBox.add(option)
}

/**
 * Initializes the input modes for both graph controls.
 */
function initializeInputModes() {
  // create the input mode and disable selection and focus
  const inputMode = new GraphViewerInputMode({
    clickableItems: GraphItemTypes.NODE,
    selectableItems: GraphItemTypes.NONE,
    focusableItems: GraphItemTypes.NONE
  })

  // highlight nodes on hover
  inputMode.itemHoverInputMode.hoverItems = GraphItemTypes.NODE | GraphItemTypes.LABEL
  inputMode.itemHoverInputMode.addHoveredItemChangedListener(onHoveredItemChanged)

  // handle clicks on nodes
  inputMode.addItemClickedListener((sender, event) => {
    goToReferencingNode(event.item)
  })
  graphComponent.inputMode = inputMode

  // create the input mode for the model graph and disable selection and focus
  const modelInputMode = new GraphViewerInputMode({
    clickableItems: GraphItemTypes.NONE,
    selectableItems: GraphItemTypes.NONE,
    focusableItems: GraphItemTypes.NONE
  })
  // fit bounds on double-click
  modelInputMode.clickInputMode.addDoubleClickedListener(() => {
    modelGraphComponent.fitGraphBounds()
  })
  modelGraphComponent.inputMode = modelInputMode
}

/**
 * Add/Remove the hovered item to the highlight manager.
 * @param {!object} sender
 * @param {!HoveredItemChangedEventArgs} args
 */
function onHoveredItemChanged(sender, args) {
  // we use the highlight manager to highlight hovered items
  const manager = graphComponent.highlightIndicatorManager
  if (args.oldItem instanceof INode) {
    manager.removeHighlight(args.oldItem)
  } else if (args.oldItem instanceof ILabel) {
    manager.removeHighlight(args.oldItem.owner)
  }

  if (args.item instanceof INode) {
    manager.addHighlight(args.item)
  } else if (args.item instanceof ILabel) {
    manager.addHighlight(args.item.owner)
  }
}

/**
 * Loads the model graph and applies an initial multi-page layout.
 * @param {*} graphId
 */
async function loadModelGraph(graphId) {
  // show a notification because the multi-page layout takes some time
  await showLoadingIndicator(true)

  const filename =
    graphId === 'Pop Artists'
      ? 'resources/pop-artists-small.graphml'
      : 'resources/yfiles-layout-namespaces.graphml'

  await readGraph(new GraphMLIOHandler(), modelGraphComponent.graph, filename)
  // fit model graph to the component
  modelGraphComponent.fitGraphBounds()

  // fit the graph to the component
  graphComponent.fitGraphBounds()

  // calculate the multi-page layout
  runMultiPageLayout()
}

// noinspection JSIgnoredPromiseFromCall
run()
