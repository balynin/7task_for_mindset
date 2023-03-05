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
  Color,
  EdgeStyleBase,
  HtmlCanvasVisual,
  IBend,
  IEdge,
  IListEnumerable,
  IPoint,
  IRenderContext,
  IVisualCreator,
  Visual
} from 'yfiles'

/**
 * A simple edge style that draws a line from source to target node following the
 * given bends into the HTML5 Canvas.
 */
export default class CanvasEdgeStyle extends EdgeStyleBase {
  /**
   * Creates a new instance of this class.
   * @param {!Color} color The edge color.
   * @param {number} thickness The edge thickness
   */
  constructor(color, thickness) {
    super()
    this.thickness = thickness
    this.color = color
  }

  /**
   * Creates the visual representation for the given edge.
   * @param {!IRenderContext} context The render context.
   * @param {!IEdge} edge The edge to which this style instance is assigned.
   * @returns {!Visual} The visual as required by the {@link IVisualCreator.createVisual} interface.
   * @see {@link CanvasEdgeStyle.updateVisual}
   */
  createVisual(context, edge) {
    return new EdgeRenderVisual(
      edge.bends,
      edge.sourcePort.dynamicLocation,
      edge.targetPort.dynamicLocation,
      this.color,
      this.thickness
    )
  }

  /**
   * Updates the visual representation for the given edge.
   * @param {!IRenderContext} context The render context.
   * @param {!Visual} oldVisual The visual that has been created in the call to
   * {@link CanvasEdgeStyle.createVisual}.
   * @param {!IEdge} edge The edge to which this style instance is assigned.
   * @returns {!Visual} The visual as required by the {@link IVisualCreator.createVisual} interface.
   * @see {@link CanvasEdgeStyle.createVisual}
   */
  updateVisual(context, oldVisual, edge) {
    return oldVisual
  }
}

/**
 * For HTML5 Canvas based rendering we need to extend from {@link HtmlCanvasVisual}.
 */
class EdgeRenderVisual extends HtmlCanvasVisual {
  /**
   * Creates an edge render visual instance for an edge.
   * @param {!IListEnumerable.<IBend>} bends
   * @param {!IPoint} sourcePortLocation
   * @param {!IPoint} targetPortLocation
   * @param {!Color} color
   * @param {number} thickness
   */
  constructor(bends, sourcePortLocation, targetPortLocation, color, thickness) {
    super()
    this.thickness = thickness
    this.targetPortLocation = targetPortLocation
    this.sourcePortLocation = sourcePortLocation
    this.bends = bends
    this.bends = bends
    this.sourcePortLocation = sourcePortLocation
    this.targetPortLocation = targetPortLocation
    this.thickness = thickness
    this.color = `rgba(${color.r},${color.g},${color.b},${color.a})`
  }

  /**
   * Paints onto the context using HTML5 Canvas operations.
   * Implementations should not destroy the context's state, but should make sure to restore the
   * state to the previously active state. This is especially true for the transformation and clip.
   * @param {!IRenderContext} context The render context of the {@link CanvasComponent}
   * @param {!CanvasRenderingContext2D} htmlCanvasContext The HTML5 Canvas context to use for rendering.
   */
  paint(context, htmlCanvasContext) {
    // simply draw a black line from the source port location via all bends to the target port location
    htmlCanvasContext.strokeStyle = this.color
    htmlCanvasContext.lineWidth = this.thickness

    htmlCanvasContext.beginPath()
    let location = this.sourcePortLocation
    htmlCanvasContext.moveTo(location.x, location.y)
    if (this.bends.size > 0) {
      this.bends.forEach(bend => {
        location = bend.location
        htmlCanvasContext.lineTo(location.x, location.y)
      })
    }
    location = this.targetPortLocation
    htmlCanvasContext.lineTo(location.x, location.y)
    htmlCanvasContext.stroke()
  }
}
