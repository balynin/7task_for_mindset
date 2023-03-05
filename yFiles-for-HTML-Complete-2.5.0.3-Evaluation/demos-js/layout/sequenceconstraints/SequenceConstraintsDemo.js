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
  GraphComponent,
  GraphEditorInputMode,
  GraphItemTypes,
  HierarchicLayout,
  HierarchicLayoutData,
  ICommand,
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

import RandomGraphGenerator from '../../utils/RandomGraphGenerator.js'
import { bindAction, bindCommand, reportDemoError, showApp } from '../../resources/demo-app.js'

import { applyDemoTheme } from '../../resources/demo-styles.js'
import { fetchLicense } from '../../resources/fetch-license.js'

/**
 * @returns {!Promise}
 */
async function run() {
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

/**
 * @param {!GraphComponent} graphComponent
 * @returns {!Promise}
 */
async function runLayout(graphComponent) {
  // create a new layout algorithm
  const hierarchicLayout = new HierarchicLayout({
    orthogonalRouting: true
  })

  // and layout data for it
  const hierarchicLayoutData = new HierarchicLayoutData()

  // this is the factory that we apply the constraints to
  const sequenceConstraints = hierarchicLayoutData.sequenceConstraints

  // assign constraints for the nodes in the graph
  for (const node of graphComponent.graph.nodes) {
    const data = node.tag
    if (data && data.constraints) {
      if (data.value === 0) {
        sequenceConstraints.placeAtHead(node)
      } else if (data.value === 7) {
        sequenceConstraints.placeAtTail(node)
      } else {
        sequenceConstraints.itemComparables.mapper.set(node, data.value)
      }
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
 * @param {boolean} disabled true if the elements should be disabled, false otherwise
 */
function setUIDisabled(disabled) {
  document.getElementById('newButton').disabled = disabled
  document.getElementById('enableAllConstraintsButton').disabled = disabled
  document.getElementById('disableAllConstraintsButton').disabled = disabled
  document.getElementById('layoutButton').disabled = disabled
}

/**
 * Initializes the input mode for interaction.
 * @param {!GraphComponent} graphComponent
 */
function initializeInputMode(graphComponent) {
  const inputMode = new GraphEditorInputMode({
    nodeCreator: createNodeCallback,
    labelEditableItems: GraphItemTypes.NONE,
    showHandleItems: GraphItemTypes.ALL ^ GraphItemTypes.NODE
  })

  // listener for the buttons on the nodes
  inputMode.addItemClickedListener((sender, args) => {
    if (INode.isInstance(args.item)) {
      const node = args.item
      const location = args.location
      const layout = node.layout
      const constraints = node.tag
      if (constraints instanceof SequenceConstraintsData) {
        if (constraints.constraints) {
          if (location.y > layout.y + layout.height * 0.5) {
            if (location.x < layout.x + layout.width * 0.3) {
              node.tag.value = Math.max(0, constraints.value - 1)
            } else if (location.x > layout.x + layout.width * 0.7) {
              node.tag.value = Math.min(7, constraints.value + 1)
            } else {
              node.tag.constraints = !node.tag.constraints
            }
          }
        } else {
          node.tag.constraints = !node.tag.constraints
        }
      }
    }
  })

  graphComponent.inputMode = inputMode
}

/**
 * Initializes the graph instance setting default styles and creates a small sample graph.
 * @param {!IGraph} graph
 */
function initializeGraph(graph) {
  // minimum size for nodes
  const size = new Size(60, 50)

  const defaultStyle = new TemplateNodeStyle('ConstraintNodeStyle')
  defaultStyle.minimumSize = size
  // set the style as the default for all new nodes
  graph.nodeDefaults.style = defaultStyle

  graph.nodeDefaults.size = size
}

/**
 * Clears the existing graph and creates a new random graph
 * @param {!IGraph} graph
 */
function createGraph(graph) {
  // remove all nodes and edges from the graph
  graph.clear()

  // create a new random graph
  new RandomGraphGenerator({
    $allowCycles: true,
    $allowMultipleEdges: false,
    $allowSelfLoops: false,
    $edgeCount: 25,
    $nodeCount: 20,
    nodeCreator: graph => createNodeCallback(null, graph, Point.ORIGIN, null)
  }).generate(graph)
}

/**
 * Binds commands to the buttons in the toolbar.
 * @param {!GraphComponent} graphComponent
 */
function registerCommands(graphComponent) {
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
 * @param {!IInputModeContext} context
 * @param {!IGraph} graph
 * @param {!Point} location
 * @param {?INode} parent
 * @returns {!INode}
 */
function createNodeCallback(context, graph, location, parent) {
  const bounds = Rect.fromCenter(location, graph.nodeDefaults.size)
  return graph.createNode({
    layout: bounds,
    tag: new SequenceConstraintsData(Math.round(Math.random() * 7), Math.random() < 0.9)
  })
}

/**
 * Enables or disables all constraints for the graph's nodes.
 * @param {!IGraph} graph
 * @param {boolean} enabled
 */
function setConstraintsEnabled(graph, enabled) {
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
function initializeConverters() {
  const backgroundconverter = value => {
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

  const textcolorconverter = value => {
    if (Number.isInteger(value)) {
      if (value === 0 || value > 3) {
        return 'black'
      }
    }
    return 'white'
  }

  const constraintconverter = value => {
    switch (value) {
      case 0:
        return 'First'
      case 7:
        return 'Last'
      default:
        return value.toString()
    }
  }

  const constraintsvisibilityconverter = constraints => (constraints ? 'visible' : 'hidden')
  const noconstraintsvisibilityconverter = constraints => (constraints ? 'hidden' : 'visible')

  // create an object to store the converter functions
  TemplateNodeStyle.CONVERTERS.sequenceconstraintsdemo = {
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
 * should be taken into account as a sequence constraint.
 */
class SequenceConstraintsData extends BaseClass(IPropertyObservable) {
  /**
   * Creates a new instance of SequenceConstraintsData.
   * @param {number} value
   * @param {boolean} constraints
   */
  constructor(value, constraints) {
    super()
    this.propertyChangedListeners = []
    this._value = value
    this._constraints = constraints
  }

  /**
   * The weight of the object. And object with a lower number will be displayed to the left.
   * The number 0 means the node should be the first, 7 means it should be the last.
   * @type {number}
   */
  get value() {
    return this._value
  }

  /**
   * The weight of the object. And object with a lower number will be displayed to the left.
   * The number 0 means the node should be the first, 7 means it should be the last.
   * @type {number}
   */
  set value(value) {
    const oldVal = this._value
    this._value = value
    if (oldVal !== value && this.propertyChanged) {
      this.propertyChanged(this, VALUE_CHANGED_EVENT_ARGS)
    }
  }

  /**
   * Describes whether or not the constraint is active. If `true`, the constraint will be taken into
   * account by the layout algorithm.
   * @type {boolean}
   */
  get constraints() {
    return this._constraints
  }

  /**
   * Describes whether or not the constraint is active. If `true`, the constraint will be taken into
   * account by the layout algorithm.
   * @type {boolean}
   */
  set constraints(value) {
    const oldConstraints = this._constraints
    this._constraints = value
    if (oldConstraints !== value && this.propertyChanged) {
      this.propertyChanged(this, CONSTRAINTS_CHANGED_EVENT_ARGS)
    }
  }

  /**
   * Adds a listener for property changes
   * @param {!function} listener
   */
  addPropertyChangedListener(listener) {
    this.propertyChangedListeners.push(listener)
  }

  /**
   * Removes a listener for property changes
   * @param {!function} listener
   */
  removePropertyChangedListener(listener) {
    const index = this.propertyChangedListeners.indexOf(listener)
    if (index >= 0) {
      this.propertyChangedListeners.splice(index, 1)
    }
  }

  /**
   * Notifies all registered listeners when a property changed.
   * @param {*} sender
   * @param {!PropertyChangedEventArgs} args
   */
  propertyChanged(sender, args) {
    for (const listener of this.propertyChangedListeners) {
      listener(sender, args)
    }
  }
}

// noinspection JSIgnoredPromiseFromCall
run()
