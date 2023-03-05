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
  EventArgs,
  EventRecognizers,
  GraphComponent,
  GraphEditorInputMode,
  GroupNodeStyle,
  ICommand,
  IGraph,
  IHitTestable,
  IHitTester,
  IInputModeContext,
  IModelItem,
  INode,
  INodeInsetsProvider,
  Insets,
  InteriorLabelModel,
  KeyEventRecognizers,
  License,
  MoveInputMode,
  Point,
  Rect,
  ShowPortCandidates,
  Size
} from 'yfiles'

import { bindAction, bindChangeListener, bindCommand, showApp } from '../../resources/demo-app.js'
import { applyDemoTheme, colorSets, createDemoEdgeStyle } from '../../resources/demo-styles.js'
import { fetchLicense } from '../../resources/fetch-license.js'

/** @type {GraphComponent} */
let graphComponent

/** @type {MoveInputMode} */
let moveUnselectedInputMode

/**
 * @returns {!Promise}
 */
async function run() {
  License.value = await fetchLicense()
  // initialize the GraphComponent
  initializeGraph()

  initializeInputModes()

  registerCommands()

  // pre-select the 'Drag at Top' mode
  const moveModeSelect = document.querySelector("select[data-command='moveModeChanged']")
  moveModeSelect.value = 'Drag at Top'
  onMoveModeChanged()

  showApp(graphComponent)
}

/**
 * Initializes the graph instance setting default styles and creating a small sample graph.
 */
function initializeGraph() {
  graphComponent = new GraphComponent('graphComponent')
  applyDemoTheme(graphComponent)

  const graph = graphComponent.graph

  // set the default node style
  graph.nodeDefaults.style = new GroupNodeStyle({
    tabFill: colorSets['demo-orange'].fill,
    contentAreaInsets: Insets.EMPTY
  })
  graph.nodeDefaults.size = new Size(60, 80)
  graph.nodeDefaults.labels.layoutParameter = InteriorLabelModel.NORTH
  graph.nodeDefaults.labels.style = new DefaultLabelStyle({ textFill: 'white' })

  graph.edgeDefaults.style = createDemoEdgeStyle()

  // Create a sample node
  graph.addLabel(graph.createNode(), 'Node')

  graphComponent.fitGraphBounds()
}

/**
 * Creates and registers the input modes.
 */
function initializeInputModes() {
  const graphEditorInputMode = new GraphEditorInputMode()

  // Always add a label to the newly created nodes
  graphEditorInputMode.nodeCreator = (context, graph, location) => {
    const node = graph.createNodeAt(location)
    graph.addLabel(node, 'Node')
    return node
  }

  // Enable the MoveUnselectedInputMode
  moveUnselectedInputMode = graphEditorInputMode.moveUnselectedInputMode
  moveUnselectedInputMode.enabled = true
  // The recognizers should behave differently, depending on what mode is selected in the demo
  moveUnselectedInputMode.pressedRecognizer = EventRecognizers.createAndRecognizer(
    moveUnselectedInputMode.pressedRecognizer,
    isRecognized
  )
  moveUnselectedInputMode.hoverRecognizer = EventRecognizers.createAndRecognizer(
    moveUnselectedInputMode.hoverRecognizer,
    isRecognized
  )

  graphComponent.inputMode = graphEditorInputMode
}

/**
 * Called when the mode combo box has changed:
 * if necessary it changes the hit testable for the move input mode
 */
function onMoveModeChanged() {
  const moveModeSelect = document.getElementById('moveModeComboBox')
  const selectedIndex = moveModeSelect.selectedIndex
  if (selectedIndex === 2) {
    // mode 2 (only top region): set a custom hit testable which detects hits only at the top of
    // the nodes
    moveUnselectedInputMode.hitTestable = new TopInsetsHitTestable(
      moveUnselectedInputMode.hitTestable,
      graphComponent.inputMode
    )
  } else if (moveUnselectedInputMode.hitTestable instanceof TopInsetsHitTestable) {
    // all other modes: if a TopInsetsHitTestable is the current hit testable, restore the original
    // hit testable
    moveUnselectedInputMode.hitTestable = moveUnselectedInputMode.hitTestable.original
  }
  const moveEnabledButton = document.getElementById('toggleMoveEnabled')
  const moveEnabledLabel = document.querySelector('label[for="toggleMoveEnabled"]')
  const showMoveEnabledButton = selectedIndex === 3
  moveEnabledButton.style.display = showMoveEnabledButton ? 'inline-block' : 'none'
  moveEnabledLabel.style.display = showMoveEnabledButton ? 'inline-block' : 'none'
}

/**
 * Called when the edge creation mode combo box has changed:
 * Adjusts the edge creation behavior.
 */
function onEdgeCreationModeChanged() {
  const edgeCreationModeSelect = document.getElementById('edgeCreationModeComboBox')
  const selectedIndex = edgeCreationModeSelect.selectedIndex
  const geim = graphComponent.inputMode
  if (selectedIndex === 0) {
    geim.moveUnselectedInputMode.priority = 41
    geim.moveInputMode.priority = 40
    geim.createEdgeInputMode.startOverCandidateOnly = false
    geim.createEdgeInputMode.showPortCandidates = ShowPortCandidates.TARGET
  } else if (selectedIndex === 1) {
    geim.moveUnselectedInputMode.priority = 47
    geim.moveInputMode.priority = 46
    geim.createEdgeInputMode.startOverCandidateOnly = true
    geim.createEdgeInputMode.showPortCandidates = ShowPortCandidates.ALL
  }
}

/**
 * A custom EventRecognizer to be used as modifier recognizer.
 *
 * Has to return true if the move input mode is allowed to move a node.
 * @param {*} source
 * @param {!EventArgs} args
 * @returns {boolean}
 */
function isRecognized(source, args) {
  // return the value according to the Mode combo box
  const moveModeSelect = document.getElementById('moveModeComboBox')
  switch (moveModeSelect.selectedIndex) {
    case 0: // always
    case 2: // on top (this is handled by custom IHitTestable)
      // the same as only enabling the MoveUnselectedInputMode without changing the recognizers
      return true
    case 1: // shift is not pressed
      return !KeyEventRecognizers.SHIFT_IS_DOWN(source, args)
    case 3: // if enabled
      return document.getElementById('toggleMoveEnabled').checked
    default:
      return false
  }
}

/**
 * Wires up the UI.
 */
function registerCommands() {
  bindCommand("button[data-command='FitContent']", ICommand.FIT_GRAPH_BOUNDS, graphComponent)
  bindCommand("button[data-command='ZoomIn']", ICommand.INCREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='ZoomOut']", ICommand.DECREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='ZoomOriginal']", ICommand.ZOOM, graphComponent, 1.0)
  bindChangeListener("select[data-command='moveModeChanged']", onMoveModeChanged)
  bindChangeListener("select[data-command='edgeCreationModeChanged']", onEdgeCreationModeChanged)

  bindAction("input[data-command='ToggleClassicMode']", () => {
    const mode = graphComponent.inputMode.moveInputMode
    mode.enabled = !mode.enabled
  })
}

/**
 * An IHitTestable implementation which detects hits only on top insets of a node.
 *
 * This instance keeps a reference to the original hit testable
 * so the original behavior can be restored conveniently.
 */
class TopInsetsHitTestable extends BaseClass(IHitTestable) {
  /**
   * Creates a new instance of {@link TopInsetsHitTestable}.
   * @param {!IHitTestable} original
   * @param {!GraphEditorInputMode} inputMode
   */
  constructor(original, inputMode) {
    super()
    this.inputMode = inputMode
    // Gets the original hit testable.
    this.original = original
  }

  /**
   * Test whether the given location is a valid hit.
   *
   * The hit is considered as valid if the location lies inside a node's top insets.
   * @param {!IInputModeContext} context - The current input mode context.
   * @param {!Point} location - The location to test.
   * @returns {boolean}
   */
  isHit(context, location) {
    // get the current hit tester from the input mode context
    const inputModeContext = this.inputMode.inputModeContext
    const hitTester = inputModeContext.lookup(IHitTester.$class)
    if (hitTester) {
      // get an enumerator over all elements at the given location
      const hits = hitTester.enumerateHits(inputModeContext, location)
      const enumerator = hits.getEnumerator()
      while (enumerator.moveNext()) {
        const item = enumerator.current
        // if the element is a node and its lookup returns an INodeInsetsProvider
        if (item instanceof INode) {
          const insetsProvider = item.lookup(INodeInsetsProvider.$class)
          if (insetsProvider) {
            // determine whether the given location lies inside the top insets
            const insets = insetsProvider.getInsets(item)
            const topInset = new Rect(item.layout.x, item.layout.y, item.layout.width, insets.top)
            if (topInset.contains(location)) {
              // if so: return true
              return true
            }
            // else: continue iteration
          }
        }
      }
    }
    // no hits found: return false
    return false
  }
}

// noinspection JSIgnoredPromiseFromCall
run()
