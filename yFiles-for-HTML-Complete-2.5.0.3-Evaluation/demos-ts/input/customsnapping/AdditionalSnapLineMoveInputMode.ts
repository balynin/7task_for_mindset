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
  IHitTestable,
  IInputModeContext,
  InputModeEventArgs,
  List,
  MoveInputMode,
  Point,
  Rect,
  Size
} from 'yfiles'
import { AdditionalSnapLinePositionHandler } from './AdditionalSnapLinePositionHandler'
import type { AdditionalSnapLineVisualCreator } from './AdditionalSnapLineVisualCreator'

/**
 * This input mode allows moving free snaplines using a drag gesture.
 */
export class AdditionalSnapLineMoveInputMode extends MoveInputMode {
  private readonly snapLineCreators: List<AdditionalSnapLineVisualCreator>
  private handler: AdditionalSnapLinePositionHandler | null = null

  /**
   * Creates a new instance of {@link AdditionalSnapLineMoveInputMode}
   */
  constructor(snapLineCreators: List<AdditionalSnapLineVisualCreator>) {
    super()
    this.snapLineCreators = snapLineCreators
    this.positionHandler = null
    this.hitTestable = IHitTestable.create(this.isValidHit.bind(this))
  }

  /**
   * Returns true if an AdditionalSnapLine can be found in a close surrounding of the given location.
   */
  isValidHit(context: IInputModeContext, location: Point): boolean {
    const line = this.tryGetAdditionalSnapLineCreatorAt(location)
    if (line) {
      this.handler = new AdditionalSnapLinePositionHandler(line, location)
      return true
    } else {
      this.handler = null
      return false
    }
  }

  /**
   * Returns the first AdditionalSnapLine found in a close surrounding of the given location
   * or null if none can be found.
   */
  tryGetAdditionalSnapLineCreatorAt(location: Point): AdditionalSnapLineVisualCreator | null {
    const surrounding = new Rect(location.add(new Point(-3, -3)), new Size(6, 6))
    return this.snapLineCreators.find(line => surrounding.intersectsLine(line.from, line.to))
  }

  /**
   * Sets the {@link MoveInputMode.positionHandler} property.
   * @see Overrides {@link MoveInputMode.onDragStarting}
   */
  onDragStarting(inputModeEventArgs: InputModeEventArgs): void {
    this.positionHandler = this.handler
    super.onDragStarting(inputModeEventArgs)
  }

  /**
   * Clears the {@link MoveInputMode.positionHandler} property.
   * @see Overrides {@link MoveInputMode.onDragCanceled}
   */
  onDragCanceled(inputModeEventArgs: InputModeEventArgs): void {
    super.onDragCanceled(inputModeEventArgs)
    this.positionHandler = null
  }

  /**
   * Clears the {@link MoveInputMode.positionHandler} property.
   * @see Overrides {@link MoveInputMode.onDragFinished}
   */
  onDragFinished(inputModeEventArgs: InputModeEventArgs): void {
    super.onDragFinished(inputModeEventArgs)
    this.positionHandler = null
  }
}
