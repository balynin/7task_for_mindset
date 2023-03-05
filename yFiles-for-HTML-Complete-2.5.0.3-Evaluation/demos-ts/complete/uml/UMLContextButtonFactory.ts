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
  DefaultPortCandidate,
  Fill,
  FreeNodeLabelModel,
  FreeNodePortLocationModel,
  GraphComponent,
  GraphEditorInputMode,
  INode,
  Point,
  SolidColorFill
} from 'yfiles'
import type {
  ButtonInputMode,
  QueryButtonsEvent
} from '../../input/button-input-mode/ButtonInputMode'
import {
  createAggregationStyle,
  createAssociationStyle,
  createDependencyStyle,
  createDirectedAssociationStyle,
  createGeneralizationStyle,
  createRealizationStyle
} from './UMLEdgeStyleFactory'
import { ExtensibilityButtonStyle, RelationButtonStyle } from './ButtonStyles'
import type { UMLNodeStyle } from './UMLNodeStyle'

const DEFAULT_FILL = new SolidColorFill(0x60, 0x7d, 0x8b)

export function createExtensibilityButtons(
  sender: ButtonInputMode,
  event: QueryButtonsEvent,
  style: UMLNodeStyle
): void {
  const graphComponent = sender.inputModeContext!.canvasComponent as GraphComponent
  const buttonStyle = new ExtensibilityButtonStyle()
  const buttonSize = buttonStyle.getButtonSize()
  const paramFactory = new FreeNodeLabelModel()
  event.addButton({
    onAction: button => {
      const model = style.model
      const isInterface = model.stereotype === 'interface'
      model.stereotype = isInterface ? '' : 'interface'
      model.constraint = ''
      model.modify()
      style.fill = isInterface ? DEFAULT_FILL : Fill.SEA_GREEN
      graphComponent.invalidate()
    },
    layoutParameter: paramFactory.createParameter({
      layoutRatio: Point.ORIGIN,
      layoutOffset: new Point(0, -5),
      labelRatio: new Point(0, 1),
      labelOffset: Point.ORIGIN
    }),
    size: buttonSize,
    style: buttonStyle,
    tag: style.model,
    text: 'I'
  })
  event.addButton({
    onAction: button => {
      const model = style.model
      const isAbstract = model.constraint === 'abstract'
      model.constraint = isAbstract ? '' : 'abstract'
      model.stereotype = ''
      model.modify()
      style.fill = isAbstract ? DEFAULT_FILL : Fill.CRIMSON
      graphComponent.invalidate()
    },
    layoutParameter: paramFactory.createParameter({
      layoutRatio: Point.ORIGIN,
      layoutOffset: new Point(buttonSize.width + 5, -5),
      labelRatio: new Point(0, 1),
      labelOffset: Point.ORIGIN
    }),
    size: buttonSize,
    style: buttonStyle,
    tag: style.model,
    text: 'A'
  })
}

export function createEdgeCreationButtons(sender: ButtonInputMode, event: QueryButtonsEvent): void {
  const edgeStyles = [
    createRealizationStyle(),
    createGeneralizationStyle(),
    createAggregationStyle(),
    createDependencyStyle(),
    createDirectedAssociationStyle(),
    createAssociationStyle()
  ]

  const paramFactory = new FreeNodeLabelModel()

  let radialStart = 5.235987755982989 // corresponds to 300 degrees
  const radialOffset = 0.6981317007977318 // corresponds to 40 degrees
  for (const style of edgeStyles) {
    const buttonStyle = new RelationButtonStyle(style)
    const buttonSize = buttonStyle.getButtonSize()
    event.addButton({
      onAction: button => {
        const graphComponent = sender.inputModeContext!.canvasComponent as GraphComponent
        graphComponent.selection.clear()
        graphComponent.currentItem = null
        const createEdgeInputMode = (graphComponent.inputMode as GraphEditorInputMode)
          .createEdgeInputMode

        // initialize dummy edge
        const umlEdgeType = style
        const dummyEdgeGraph = createEdgeInputMode.dummyEdgeGraph
        const dummyEdge = createEdgeInputMode.dummyEdge
        dummyEdgeGraph.setStyle(dummyEdge, umlEdgeType)
        dummyEdgeGraph.edgeDefaults.style = umlEdgeType

        // start edge creation and hide buttons until the edge is finished
        createEdgeInputMode.doStartEdgeCreation(
          new DefaultPortCandidate(
            event.owner as INode,
            FreeNodePortLocationModel.NODE_CENTER_ANCHORED
          )
        )
      },
      layoutParameter: paramFactory.createParameter({
        layoutRatio: new Point(1, 0),
        layoutOffset: rotate(new Point(50, 0), radialStart),
        labelRatio: new Point(0.5, 0.5),
        labelOffset: Point.ORIGIN
      }),
      size: buttonSize,
      style: buttonStyle
    })
    radialStart += radialOffset
  }
}

function rotate(vector: Point, angle1: number): Point {
  const angle = angle1
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return new Point(cos * vector.x + sin * vector.y, cos * vector.y - sin * vector.x)
}
