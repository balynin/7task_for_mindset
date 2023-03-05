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
import { DemoConfiguration } from './DemoConfiguration'
import {
  IArrow,
  IEdge,
  IEdgeStyle,
  IGraph,
  IInputModeContext,
  INode,
  INodeStyle,
  Point,
  PolylineEdgeStyle,
  Rect,
  Size,
  WebGL2PolylineEdgeStyle,
  WebGL2ShapeNodeShape,
  WebGL2ShapeNodeStyle
} from 'yfiles'
import VuejsNodeStyle from '../../utils/VuejsNodeStyle'

export type Employee = {
  position?: string
  name: string
  email: string
  phone: string
  fax: string
  businessUnit: string
  status: string
  icon: string
  subordinates?: Employee[]
  parent?: Employee
}

export default class OrgChartDemoConfiguration extends DemoConfiguration {
  graphResourcePath = 'resources/orgchart.json'

  svgThreshold = 0.25

  private webGL2GroupNodeStyle = new WebGL2ShapeNodeStyle('rectangle', '#bbb')
  private webGL2EdgeStyle = new WebGL2PolylineEdgeStyle()

  edgeStyleProvider = (edge: IEdge, graph: IGraph): IEdgeStyle => {
    return graph.edgeDefaults.getStyleInstance()
  }

  nodeStyleProvider = (node: INode, graph: IGraph): INodeStyle => {
    return graph.nodeDefaults.getStyleInstance()
  }

  webGL2EdgeStyleProvider = (edge: IEdge, graph: IGraph): WebGL2PolylineEdgeStyle => {
    return this.webGL2EdgeStyle
  }

  webGL2NodeStyleProvider = (node: INode, graph: IGraph) => {
    if (graph.isGroupNode(node)) {
      return this.webGL2GroupNodeStyle
    } else {
      const color = this.getColor(node.tag.status)
      return new WebGL2ShapeNodeStyle(WebGL2ShapeNodeShape.RECTANGLE, color)
    }
  }

  nodeCreator = (
    context: IInputModeContext,
    graph: IGraph,
    location: Point,
    parent: INode | null
  ): INode | null => {
    return null
  }

  async initializeStyleDefaults(graph: IGraph): Promise<void> {
    return new Promise(resolve => {
      // use the VuejsNodeStyle to display the nodes through a svg template
      // in this svg template you can see three styles in three zoom levels
      graph.nodeDefaults.style = new VuejsNodeStyle(this.nodeStyleTemplate)
      graph.nodeDefaults.size = new Size(285, 100)
      graph.edgeDefaults.style = new PolylineEdgeStyle({
        stroke: '2px rgb(170, 170, 170)',
        targetArrow: IArrow.NONE
      })
      resolve()
    })
  }

  protected createNode(graph: IGraph, id: any, layout: Rect, nodeData: any) {
    const node = graph.createNode({
      layout: layout,
      tag: nodeData.tag
    })
    return node
  }

  private getColor(status: string) {
    switch (status) {
      case 'present':
        return '#55B757'
      case 'busy':
        return '#E7527C'
      case 'travel':
        return '#9945E9'
      case 'unavailable':
        return '#8D8F91'
      default:
        return '#ffffff'
    }
  }

  private nodeStyleTemplate = `<g>
<use href="#node-dropshadow" x="-10" y="-5"></use>
<rect fill="#FFFFFF" stroke="#C0C0C0" :width="layout.width" :height="layout.height"></rect>
<rect v-if="tag.status === 'present'" :width="layout.width" :height="zoom < 0.4 ? layout.height : zoom < 0.7 ? '10' : '5'" fill="#55B757" class="node-background"></rect>
<rect v-else-if="tag.status === 'busy'" :width="layout.width" :height="zoom < 0.4 ? layout.height : zoom < 0.7 ? '10' : '5'" fill="#E7527C" class="node-background"></rect>
<rect v-else-if="tag.status === 'travel'" :width="layout.width" :height="zoom < 0.4 ? layout.height : zoom < 0.7 ? '10' : '5'" fill="#9945E9" class="node-background"></rect>
<rect v-else-if="tag.status === 'unavailable' || tag.status == null" :width="layout.width" :height="zoom < 0.4 ? layout.height : zoom < 0.7 ? '10' : '5'" fill="#8D8F91" class="node-background"></rect>
<rect v-if="highlighted || selected" fill="transparent" :stroke="selected ? '#FFBB33' : '#249ae7'" stroke-width="3"
  :width="layout.width-3" :height="layout.height-3" x="1.5" y="1.5"></rect>
<!--the template for detailNodeStyle-->
<template v-if="zoom >= 0.7">
  <image :xlink:href="'./resources/icons/' + tag.icon + '.svg'" x="15" y="10" width="63.75" height="63.75"></image>
  <image :xlink:href="'./resources/icons/' + tag.status + '_icon.svg'" x="25" y="80" height="15" width="60"></image>
  <g style="font-size:10px; font-family:Roboto,sans-serif; font-weight: 300; fill: #444">
    <text transform="translate(100 25)" style="font-size:16px; fill:#336699">{{tag.name}}</text>
    <!-- use the VuejsNodeStyle svg-text template which supports wrapping -->
    <svg-text x="100" y="35" :width="layout.width - 140" :content="tag.position?.toUpperCase()" :line-spacing="0.2" font-size="10" font-family="Roboto,sans-serif" :wrapping="3"></svg-text>
    <text transform="translate(100 72)" >{{tag.email}}</text>
    <text transform="translate(100 88)" >{{tag.phone}}</text>
    <text transform="translate(170 88)" >{{tag.fax}}</text>
  </g>
</template>
<!--the template for intermediateNodeStyle-->
<template v-else-if="zoom >= 0.4">
  <image :xlink:href="'./resources/icons/' + tag.icon + '.svg'" x="15" y="20" width="56.25" height="56.25"/>
  <g style="font-size:15px; font-family:Roboto,sans-serif; fill:#444" width="185">
    <text transform="translate(75 40)" style="font-size:26px; font-family:Roboto,sans-serif; fill:#336699">{{tag.name}}</text>
    <!-- use the VuejsNodeStyle svg-text template which supports wrapping -->
    <svg-text x="75" y="50" :width="layout.width - 85" :content="tag.position?.toUpperCase()" :line-spacing="0.2" font-size="15" font-family="Roboto,sans-serif" :wrapping="3"></svg-text>
  </g>
</template>
<!--the template for overviewNodeStyle-->
<template v-else>
  <!--converts a name to an abbreviated name-->
  <text transform="translate(30 50)" style="font-size:40px; font-family:Roboto,sans-serif; fill:#fff; dominant-baseline: central;">
    {{tag.name.replace(/^(.)(\\S*)(.*)/, '$1.$3')}}
  </text>
</template>
</g>`
}
