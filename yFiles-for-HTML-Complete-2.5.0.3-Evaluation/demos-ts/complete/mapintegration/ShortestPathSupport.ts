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
  GraphComponent,
  GraphViewerInputMode,
  IEdge,
  IModelItem,
  INode,
  ItemClickedEventArgs,
  ShortestPath
} from 'yfiles'

let lastClickedNode: INode | null = null

export default class ShortestPathSupport {
  constructor(private graphComponent: GraphComponent, public graphMode: boolean) {
    ;(this.graphComponent.inputMode as GraphViewerInputMode)!.addItemClickedListener(
      (sender: object, args: ItemClickedEventArgs<IModelItem>) => {
        this.updateShortestPathHighlight(args.item as INode, this.graphMode)
      }
    )

    this.graphComponent.graph.addNodeRemovedListener(() => {
      this.graphComponent.highlightIndicatorManager.clearHighlights()
    })
    this.graphComponent.graph.addEdgeRemovedListener(() => {
      this.graphComponent.highlightIndicatorManager.clearHighlights()
    })
  }

  /**
   * Highlights the shortest path between the current clickNode and the last clicked node.
   */
  updateShortestPathHighlight(clickedNode: INode, graphMode: boolean): void {
    const highlightManager = this.graphComponent.highlightIndicatorManager
    const graph = this.graphComponent.graph

    if (graphMode) {
      if (lastClickedNode && graph.contains(lastClickedNode)) {
        const start = lastClickedNode
        // determine the shortest path using the Euclidean distances in the graph to weigh the edges
        const algorithm = new ShortestPath({
          source: start,
          sink: clickedNode,
          costs: (edge: IEdge): number =>
            edge.style.renderer.getPathGeometry(edge, edge.style).getPath()!.getLength(),
          directed: false
        })

        // highlight the shortest path
        highlightManager.clearHighlights()

        const result = algorithm.run(graph)
        result.edges.forEach(edge => {
          highlightManager.addHighlight(edge)
          const sourceNode = edge.sourceNode!
          const targetNode = edge.targetNode!
          highlightManager.addHighlight(sourceNode)
          highlightManager.addHighlight(targetNode)
          highlightManager.addHighlight(sourceNode.labels.first())
          highlightManager.addHighlight(targetNode.labels.first())
        })
        lastClickedNode = null
      } else {
        highlightManager.clearHighlights()
        highlightManager.addHighlight(clickedNode)
        highlightManager.addHighlight(clickedNode.labels.first())
        lastClickedNode = clickedNode
      }
    } else {
      lastClickedNode = null
    }
    this.graphComponent.invalidate()
  }

  updateHighlights(): void {
    const highlightManager = this.graphComponent.highlightIndicatorManager
    const highlightedItems = highlightManager.selectionModel!.toArray()
    highlightManager.clearHighlights()
    highlightedItems.forEach(item => {
      this.graphComponent.highlightIndicatorManager.addHighlight(item)
    })
  }

  clearHighlights(): void {
    this.graphComponent.highlightIndicatorManager.clearHighlights()
  }
}
