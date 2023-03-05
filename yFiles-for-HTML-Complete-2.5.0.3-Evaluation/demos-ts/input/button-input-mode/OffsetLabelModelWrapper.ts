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
  Class,
  FreeLabelModel,
  ILabel,
  ILabelModel,
  ILabelModelParameter,
  ILookup,
  IOrientedRectangle,
  OrientedRectangle,
  Point,
  SimpleLabel,
  Size
} from 'yfiles'

/**
 * An {@see ILabelModel} that moves the layout of a label provided by a wrapped label model
 * by a fixed offset.
 *
 * For the label as well as for the wrapped label reference points can be described that shall differ
 * by this offset. The reference points are described as ratio of the labels width and height
 * relative to the upper-left corner. A value of (0,0) describes the upper-left corner, while (1,1)
 * is the lower-right corner.
 *
 * If no ratio is specified for the label and/or the wrapped label, their anchor points are used
 * which correspond to ratio (0, 1).
 */
export class OffsetLabelModelWrapper extends BaseClass(ILabelModel) {
  public static INSTANCE: OffsetLabelModelWrapper = new OffsetLabelModelWrapper()

  createDefaultParameter(): ILabelModelParameter {
    return new OffsetLabelModelWrapperParameter(
      this,
      FreeLabelModel.INSTANCE.createDefaultParameter(),
      Point.ORIGIN,
      Size.EMPTY,
      new Point(0, 1),
      new Point(0, 1)
    )
  }

  /**
   * Creates a parameter that describes a label layout provided by the wrapped layout
   * parameter moved by the offset.
   * @param wrapped The parameter used to calculate the base layout.
   * @param offset The offset to move the label relative to its rotation.
   * @param wrappedSize The label size that shall be used when calculating the base layout.
   * @param wrappedRatio The ratio that describes the reference point on the wrapped label's layout
   * relative to its upper-left corner. A value of (0,0) describes the upper-left corner,
   * while (1,1) is the lower-right corner.
   * @param labelRatio The ratio that describes the reference point on the label's layout
   * relative to its upper-left corner. A value of (0,0) describes the upper-left corner,
   * while (1,1) is the lower-right corner.
   */
  createOffsetParameter(
    wrapped: ILabelModelParameter,
    offset: Point,
    wrappedSize: Size = Size.EMPTY,
    wrappedRatio: Point = new Point(0, 1),
    labelRatio: Point = new Point(0, 1)
  ) {
    return new OffsetLabelModelWrapperParameter(
      this,
      wrapped,
      offset,
      wrappedSize,
      wrappedRatio,
      labelRatio
    )
  }

  getContext(label: ILabel, layoutParameter: ILabelModelParameter): ILookup {
    const offsetParameter = layoutParameter as OffsetLabelModelWrapperParameter
    return offsetParameter.wrappedParameter.model.getContext(
      label,
      offsetParameter.wrappedParameter
    )
  }

  getGeometry(label: ILabel, layoutParameter: ILabelModelParameter): IOrientedRectangle {
    const offsetParameter = layoutParameter as OffsetLabelModelWrapperParameter
    // temporarily set the wrappedSize to calculate the wrappedLayout
    const labelSize = label.preferredSize
    if (!offsetParameter.wrappedSize.isEmpty && label instanceof SimpleLabel) {
      label.preferredSize = offsetParameter.wrappedSize
    }
    const wrappedLayout = new OrientedRectangle(
      offsetParameter.wrappedParameter.model.getGeometry(label, offsetParameter.wrappedParameter)
    )
    if (!offsetParameter.wrappedSize.isEmpty && label instanceof SimpleLabel) {
      label.preferredSize = labelSize
    }

    // calculate dx and dy considering the reference points and the offset but ignoring the rotation
    const unrotatedDx =
      offsetParameter.wrappedRatio.x * wrappedLayout.width +
      offsetParameter.offset.x -
      offsetParameter.labelRatio.x * labelSize.width
    const unrotatedDy =
      -(1 - offsetParameter.wrappedRatio.y) * wrappedLayout.height +
      offsetParameter.offset.y +
      (1 - offsetParameter.labelRatio.y) * labelSize.height

    // consider the rotation; note that unrotatedDy is negated as the default upY is negative
    const dX = -unrotatedDx * wrappedLayout.upY - unrotatedDy * wrappedLayout.upX
    const dY = -unrotatedDy * wrappedLayout.upY + unrotatedDx * wrappedLayout.upX

    // use the anchor of wrappedLayout moved by dx/dy, the original labelSize and the common up vector
    return new OrientedRectangle(
      wrappedLayout.anchorX + dX,
      wrappedLayout.anchorY + dY,
      labelSize.width,
      labelSize.height,
      wrappedLayout.upX,
      wrappedLayout.upY
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
  lookup<T extends any>(type: Class<T>): T | null {
    return null
  }
}

class OffsetLabelModelWrapperParameter extends BaseClass(ILabelModelParameter) {
  private readonly _model: OffsetLabelModelWrapper
  readonly wrappedRatio: Point
  readonly labelRatio: Point
  readonly wrappedParameter: ILabelModelParameter
  readonly offset: Point
  readonly wrappedSize: Size

  constructor(
    model: OffsetLabelModelWrapper,
    wrappedParameter: ILabelModelParameter,
    offset: Point,
    wrappedSize: Size,
    wrappedRatio: Point,
    labelRatio: Point
  ) {
    super()
    this.wrappedRatio = wrappedRatio
    this.labelRatio = labelRatio
    this._model = model
    this.wrappedParameter = wrappedParameter
    this.offset = offset
    this.wrappedSize = wrappedSize
  }

  clone(): this {
    return this
  }

  get model(): ILabelModel {
    return this._model
  }

  supports(label: ILabel): boolean {
    return this.wrappedParameter.supports(label)
  }
}
