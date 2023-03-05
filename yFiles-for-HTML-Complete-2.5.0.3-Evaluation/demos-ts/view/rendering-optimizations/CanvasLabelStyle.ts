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
  CanvasComponent,
  Font,
  FontStyle,
  FontWeight,
  HtmlCanvasVisual,
  ILabel,
  IOrientedRectangle,
  IRenderContext,
  IVisualCreator,
  LabelStyleBase,
  Size,
  TextMeasurePolicy,
  TextRenderSupport,
  TextWrapping,
  Visual
} from 'yfiles'

/**
 * A simple label style that draws the text into the HTML5 Canvas. This
 * implementation auto-flips the drawing of the labels, if they're upside
 * down.
 */
export default class CanvasLabelStyle extends LabelStyleBase {
  private readonly font: Font = new Font('Arial', 14)

  /**
   * Create a new HTML5 Canvas label style instance.
   */
  constructor() {
    super()
  }

  /**
   * Creates the visual representation for the given label.
   * @param context The render context.
   * @param label The label to which this style instance is assigned.
   * @returns The visual as required by the {@link IVisualCreator.createVisual} interface.
   * @see {@link CanvasLabelStyle.updateVisual}
   */
  createVisual(context: IRenderContext, label: ILabel): Visual {
    return new LabelRenderVisual(label.text, label.layout, this.font)
  }

  /**
   * Updates the visual representation for the given label.
   * @param context The render context.
   * @param oldVisual The visual that has been created in the call to
   * {@link CanvasLabelStyle.createVisual}.
   * @param label The label to which this style instance is assigned.
   * @returns The visual as required by the {@link IVisualCreator.createVisual} interface.
   * @see {@link CanvasLabelStyle.createVisual}
   */
  updateVisual(context: IRenderContext, oldVisual: Visual, label: ILabel): Visual {
    ;(oldVisual as any).layout = label.layout
    return oldVisual
  }

  /**
   * Calculates the preferred {@link Size size} for the given label.
   * @param label The label to which this style instance is assigned.
   * @returns The preferred size.
   */
  getPreferredSize(label: ILabel): Size {
    return TextRenderSupport.measureText(
      label.text,
      this.font,
      null,
      TextWrapping.NONE,
      TextMeasurePolicy.CANVAS
    )
  }
}

/**
 * For HTML5 Canvas based rendering we need to extend from {@link HtmlCanvasVisual}.
 */
class LabelRenderVisual extends HtmlCanvasVisual {
  /**
   * Create an instance of the actual label render visual.
   */
  constructor(
    private readonly text: string,
    private readonly layout: IOrientedRectangle,
    private readonly font: Font
  ) {
    super()
  }

  /**
   * Paints onto the context using HTML5 Canvas operations.
   * Implementations should not destroy the context's state, but should make sure to restore the state to the
   * previously active state. This is especially true for the transformation and clip.
   * @param context The render context of the {@link CanvasComponent}
   * @param htmlCanvasContext The HTML5 Canvas context to use for rendering.
   */
  paint(context: IRenderContext, htmlCanvasContext: CanvasRenderingContext2D): void {
    htmlCanvasContext.save()
    setFont(htmlCanvasContext, this.font)
    htmlCanvasContext.fillStyle = 'rgba(0,0,0,1)'
    htmlCanvasContext.textBaseline = 'bottom'
    if (this.layout.upY !== -1) {
      const upX = this.layout.upX
      const upY = this.layout.upY
      let transformMatrix: number[]
      if (this.layout.upY > 0) {
        // flip label if upside down
        transformMatrix = [
          upY,
          -upX,
          upX,
          upY,
          this.layout.anchorX - upY * this.layout.width,
          this.layout.anchorY + upX * this.layout.width
        ]
      } else {
        transformMatrix = [
          -upY,
          upX,
          -upX,
          -upY,
          this.layout.anchorX + upX * this.layout.height,
          this.layout.anchorY + upY * this.layout.height
        ]
      }
      htmlCanvasContext.transform(
        transformMatrix[0],
        transformMatrix[1],
        transformMatrix[2],
        transformMatrix[3],
        transformMatrix[4],
        transformMatrix[5]
      )
      htmlCanvasContext.fillText(this.text, 0, this.layout.height)
    } else {
      htmlCanvasContext.fillText(this.text, this.layout.anchorX, this.layout.anchorY)
    }
    htmlCanvasContext.restore()
  }
}

/**
 * Sets the font on the context using HTML5 Canvas.
 */
function setFont(htmlCanvasContext: CanvasRenderingContext2D, font: Font): void {
  htmlCanvasContext.font = `${fontStyleToString(font.fontStyle)} ${fontWeightToString(
    font.fontWeight
  )} ${font.fontSize}px ${font.fontFamily}`
}

/**
 * Converts the font style into a string.
 * @param fontStyle The font style to convert.
 */
function fontStyleToString(fontStyle: FontStyle): string {
  switch (fontStyle) {
    case FontStyle.NORMAL:
      return 'normal'
    case FontStyle.ITALIC:
      return 'italic'
    case FontStyle.OBLIQUE:
      return 'oblique'
    case FontStyle.INHERIT:
      return 'inherit'
    default:
      throw new Error(`${fontStyle} is not a valid FontStyle`)
  }
}

/**
 * Converts the font weight into a string.
 * @param fontWeight The font weight to convert.
 */
function fontWeightToString(fontWeight: FontWeight): string {
  switch (fontWeight) {
    case FontWeight.NORMAL:
      return 'normal'
    case FontWeight.BOLD:
      return 'bold'
    case FontWeight.BOLDER:
      return 'bolder'
    case FontWeight.LIGHTER:
      return 'lighter'
    case FontWeight.INHERIT:
      return 'inherit'
    case FontWeight.ITEM100:
      return '100'
    case FontWeight.ITEM200:
      return '200'
    case FontWeight.ITEM300:
      return '300'
    case FontWeight.ITEM400:
      return '400'
    case FontWeight.ITEM500:
      return '500'
    case FontWeight.ITEM600:
      return '600'
    case FontWeight.ITEM700:
      return '700'
    case FontWeight.ITEM800:
      return '800'
    case FontWeight.ITEM900:
      return '900'
    default:
      throw new Error(`${fontWeight} is not a valid FontWeight`)
  }
}
