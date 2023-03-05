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
  ArrowNodeDirection,
  ArrowNodeStyle,
  ArrowStyleShape,
  BaseClass,
  ClickEventArgs,
  Cursor,
  HandleTypes,
  IHandle,
  IInputModeContext,
  INode,
  IPoint,
  Point
} from 'yfiles'
import { ArrowNodeStyleAngleHandle } from './ArrowNodeStyleAngleHandle'

/**
 * An {@link IHandle} for nodes with a {@link ArrowNodeStyle} to change the
 * {@link ArrowNodeStyle.shaftRatio} interactively.
 */
export class ArrowNodeStyleShaftRatioHandle extends BaseClass(IHandle, IPoint) {
  private readonly style: ArrowNodeStyle
  private xFactor = 0
  private yFactor = 0
  private initialShaftRatio = 0

  /**
   * Creates a new instance for the given node.
   * @param node The node whose style shall be changed.
   * @param shaftRatioChanged An action that is called when the handle has been moved.
   */
  constructor(private readonly node: INode, private readonly shaftRatioChanged: () => void) {
    super()
    this.style = node.style as ArrowNodeStyle
  }

  /**
   * Gets a live view of the handle location.
   *
   * The handle is placed on the shaft border half-way along the shaft.
   */
  get location(): IPoint {
    return this
  }

  /**
   * Initializes the drag gesture.
   * @param context The current input mode context.
   */
  initializeDrag(context: IInputModeContext): void {
    switch (this.style.direction) {
      case ArrowNodeDirection.RIGHT:
      case ArrowNodeDirection.LEFT:
        this.xFactor = 0
        this.yFactor = -2 / this.node.layout.height
        break
      case ArrowNodeDirection.UP:
      case ArrowNodeDirection.DOWN:
        this.xFactor = -2 / this.node.layout.width
        this.yFactor = 0
        break
    }
    this.initialShaftRatio = this.style.shaftRatio
  }

  /**
   * Calculates the new shaft ratio depending on the new mouse location and updates the node style.
   * @param context The current input mode context.
   * @param originalLocation The original handle location.
   * @param newLocation The new mouse location.
   */
  handleMove(context: IInputModeContext, originalLocation: Point, newLocation: Point): void {
    // determine delta for the shaft ratio
    const delta =
      this.xFactor * (newLocation.x - originalLocation.x) +
      this.yFactor * (newLocation.y - originalLocation.y)
    // ... and clamp to valid values
    this.style.shaftRatio = Math.max(0, Math.min(this.initialShaftRatio + delta, 1))

    if (this.shaftRatioChanged) {
      this.shaftRatioChanged()
    }
  }

  /**
   * Resets the initial shaft ratio.
   * @param context The current input mode context.
   * @param originalLocation The original handle location.
   */
  cancelDrag(context: IInputModeContext, originalLocation: Point): void {
    this.style.shaftRatio = this.initialShaftRatio
  }

  /**
   * Sets the shaft ratio for the new location, and triggers the shaftRatioChanged action.
   * @param context The current input mode context.
   * @param originalLocation The original handle location.
   * @param newLocation The new mouse location.
   */
  dragFinished(context: IInputModeContext, originalLocation: Point, newLocation: Point): void {
    this.handleMove(context, originalLocation, newLocation)
  }

  /**
   * Returns {@link HandleTypes.SHEAR} as handle type that determines the visualization of the handle.
   */
  get type(): HandleTypes {
    return HandleTypes.SHEAR
  }

  /**
   * Returns a double-arrow cursor as cursor that shall be used during the drag gesture.
   *
   * If the styles {@link ArrowNodeStyle.direction} is {@link ArrowNodeDirection.LEFT} or
   * {@link ArrowNodeDirection.RIGHT}, {@link Cursor.NS_RESIZE} is returned, otherwise
   * {@link Cursor.EW_RESIZE}.
   */
  get cursor(): Cursor {
    const arrowIsHorizontal =
      this.style.direction === ArrowNodeDirection.RIGHT ||
      this.style.direction === ArrowNodeDirection.LEFT
    return arrowIsHorizontal ? Cursor.NS_RESIZE : Cursor.EW_RESIZE
  }

  /**
   * This implementation does nothing special when clicked.
   */
  handleClick(evt: ClickEventArgs): void {}

  get x(): number {
    const nodeLayout = this.node.layout
    if (
      this.style.direction === ArrowNodeDirection.UP ||
      this.style.direction === ArrowNodeDirection.DOWN
    ) {
      return nodeLayout.x + (nodeLayout.width * (1 - this.style.shaftRatio)) / 2
    }
    if (this.style.shape === ArrowStyleShape.DOUBLE_ARROW) {
      return nodeLayout.x + nodeLayout.width / 2
    }

    const headLength = ArrowNodeStyleAngleHandle.getArrowHeadLength(nodeLayout, this.style)
    if (this.style.direction === ArrowNodeDirection.RIGHT) {
      return nodeLayout.x + (nodeLayout.width - headLength) / 2
    }
    return nodeLayout.x + headLength + (nodeLayout.width - headLength) / 2
  }

  get y(): number {
    const nodeLayout = this.node.layout
    if (
      this.style.direction === ArrowNodeDirection.LEFT ||
      this.style.direction === ArrowNodeDirection.RIGHT
    ) {
      return nodeLayout.y + (nodeLayout.height * (1 - this.style.shaftRatio)) / 2
    }
    if (this.style.shape === ArrowStyleShape.DOUBLE_ARROW) {
      return nodeLayout.y + nodeLayout.height / 2
    }

    const headLength = ArrowNodeStyleAngleHandle.getArrowHeadLength(nodeLayout, this.style)
    if (this.style.direction === ArrowNodeDirection.DOWN) {
      return nodeLayout.y + (nodeLayout.height - headLength) / 2
    }
    return nodeLayout.y + headLength + (nodeLayout.height - headLength) / 2
  }
}
