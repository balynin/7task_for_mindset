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
  AssistantNodePlacer,
  ChildPlacement,
  Class,
  DefaultNodePlacer,
  GraphComponent,
  GraphItemTypes,
  GraphViewerInputMode,
  IArrow,
  ICommand,
  IGraph,
  IMapper,
  INode,
  ItemCollection,
  ITreeLayoutNodePlacer,
  LayoutExecutor,
  LeftRightNodePlacer,
  License,
  Mapper,
  PolylineEdgeStyle,
  RootAlignment,
  ShowFocusPolicy,
  Size,
  TreeBuilder,
  TreeLayout,
  TreeLayoutData,
  TreeLayoutEdgeRoutingStyle
} from 'yfiles'

import VuejsNodeStyle from './VuejsNodeStyle.js'
import { showApp } from '../../resources/demo-app.js'
import orgChartData from './resources/OrgChartData.js'

import { fetchLicense } from '../../resources/fetch-license.js'

/**
 * Mapping of statuses to colors, used in the node style.
 */
const statusColors = {
  present: '#55B757',
  busy: '#E7527C',
  travel: '#9945E9',
  unavailable: '#8D8F91'
}

/**
 * @typedef {Object} Employee
 * @property {string} [position]
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string} fax
 * @property {string} businessUnit
 * @property {string} status
 * @property {string} icon
 * @property {Array.<Employee>} [subordinates]
 * @property {Employee} [parent]
 */

/**
 * @typedef {*} VueComponentWithGraphComponent
 */

/**
 * @param {!ThisTypedComponentOptionsWithArrayProps} component
 * @returns {!VueComponentWithGraphComponent}
 */
function isVueComponentWithGraphComponent(component) {
  return component['$graphComponent'] !== undefined
}

/**
 * A data object that will be shared by multiple Vue instances to keep them in sync with each other.
 * @type {{focusedNodeData: object}}
 */
const sharedData = {
  focusedNodeData: null
}

/**
 * @returns {!Promise}
 */
async function run() {
  License.value = await fetchLicense()

  /**
   * This Vue component is used to display the graph nodes. Its template is based on the Orgchart
   * Demo node template, but instead of using Template Bindings, Vuejs is used to keep the view in
   * sync with the data.
   */
  Vue.component('node', {
    template: '#vueNodeStyleTemplate',
    data() {
      return {
        zoom: 1,
        focused: false
      }
    },
    // the node tag is passed as a prop
    props: {
      tag: { type: Object }
    },
    computed: {
      statusColor() {
        const status = this.tag.status
        return statusColors[status]
      },
      positionFirstLine() {
        const words = this.tag.position ? this.tag.position.split(' ') : []
        while (words.join(' ').length > 20) {
          words.pop()
        }
        return words.join(' ')
      },
      positionSecondLine() {
        const words = this.tag.position ? this.tag.position.split(' ') : []
        const secondLine = []
        while (words.join(' ').length > 20) {
          secondLine.unshift(words.pop())
        }
        return secondLine.join(' ')
      }
    }
  })

  /**
   * This Vue component wraps a {@link GraphComponent}. It takes an {@link IGraph} as a prop
   * and emits a custom event `focused-item-changed` when the focused item of the
   * GraphComponent changes.
   */
  Vue.component('graph-component', {
    template: '<div class="graph-component"></div>',
    created() {
      // the GraphComponent is created but not appended to the DOM yet
      const graphComponent = new GraphComponent()
      this.$graphComponent = graphComponent

      // create a graph from the Orgchart data.
      createGraph(orgChartData, graphComponent.graph)

      graphComponent.focusIndicatorManager.showFocusPolicy = ShowFocusPolicy.ALWAYS
      // disable default highlight indicators
      graphComponent.selectionIndicatorManager.enabled = false
      graphComponent.focusIndicatorManager.enabled = false
      graphComponent.highlightIndicatorManager.enabled = false

      graphComponent.inputMode = createViewerInputMode()

      // apply tree layout to the graph
      doLayout(graphComponent.graph)

      // emit custom event 'focused-item-changed' whenever the focused item of the GraphControl changes
      graphComponent.focusIndicatorManager.addPropertyChangedListener(() => {
        this.$emit('focused-item-changed', graphComponent.focusIndicatorManager.focusedItem?.tag)
      })
    },
    mounted() {
      if (isVueComponentWithGraphComponent(this)) {
        // append the GraphComponent to the DOM when the Vue component is mounted
        this.$el.appendChild(this.$graphComponent.div)
        this.$graphComponent.div.style.height = '100%'
        this.$graphComponent.fitGraphBounds()
      }
    }
  })

  /**
   * Main Vue instance which starts the demo and serves as a mediator between other Vue instances.
   */
  new (Vue.extend({
    data: () => ({
      sharedData
    }),
    methods: {
      getGraphComponent() {
        return this.$refs.graphComponent !== undefined &&
          isVueComponentWithGraphComponent(this.$refs.graphComponent)
          ? this.$refs.graphComponent.$graphComponent
          : null
      },
      zoomIn() {
        ICommand.INCREASE_ZOOM.execute(null, this.getGraphComponent())
      },
      resetZoom() {
        ICommand.ZOOM.execute(1, this.getGraphComponent())
      },
      zoomOut() {
        ICommand.DECREASE_ZOOM.execute(null, this.getGraphComponent())
      },
      fitGraph() {
        ICommand.FIT_GRAPH_BOUNDS.execute(null, this.getGraphComponent())
      },
      /**
       * This is called when the custom `focused-item-changed` event is emitted on the
       * graph-control.
       * @param tag The tag of the currently focused node or null if no node is focused.
       */
      focusedItemChanged(tag) {
        // update shared state
        this.sharedData.focusedNodeData = tag
      }
    },
    mounted() {
      // run the demo
      showApp()
    }
  }))({
    el: '#yfiles-vue-app'
  })

  /**
   * Vue instance for the properties view in the right sidebar. Used to edit the data of the
   * currently selected graph item.
   */
  // eslint-disable-next-line no-undef,no-new
  new Vue({
    el: '#node-view',
    template: '#nodeViewTemplate',
    data: {
      sharedData
    }
  })

  /**
   * Creates a {@link GraphViewerInputMode} and restricts some functionality.
   */
  function createViewerInputMode() {
    return new GraphViewerInputMode({
      clickableItems: GraphItemTypes.NODE,
      selectableItems: GraphItemTypes.NONE,
      marqueeSelectableItems: GraphItemTypes.NONE,
      toolTipItems: GraphItemTypes.NONE,
      contextMenuItems: GraphItemTypes.NONE,
      focusableItems: GraphItemTypes.NODE
    })
  }

  /**
   * Create the Orgchart graph using a TreeSource.
   * @param nodesSource The source data in JSON format
   * @param graph The graph
   */
  function createGraph(nodesSource, graph) {
    const treeBuilder = new TreeBuilder(graph)
    const rootNodesSource = treeBuilder.createRootNodesSource(nodesSource)
    const childNodesSource = rootNodesSource.createChildNodesSource(data => data.subordinates)
    childNodesSource.addChildNodesSource(data => data.subordinates, childNodesSource)

    // use the VuejsNodeStyle, which uses a Vue component to display nodes
    // eslint-disable-next-line no-undef
    treeBuilder.graph.nodeDefaults.style = new VuejsNodeStyle(Vue.component('node'))
    treeBuilder.graph.nodeDefaults.size = new Size(285, 100)
    treeBuilder.graph.edgeDefaults.style = new PolylineEdgeStyle({
      stroke: '2px rgb(170, 170, 170)',
      targetArrow: IArrow.NONE
    })
    return treeBuilder.buildGraph()
  }

  // We need to load the 'view-layout-bridge' module explicitly to prevent tree-shaking
  // tools it from removing this dependency which is needed for 'applyLayout'.
  Class.ensure(LayoutExecutor)

  /**
   * Applies a tree layout like in the Orgchart demo.
   */
  function doLayout(tree) {
    const nodePlacerMapper = new Mapper()
    const assistantNodes = []
    tree.nodes.forEach(node => {
      if (tree.inDegree(node) === 0) {
        setNodePlacers(node, nodePlacerMapper, assistantNodes, tree)
      }
    })

    tree.applyLayout(
      new TreeLayout(),
      new TreeLayoutData({
        nodePlacers: nodePlacerMapper,
        assistantNodes: ItemCollection.from(assistantNodes)
      })
    )
  }

  function setNodePlacers(rootNode, nodePlacerMapper, assistantNodes, tree) {
    const employee = rootNode.tag
    if (employee !== null) {
      const layout = employee.layout
      switch (layout) {
        case 'rightHanging': {
          const newDefaultNodePlacer = new DefaultNodePlacer(
            ChildPlacement.VERTICAL_TO_RIGHT,
            RootAlignment.LEADING_ON_BUS,
            30,
            30
          )
          newDefaultNodePlacer.routingStyle = TreeLayoutEdgeRoutingStyle.FORK_AT_ROOT
          nodePlacerMapper.set(rootNode, newDefaultNodePlacer)
          break
        }
        case 'leftHanging': {
          const newDefaultNodePlacer1 = new DefaultNodePlacer(
            ChildPlacement.VERTICAL_TO_LEFT,
            RootAlignment.LEADING_ON_BUS,
            30,
            30
          )
          newDefaultNodePlacer1.routingStyle = TreeLayoutEdgeRoutingStyle.FORK_AT_ROOT
          nodePlacerMapper.set(rootNode, newDefaultNodePlacer1)
          break
        }
        case 'bothHanging': {
          const newLeftRightPlacer = new LeftRightNodePlacer()
          newLeftRightPlacer.placeLastOnBottom = false
          nodePlacerMapper.set(rootNode, newLeftRightPlacer)
          break
        }
        default: {
          nodePlacerMapper.set(
            rootNode,
            new DefaultNodePlacer(ChildPlacement.HORIZONTAL_DOWNWARD, RootAlignment.MEDIAN, 30, 30)
          )
          break
        }
      }

      const assistant = employee.assistant
      if (assistant && tree.inDegree(rootNode) > 0) {
        const inEdge = tree.inEdgesAt(rootNode).get(0)
        const parent = inEdge.sourceNode
        const oldParentPlacer = nodePlacerMapper.get(parent)
        const assistantNodePlacer = new AssistantNodePlacer()
        assistantNodePlacer.childNodePlacer = oldParentPlacer
        nodePlacerMapper.set(parent, assistantNodePlacer)
        assistantNodes.push(rootNode)
      }
    }

    tree.outEdgesAt(rootNode).forEach(outEdge => {
      const child = outEdge.targetNode
      setNodePlacers(child, nodePlacerMapper, assistantNodes, tree)
    })
  }
}

// noinspection JSIgnoredPromiseFromCall
run()
