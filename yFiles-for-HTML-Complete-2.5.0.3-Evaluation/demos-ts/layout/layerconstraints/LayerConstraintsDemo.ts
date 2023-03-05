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
  BaseClass,
  DefaultLabelStyle,
  EdgeSegmentLabelModel,
  GraphComponent,
  GraphEditorInputMode,
  GraphItemTypes,
  HierarchicLayout,
  HierarchicLayoutData,
  ICommand,
  IEdge,
  IGraph,
  IInputModeContext,
  INode,
  IPropertyObservable,
  License,
  Point,
  PropertyChangedEventArgs,
  Rect,
  Size,
  TemplateNodeStyle
} from 'yfiles'

import RandomGraphGenerator from '../../utils/RandomGraphGenerator'
import { bindAction, bindCommand, reportDemoError, showApp } from '../../resources/demo-app'

import { applyDemoTheme } from '../../resources/demo-styles'
import { fetchLicense } from '../../resources/fetch-license'

async function run(): Promise<void> {
  License.value = await fetchLicense()

  const graphComponent = new GraphComponent('graphComponent')
  applyDemoTheme(graphComponent)

  initializeInputMode(graphComponent)
  initializeGraph(graphComponent.graph)

  createGraph(graphComponent.graph)

  runLayout(graphComponent)

  initializeConverters()

  registerCommands(graphComponent)

  showApp(graphComponent)
}

async function runLayout(graphComponent: GraphComponent): Promise<void> {
  // create a new layout algorithm
  const hierarchicLayout = new HierarchicLayout({
    orthogonalRouting: true,
    fromScratchLayeringStrategy: 'hierarchical-topmost',
    integratedEdgeLabeling: true
  })

  // and layout data for it
  const hierarchicLayoutData = new HierarchicLayoutData({
    constraintIncrementalLayererAdditionalEdgeWeights: getEdgeWeight
  })
  const layerConstraints = hierarchicLayoutData.layerConstraints

  // assign constraints for all nodes in the graph
  for (const node of graphComponent.graph.nodes) {
    const data = node.tag as LayerConstraintsData | null
    if (data && data.constraints) {
      // Ensure that nodes with value 0 and 7 are always at the top and bottom, respectively
      if (data.value === 0) {
        layerConstraints.placeAtTop(node)
      }
      if (data.value === 7) {
        layerConstraints.placeAtBottom(node)
      }
      // All nodes can then be sorted into their respective layers by their value
      layerConstraints.nodeComparables.mapper.set(node, data.value)
    }
  }

  // perform the layout operation
  setUIDisabled(true)
  try {
    await graphComponent.morphLayout(hierarchicLayout, '1s', hierarchicLayoutData)
  } catch (error) {
    reportDemoError(error)
  } finally {
    setUIDisabled(false)
  }
}

/**
 * Disables the HTML elements of the UI and the input mode.
 *
 * @param disabled true if the elements should be disabled, false otherwise
 */
function setUIDisabled(disabled: boolean): void {
  ;(document.getElementById('newButton') as HTMLButtonElement).disabled = disabled
  ;(document.getElementById('enableAllConstraintsButton') as HTMLButtonElement).disabled = disabled
  ;(document.getElementById('disableAllConstraintsButton') as HTMLButtonElement).disabled = disabled
  ;(document.getElementById('layoutButton') as HTMLButtonElement).disabled = disabled
}

/**
 * Calculates the weight of an edge by translating its (first) label into an int.
 * It will return 1 if the label is not a correctly formatted double.
 */
function getEdgeWeight(edge: IEdge): number {
  // if edge has at least one label...
  if (edge.labels.size > 0) {
    // ..try to return it's value
    const weight = Number.parseInt(edge.labels.get(0).text)
    if (!Number.isNaN(weight)) {
      return weight
    }
  }
  return 1
}

/**
 * Initializes the input mode for interaction.
 */
function initializeInputMode(graphComponent: GraphComponent): void {
  const inputMode = new GraphEditorInputMode({
    nodeCreator: createNodeCallback,
    labelEditableItems: GraphItemTypes.EDGE | GraphItemTypes.EDGE_LABEL,
    showHandleItems: GraphItemTypes.ALL ^ GraphItemTypes.NODE
  })
  inputMode.addValidateLabelTextListener((sender, args) => {
    args.newText = args.newText.trim()
    if (args.newText.length === 0) {
      return
    }
    const result = Number.parseFloat(args.newText)
    if (!Number.isNaN(result)) {
      // only allow numbers between 0 and 100
      if (result > 100 && result <= 0) {
        args.cancel = true
      }
    }
  })

  // listener for the buttons on the nodes
  inputMode.addItemClickedListener((sender, args) => {
    if (args.item instanceof INode) {
      const node = args.item
      const location = args.location
      const layout = node.layout
      const constraints = node.tag
      if (constraints instanceof LayerConstraintsData) {
        if (constraints.constraints) {
          if (location.y > layout.y + layout.height * 0.5) {
            if (location.x < layout.x + layout.width * 0.3) {
              constraints.value = Math.max(0, constraints.value - 1)
            } else if (location.x > layout.x + layout.width * 0.7) {
              constraints.value = Math.min(7, constraints.value + 1)
            } else {
              constraints.constraints = !constraints.constraints
            }
          }
        } else {
          constraints.constraints = !constraints.constraints
        }
      }
    }
  })
  graphComponent.inputMode = inputMode
}

/**
 * Initializes the graph instance setting default styles and creates a small sample graph.
 */
function initializeGraph(graph: IGraph): void {
  // minimum size for nodes
  const size = new Size(60, 50)

  const defaultStyle = new TemplateNodeStyle('ConstraintNodeStyle')
  defaultStyle.minimumSize = size
  // set the style as the default for all new nodes
  graph.nodeDefaults.style = defaultStyle

  graph.nodeDefaults.size = size

  // create a simple label style
  const labelStyle = new DefaultLabelStyle({
    font: 'Arial',
    backgroundFill: 'white',
    autoFlip: true,
    insets: [3, 5, 3, 5]
  })

  // set the style as the default for all new labels
  graph.nodeDefaults.labels.style = labelStyle
  graph.edgeDefaults.labels.style = labelStyle
  graph.edgeDefaults.labels.layoutParameter = new EdgeSegmentLabelModel().createDefaultParameter()
}

/**
 * Clears the existing graph and creates a new random graph
 */
function createGraph(graph: IGraph): void {
  // remove all nodes and edges from the graph
  graph.clear()

  // create a new random graph
  new RandomGraphGenerator({
    $allowCycles: true,
    $allowMultipleEdges: false,
    $allowSelfLoops: false,
    $edgeCount: 25,
    $nodeCount: 20,
    nodeCreator: (graph: IGraph): INode => createNodeCallback(null!, graph, Point.ORIGIN, null)
  }).generate(graph)
}

/**
 * Binds commands to the buttons in the toolbar.
 */
function registerCommands(graphComponent: GraphComponent): void {
  const graph = graphComponent.graph
  bindCommand("button[data-command='ZoomIn']", ICommand.INCREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='ZoomOut']", ICommand.DECREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='FitContent']", ICommand.FIT_GRAPH_BOUNDS, graphComponent)

  bindAction("button[data-command='NewGraph']", () => {
    createGraph(graph)
    runLayout(graphComponent)
  })
  bindAction("button[data-command='EnableAllConstraints']", () =>
    setConstraintsEnabled(graph, true)
  )
  bindAction("button[data-command='DisableAllConstraints']", () =>
    setConstraintsEnabled(graph, false)
  )
  bindAction("button[data-command='Layout']", () => runLayout(graphComponent))
}

/**
 * Callback that actually creates the node and its business object.
 */
function createNodeCallback(
  context: IInputModeContext,
  graph: IGraph,
  location: Point,
  parent: INode | null
): INode {
  const bounds = Rect.fromCenter(location, graph.nodeDefaults.size)
  return graph.createNode({
    layout: bounds,
    tag: new LayerConstraintsData(Math.round(Math.random() * 7), Math.random() < 0.9)
  })
}

/**
 * Enables or disables all constraints for the graph's nodes.
 */
function setConstraintsEnabled(graph: IGraph, enabled: boolean): void {
  for (const node of graph.nodes) {
    const data = node.tag
    if (data) {
      data.constraints = enabled
    }
  }
}

/**
 * Initializes the converters for the constraint node styles.
 */
function initializeConverters(): void {
  const backgroundconverter = (value: any): string => {
    if (Number.isInteger(value)) {
      switch (value) {
        case 0:
          return 'yellowgreen'
        case 7:
          return 'indianred'
        default: {
          return `rgb(${Math.round((value * 255) / 7)}, ${Math.round((value * 255) / 7)}, 255)`
        }
      }
    }
    return '#FFF'
  }

  const textcolorconverter = (value: any): string => {
    if (Number.isInteger(value)) {
      if (value === 0 || value > 3) {
        return 'black'
      }
    }
    return 'white'
  }

  const constraintconverter = (value: any): string => {
    switch (value) {
      case 0:
        return 'First'
      case 7:
        return 'Last'
      default:
        return value.toString()
    }
  }

  const constraintsvisibilityconverter = (constraints: boolean): string =>
    constraints ? 'visible' : 'hidden'
  const noconstraintsvisibilityconverter = (constraints: boolean): string =>
    constraints ? 'hidden' : 'visible'

  // create an object to store the converter functions
  TemplateNodeStyle.CONVERTERS.layerconstraintsdemo = {
    backgroundconverter,
    textcolorconverter,
    constraintconverter,
    constraintsvisibilityconverter,
    noconstraintsvisibilityconverter
  }
}

// property changed support - needed for data-binding to the Control Style
const VALUE_CHANGED_EVENT_ARGS = new PropertyChangedEventArgs('value')
const CONSTRAINTS_CHANGED_EVENT_ARGS = new PropertyChangedEventArgs('constraints')

/**
 * A business object that represents the weight (through property "Value") of the node and whether or not its weight
 * should be taken into account as a layer constraint.
 */
class LayerConstraintsData extends BaseClass(IPropertyObservable) {
  private _value: number
  private _constraints: boolean
  private readonly propertyChangedListeners: ((
    sender: this,
    args: PropertyChangedEventArgs
  ) => void)[] = []

  /**
   * Creates a new instance of LayerConstraintsData.
   */
  constructor(value: number, constraints: boolean) {
    super()
    this._value = value
    this._constraints = constraints
  }

  /**
   * The weight of the object. An object with a lower number will be layered in a higher layer.
   * The number 0 means the node should be the in the first, 7 means it should be the last layer.
   */
  get value(): number {
    return this._value
  }

  /**
   * The weight of the object. An object with a lower number will be layered in a higher layer.
   * The number 0 means the node should be the in the first, 7 means it should be the last layer.
   */
  set value(value: number) {
    const oldVal = this._value
    this._value = value
    if (oldVal !== value && this.propertyChanged) {
      this.propertyChanged(this, VALUE_CHANGED_EVENT_ARGS)
    }
  }

  /**
   * Describes whether or not the constraint is active. If `true`, the constraint will be taken into
   * account by the layout algorithm.
   */
  get constraints(): boolean {
    return this._constraints
  }

  /**
   * Describes whether or not the constraint is active. If `true`, the constraint will be taken into
   * account by the layout algorithm.
   */
  set constraints(value: boolean) {
    const oldConstraints = this._constraints
    this._constraints = value
    if (oldConstraints !== value && this.propertyChanged) {
      this.propertyChanged(this, CONSTRAINTS_CHANGED_EVENT_ARGS)
    }
  }

  /**
   * Adds a listener for property changes
   */
  addPropertyChangedListener(
    listener: (sender: this, args: PropertyChangedEventArgs) => void
  ): void {
    this.propertyChangedListeners.push(listener)
  }

  /**
   * Removes a listener for property changes
   */
  removePropertyChangedListener(
    listener: (sender: this, args: PropertyChangedEventArgs) => void
  ): void {
    const index = this.propertyChangedListeners.indexOf(listener)
    if (index >= 0) {
      this.propertyChangedListeners.splice(index, 1)
    }
  }

  /**
   * Notifies all registered listeners when a property changed.
   */
  propertyChanged(sender: this, args: PropertyChangedEventArgs): void {
    for (const listener of this.propertyChangedListeners) {
      listener(sender, args)
    }
  }
}

// noinspection JSIgnoredPromiseFromCall
run()
