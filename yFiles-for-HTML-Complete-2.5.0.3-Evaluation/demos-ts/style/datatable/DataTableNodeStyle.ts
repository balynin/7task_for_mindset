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
import { INode, IRenderContext, NodeStyleBase, SvgVisual } from 'yfiles'
import { DataTableRenderSupport, RenderDataCache, SVGNS } from './DataTableRenderSupport'

/**
 * A node style to display data in a tabular fashion.
 * This style uses SVG lines and an SVG text element to create a table-like
 * visualization similar to, for example, a HTML table.
 * To avoid text extending beyond the border of the node, the style of each node
 * as a separate clipPath assigned to its text element.
 */
export default class DataTableNodeStyle extends NodeStyleBase {
  private readonly renderSupport = new DataTableRenderSupport('myTableNode', true)

  /**
   * Creates a new instance of this style.
   */
  constructor() {
    super()
  }

  /**
   * Creates the visual for a node.
   * @see Overrides {@link NodeStyleBase.createVisual}
   */
  createVisual(context: IRenderContext, node: INode): SvgVisual {
    // This implementation creates a 'g' element and uses it for the rendering of the node.
    const g = document.createElementNS(SVGNS, 'g')
    // Cache the necessary data for rendering of the node
    const cache = new RenderDataCache(
      node.tag,
      this.renderSupport.font,
      node.layout.toSize(),
      node.layout.toPoint()
    )
    // Render the node
    this.renderSupport.render(g, node.layout.toSize(), cache)

    SvgVisual.setTranslate(g, node.layout.x, node.layout.y)
    return new SvgVisual(g)
  }

  /**
   * Re-renders the label using the old visual for performance reasons.
   * @see Overrides {@link NodeStyleBase.updateVisual}
   */
  updateVisual(context: IRenderContext, oldVisual: SvgVisual, node: INode): SvgVisual {
    const container = oldVisual.svgElement as SVGElement & {
      'data-renderDataCache'?: RenderDataCache
    }
    // Get the data with which the oldvisual was created
    const oldCache = container['data-renderDataCache']!
    // Get the data for the new visual
    const newCache = new RenderDataCache(
      node.tag,
      this.renderSupport.font,
      node.layout.toSize(),
      node.layout.toPoint()
    )
    if (!newCache.equals(oldCache)) {
      // The data or font changed, create a new visual
      newCache.adoptValues(oldCache)
      while (container.lastChild) {
        // remove all children
        container.removeChild(container.lastChild)
      }

      this.renderSupport.render(container, node.layout.toSize(), newCache)
      // make sure that the location is up to date
      SvgVisual.setTranslate(container, node.layout.x, node.layout.y)
      return oldVisual
    }

    if (!newCache.location.equals(oldCache.location)) {
      // Only the location changed, keep the old visual and update its transform and cache
      DataTableNodeStyle.updateVisualLocation(node, oldVisual, oldCache)
    }
    if (!newCache.size.equals(oldCache.size)) {
      // Only the size changed, so update the size of the visual
      this.updateVisualSize(node, oldVisual, oldCache)
    }

    return oldVisual
  }

  /**
   * Updates the size of the given visual to match the node layout.
   */
  private updateVisualSize(node: INode, visual: SvgVisual, renderDataCache: RenderDataCache): void {
    const nodeSize = node.layout.toSize()
    renderDataCache.size = nodeSize

    const g = visual.svgElement

    const clipPad = this.renderSupport.tablePadding + 1
    const textClipRect = g.childNodes[0].childNodes[0] as SVGRectElement
    textClipRect.width.baseVal.value = nodeSize.width - 2 * clipPad
    textClipRect.height.baseVal.value = nodeSize.height - 2 * clipPad

    const tableBackgroundRect = g.childNodes[1] as SVGRectElement
    tableBackgroundRect.width.baseVal.value = nodeSize.width
    tableBackgroundRect.height.baseVal.value = nodeSize.height
    const tableBorderRect = g.childNodes[4] as SVGRectElement
    tableBorderRect.width.baseVal.value = nodeSize.width
    tableBorderRect.height.baseVal.value = nodeSize.height

    // the second child is the text
    const names = renderDataCache.propertyNames
    if (names) {
      const innerGridPath = g.childNodes[3] as SVGPathElement
      innerGridPath.removeAttribute('d')
      innerGridPath.setAttribute(
        'd',
        this.renderSupport.createInnerGridPathString(names.length, nodeSize, renderDataCache)
      )
    }
  }

  /**
   * Updates the location of the given visual to match the node layout.
   * This changes only the translation of the top-level SVG element of this style.
   */
  private static updateVisualLocation(
    node: INode,
    visual: SvgVisual,
    renderCache: RenderDataCache
  ): void {
    const nodeLayout = node.layout
    renderCache.location = nodeLayout.toPoint()
    visual.svgElement.setAttribute('transform', `translate (${nodeLayout.x} ${nodeLayout.y})`)
  }
}
