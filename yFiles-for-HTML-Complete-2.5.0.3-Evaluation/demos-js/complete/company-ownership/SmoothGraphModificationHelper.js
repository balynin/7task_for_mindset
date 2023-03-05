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
  FreeNodePortLocationModel,
  PlaceNodesAtBarycenterStage,
  PlaceNodesAtBarycenterStageData,
  SimplePort
} from 'yfiles'

/**
 * Prepares the graph for running a smooth animation so that the new nodes that are added
 * in the visualization appear near their neighbors.
 * @param {!function} modification The actions to be taken
 * @param {!TGraph} graph The given graph
 * @template {IGraph} TGraph
 */
export function modifyGraph(modification, graph) {
  const newNodes = []
  const newEdges = []
  const newNodeCollector = (sender, evt) => newNodes.push(evt.item)
  const newEdgeCollector = (sender, evt) => newEdges.push(evt.item)

  function getSimulatedParameter(port, simulatedOwner) {
    const dummyPort = new SimplePort({
      owner: simulatedOwner,
      locationParameter: port.locationParameter
    })
    return FreeNodePortLocationModel.INSTANCE.createParameter(port.owner, dummyPort.location)
  }

  const edgeChangedCollector = (sender, evt) => {
    graph.setPortLocationParameter(
      evt.item.sourcePort,
      getSimulatedParameter(evt.item.sourcePort, evt.sourcePortOwner)
    )
    graph.setPortLocationParameter(
      evt.item.targetPort,
      getSimulatedParameter(evt.item.targetPort, evt.targetPortOwner)
    )
  }

  graph.addNodeCreatedListener(newNodeCollector)
  graph.addEdgeCreatedListener(newEdgeCollector)
  graph.addEdgePortsChangedListener(edgeChangedCollector)
  modification(graph)
  graph.removeNodeCreatedListener(newNodeCollector)
  graph.removeEdgeCreatedListener(newEdgeCollector)
  graph.removeEdgePortsChangedListener(edgeChangedCollector)

  // first, we place the new nodes at the barycenter of their neighbors
  graph.applyLayout({
    layout: new PlaceNodesAtBarycenterStage({
      considerGrouping: true,
      removeBends: true,
      resetPorts: true
    }),
    layoutData: new PlaceNodesAtBarycenterStageData({ affectedNodes: newNodes })
  })

  // then we reset the new edges so that they grow out of their source nodes by placing the target port at
  // the source port's location
  newEdges.forEach(e => {
    graph.clearBends(e)
    graph.setPortLocationParameter(
      e.targetPort,
      FreeNodePortLocationModel.INSTANCE.createParameter(e.targetPort.owner, e.sourcePort.location)
    )
  })
}
