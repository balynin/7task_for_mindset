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
  IInputModeContext,
  IPositionHandler,
  MutablePoint,
  MutableRectangle,
  Point
} from 'yfiles'

/**
 * An {@link IPositionHandler} that manages the position of a given {@link MutableRectangle}.
 */
export default class PositionHandler extends BaseClass(IPositionHandler) {
  /**
   * Stores the offset from the mouse event location to the handled rectangle's upper left corner.
   */
  private offset: MutablePoint = new MutablePoint()

  constructor(private rectangle: MutableRectangle) {
    super()
  }

  /**
   * The rectangle's top-left coordinate.
   */
  get location(): Point {
    return this.rectangle.topLeft
  }

  /**
   * Initializes the mouse event offset before the actual move gesture starts.
   */
  initializeDrag(context: IInputModeContext): void {
    const x = this.rectangle.x - context.canvasComponent!.lastEventLocation.x
    const y = this.rectangle.y - context.canvasComponent!.lastEventLocation.y
    this.offset.relocate(x, y)
  }

  /**
   * Updates the rectangle's position during each drag.
   */
  handleMove(context: IInputModeContext, originalLocation: Point, newLocation: Point): void {
    const newX = newLocation.x + this.offset.x
    const newY = newLocation.y + this.offset.y
    this.rectangle.relocate(new Point(newX, newY))
  }

  /**
   * Resets the rectangle's position when the move gesture was cancelled.
   */
  cancelDrag(context: IInputModeContext, originalLocation: Point): void {
    this.rectangle.relocate(originalLocation)
  }

  /**
   * Finalizes the rectangle's position when the move gesture ends.
   */
  dragFinished(context: IInputModeContext, originalLocation: Point, newLocation: Point): void {
    const newX = newLocation.x + this.offset.x
    const newY = newLocation.y + this.offset.y
    this.rectangle.relocate(new Point(newX, newY))
  }
}
