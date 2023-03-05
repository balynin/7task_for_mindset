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
  Font,
  IEdge,
  ILabel,
  IOrientedRectangle,
  IRenderContext,
  LabelStyleBase,
  Matrix,
  Size,
  SvgVisual,
  TextRenderSupport,
  TextWrapping
} from 'yfiles'
import { colorSets } from '../../resources/demo-styles'

const HORIZONTAL_INSET = 3
const VERTICAL_INSET = 2
const ARROW_SIZE = 18
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

/**
 * A label style for edges which renders a flow indicator.
 * The indicator points to the edge's source or target,
 * depending on the 'toSource' setting.
 */
export class DirectedEdgeLabelStyle extends LabelStyleBase {
  /** Whether the indicator points to the source */
  public toSource = false
  /** The text color */
  public textFill = colorSets['demo-palette-31'].text
  /** The background color */
  public backgroundFill = colorSets['demo-palette-31'].edgeLabelFill
  /** The fill for the indicator */
  public arrowFill = 'orange'
  /** The stroke for the indicator */
  public arrowStroke = 'black'

  /** The text font */
  private readonly font: Font = new Font({
    fontFamily: 'Arial',
    fontSize: 12
  })

  /**
   * Creates a new instance.
   * @param toSource If set to true the indicator points to the source.
   */
  constructor(toSource = false) {
    super()
    this.toSource = toSource
  }

  /**
   * Creates the visual for a label to be drawn.
   */
  createVisual(context: IRenderContext, label: ILabel): SvgVisual {
    // Create a 'g' element and uses it as base for the rendering of the label.
    const container = document.createElementNS(SVG_NAMESPACE, 'g') as SVGElement

    // Get the necessary data for rendering of the label
    const cache = DirectedEdgeLabelStyle.createRenderDataCache(
      context,
      label,
      this.font,
      this.toSource,
      this.getDirection(label),
      this.textFill,
      this.backgroundFill,
      this.arrowStroke,
      this.arrowFill
    )
    // Render the label
    this.render(container, label.layout, cache)
    // move container to correct location
    const transform = LabelStyleBase.createLayoutTransform(context, label.layout, false)
    transform.applyTo(container)

    return new SvgVisual(container)
  }

  /**
   * Determines the direction for the indicator.
   * Calculates it from the direction to the edge's port of interest relative to the center of the label layout.
   * The port of interest is the source port if toSource is true, the target port otherwise.
   * @param label The label to get the direction for.
   */
  private getDirection(label: ILabel): ArrowDirection {
    if (!(label.owner instanceof IEdge)) {
      // fallback if the label has been removed or is not at an edge
      return ArrowDirection.UP
    }
    const center = label.layout.orientedRectangleCenter
    const target = this.toSource
      ? label.owner.sourcePort?.location
      : label.owner.targetPort?.location
    if (!target) {
      // fallback if the edge has been removed
      return ArrowDirection.UP
    }
    const dx = center.x - target.x
    const dy = center.y - target.y
    // the preferred direction (vertical or horizontal)
    const topDown = Math.abs(dx) < Math.abs(dy)
    if (topDown) {
      return dy > 0 ? ArrowDirection.UP : ArrowDirection.DOWN
    } else {
      return dx > 0 ? ArrowDirection.LEFT : ArrowDirection.RIGHT
    }
  }

  /**
   * Re-renders the label using the old visual for performance reasons.
   * @see Overrides {@link LabelStyleBase.updateVisual}
   */
  updateVisual(context: IRenderContext, oldVisual: SvgVisual, label: ILabel): SvgVisual {
    const container = oldVisual.svgElement as SVGElement & {
      'data-renderDataCache': LabelRenderDataCache
    }
    // get the data with which the old visual was created
    const oldCache = container['data-renderDataCache']
    // get the data for the new visual
    const newCache = DirectedEdgeLabelStyle.createRenderDataCache(
      context,
      label,
      this.font,
      this.toSource,
      this.getDirection(label),
      this.textFill,
      this.backgroundFill,
      this.arrowStroke,
      this.arrowFill
    )
    if (!newCache.equals(oldCache)) {
      // something changed - re-render the visual
      this.render(container, label.layout, newCache)
    }
    // nothing changed, return the old visual
    // arrange because the layout might have changed
    const transform = LabelStyleBase.createLayoutTransform(context, label.layout, false)
    transform.applyTo(container)
    return oldVisual
  }

  /**
   * Creates the visual appearance of a label.
   */
  private render(
    container: SVGElement & { 'data-renderDataCache'?: LabelRenderDataCache },
    labelLayout: IOrientedRectangle,
    cache: LabelRenderDataCache
  ): void {
    // store information with the visual on how we created it
    container['data-renderDataCache'] = cache

    // The background rectangle
    let rect: SVGRectElement
    if (container.childElementCount > 0) {
      rect = container.childNodes[0] as SVGRectElement
    } else {
      rect = document.createElementNS(SVG_NAMESPACE, 'rect')
      container.appendChild(rect)
    }
    rect.width.baseVal.value = labelLayout.width
    rect.height.baseVal.value = labelLayout.height
    rect.setAttribute('rx', '3')
    rect.setAttribute('ry', '3')
    rect.setAttribute('stroke-width', '1')
    rect.setAttribute('fill', this.backgroundFill)

    // The text
    let text: SVGTextElement
    if (container.childElementCount > 1) {
      text = container.childNodes[1] as SVGTextElement
    } else {
      text = document.createElementNS(SVG_NAMESPACE, 'text')
      text.setAttribute('fill', this.textFill)
      container.appendChild(text)
    }
    const textContent = TextRenderSupport.addText(
      text,
      cache.text,
      cache.font,
      labelLayout.toSize(),
      TextWrapping.NONE
    )

    // calculate the size of the text element
    const textSize = TextRenderSupport.measureText(textContent, cache.font)

    // if the indicator points to the source it is placed left, then
    // move the text to the right
    const translateX = cache.toSource ? 2 * HORIZONTAL_INSET + ARROW_SIZE : HORIZONTAL_INSET

    // calculate vertical offset for centered alignment
    const translateY = (labelLayout.height - textSize.height) * 0.5

    text.setAttribute('transform', `translate(${translateX} ${translateY})`)
    while (container.childElementCount > 2) {
      container.removeChild(container.lastChild!)
    }

    const button = createArrow(cache.direction, cache.arrowStroke, cache.arrowFill)
    new Matrix(
      1,
      0,
      0,
      1,
      cache.toSource ? HORIZONTAL_INSET : labelLayout.width - HORIZONTAL_INSET - ARROW_SIZE,
      VERTICAL_INSET + 1
    ).applyTo(button)
    container.appendChild(button)
  }

  /**
   * Creates an object containing all necessary data to create a label visual.
   */
  private static createRenderDataCache(
    _: IRenderContext,
    label: ILabel,
    font: Font,
    toSource: boolean,
    direction: ArrowDirection,
    textFill: string,
    backgroundFill: string,
    arrowStroke: string,
    arrowFill: string
  ): LabelRenderDataCache {
    // Visibility of button changes dependent on the zoom level
    return new LabelRenderDataCache(
      label.text,
      toSource,
      direction,
      font,
      textFill,
      backgroundFill,
      arrowStroke,
      arrowFill
    )
  }

  /**
   * Calculates the preferred size for the given label if this style is used for the rendering.
   * The size is calculated from the label's text.
   * @see Overrides {@link LabelStyleBase.getPreferredSize}
   */
  getPreferredSize(label: ILabel): Size {
    // first measure
    const size = TextRenderSupport.measureText(label.text, this.font)
    // then use the desired size - plus rounding and insets, as well as space for button
    return new Size(
      Math.ceil(0.5 + size.width) + HORIZONTAL_INSET * 3 + ARROW_SIZE,
      2 * VERTICAL_INSET + Math.max(ARROW_SIZE, Math.ceil(0.5 + size.height))
    )
  }
}

function createArrow(
  direction: ArrowDirection,
  arrowStroke: string,
  arrowFill: string
): SVGElement {
  const path = document.createElementNS(SVG_NAMESPACE, 'path')
  switch (direction) {
    case ArrowDirection.DOWN:
      path.setAttribute('d', 'M 6,0 L 6,8 L 0,8 L 8,16 L 16,8 L 10,8 L 10,0  Z')
      break
    case ArrowDirection.UP:
      path.setAttribute('d', 'M 6,16 L 6,8 L 0,8 L 8,0 L 16,8 L 10,8 L 10,16  Z')
      break
    case ArrowDirection.LEFT:
      path.setAttribute('d', 'M 16,6 L 8,6 L 8,0 L 0,8 L 8,16 L 8,10 L 16,10  Z')
      break
    case ArrowDirection.RIGHT:
      path.setAttribute('d', 'M 0,6 L 8,6 L 8,0 L 16,8 L 8,16 L 8,10 L 0,10  Z')
      break
  }
  path.setAttribute('fill', arrowFill)
  // path.setAttribute('stroke', arrowStroke)
  // path.setAttribute('stroke-width', '1')
  return path
}

enum ArrowDirection {
  UP,
  RIGHT,
  DOWN,
  LEFT
}

class LabelRenderDataCache {
  constructor(
    public readonly text: string,
    public readonly toSource: boolean,
    public readonly direction: ArrowDirection,
    public readonly font: Font,
    public readonly textFill: string,
    public readonly backgroundFill: string,
    public readonly arrowStroke: string,
    public readonly arrowFill: string
  ) {}

  equals(other?: LabelRenderDataCache): boolean {
    return (
      !!other &&
      this.text === other.text &&
      this.direction === other.direction &&
      this.toSource === other.toSource &&
      this.font.equals(other.font) &&
      this.textFill == other.textFill &&
      this.backgroundFill == other.backgroundFill &&
      this.arrowFill == other.arrowFill &&
      this.arrowStroke == other.arrowStroke
    )
  }
}
