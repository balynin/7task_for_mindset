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
  DefaultEdgePathCropper,
  GeneralPath,
  GraphBuilder,
  GraphComponent,
  GraphEditorInputMode,
  ICommand,
  IGraph,
  ImageNodeStyle,
  License,
  PolylineEdgeStyle,
  Rect,
  Size,
  Stroke
} from 'yfiles'

import { bindCommand, showApp } from '../../resources/demo-app'
import { LensInputMode } from './LensInputMode'
import { colorSets, initDemoStyles } from '../../resources/demo-styles'
import { deviceIcons, networkData } from './resources/network-sample'
import { fetchLicense } from '../../resources/fetch-license'

let graphComponent: GraphComponent = null!
let lensInputMode: LensInputMode = null!

async function run(): Promise<void> {
  License.value = await fetchLicense()

  graphComponent = new GraphComponent('#graphComponent')

  const graphEditorInputMode = new GraphEditorInputMode({
    // Some configurations for a better user experience in this demo.
    // All these settings can be changed.
    focusableItems: 'none',
    showHandleItems: 'none',
    allowCreateNode: false
  })

  // Create the input mode that implements the magnifying glass and add it to the input mode
  // of the graph component
  lensInputMode = new LensInputMode()
  graphEditorInputMode.add(lensInputMode)

  graphComponent.inputMode = graphEditorInputMode
  // Decrease the zoom of the graphComponent to make sure the magnifying glass is visible
  graphComponent.zoom = 0.5

  initDemoStyles(graphComponent.graph)
  populateGraph(graphComponent.graph)
  graphComponent.fitGraphBounds()

  initializeUI()

  showApp(graphComponent)
}

/**
 * Creates the sample graph.
 * @param graph The graph of the graphComponent
 */
function populateGraph(graph: IGraph): void {
  // Set default graph item styling
  graph.nodeDefaults.size = new Size(40, 40)
  graph.edgeDefaults.style = new PolylineEdgeStyle({
    stroke: new Stroke({
      thickness: 5,
      fill: colorSets['demo-green'].fill,
      lineCap: 'round'
    })
  })
  graph.decorator.portDecorator.edgePathCropperDecorator.setImplementation(
    new DefaultEdgePathCropper({ cropAtPort: false, extraCropLength: 10.0 })
  )

  // Create shared image node styles
  const deviceStyles = Object.getOwnPropertyNames(deviceIcons).reduce((obj, name) => {
    const circle = new GeneralPath()
    circle.appendEllipse(new Rect(0, 0, 1, 1), false)

    obj[name] = new ImageNodeStyle({ image: (deviceIcons as any)[name], normalizedOutline: circle })
    return obj
  }, {} as Record<string, ImageNodeStyle>)

  // Build the graph
  const graphBuilder = new GraphBuilder(graph)
  graphBuilder.createNodesSource({
    data: networkData.nodeList,
    id: 'data.id',
    tag: 'data',
    layout: dataItem => Rect.fromCenter(dataItem.layout, graph.nodeDefaults.size),
    style: dataItem => deviceStyles[dataItem.data.type]
  })
  graphBuilder.createEdgesSource({
    data: networkData.edgeList,
    sourceId: 'source',
    targetId: 'target'
  })
  graphBuilder.buildGraph()
}

/**
 * Initializes the UI.
 */
function initializeUI(): void {
  bindCommand("button[data-command='ZoomIn']", ICommand.INCREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='ZoomOut']", ICommand.DECREASE_ZOOM, graphComponent)
  bindCommand("button[data-command='FitContent']", ICommand.FIT_GRAPH_BOUNDS, graphComponent)
  bindCommand("button[data-command='ZoomOriginal']", ICommand.ZOOM, graphComponent, 1.0)

  const zoomSelectElement = document.querySelector<HTMLSelectElement>(
    "select[data-command='lensZoom']"
  )!
  zoomSelectElement.addEventListener('change', evt => {
    lensInputMode.zoomFactor = parseInt(zoomSelectElement.value)
  })
  zoomSelectElement.selectedIndex = 1

  graphComponent.addZoomChangedListener(() => {
    const label = document.querySelector<HTMLElement>('#zoomLabel')!
    label.textContent = String(Math.round(graphComponent.zoom * 100) / 100)
  })
}

// noinspection JSIgnoredPromiseFromCall
run()
