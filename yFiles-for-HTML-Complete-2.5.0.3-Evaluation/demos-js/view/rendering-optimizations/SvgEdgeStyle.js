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
  Color,
  EdgeStyleBase,
  IArrow,
  ICanvasContext,
  IEdge,
  IRenderContext,
  IVisualCreator,
  Matrix,
  Point,
  PolylineEdgeStyle,
  Rect,
  SvgVisual,
  YObject
} from 'yfiles'

/**
 * A fast edge style. Compared to the default {@link PolylineEdgeStyle}, the edge is not cropped
 * at the node boundaries and does not support arrows.
 */
export default class SvgEdgeStyle extends EdgeStyleBase {
  /**
   * Creates a new instance of this class.
   * @param {!Color} [color] The edge color.
   * @param {number} [thickness] The edge thickness
   */
  constructor(color, thickness) {
    super()
    this.thickness = thickness
    this.color = color
    this.color = color || Color.BLACK
    this.thickness = thickness || 1
  }

  /**
   * Creates the visual representation for the given edge.
   * @param {!IRenderContext} context The render context.
   * @param {!IEdge} edge The edge to which this style instance is assigned.
   * @returns {!SvgVisual} The visual as required by the {@link IVisualCreator.createVisual} interface.
   * @see {@link SvgEdgeStyle.updateVisual}
   */
  createVisual(context, edge) {
    const source = edge.sourcePort.location
    const target = edge.targetPort.location

    // create the path
    const pathVisual = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    pathVisual.setAttribute('d', createSvgPath(source, target, edge))
    pathVisual.setAttribute('fill', 'none')
    const color = this.color
    pathVisual.setAttribute('stroke', `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`)
    pathVisual.setAttribute('stroke-width', `${this.thickness}`)

    // cache its values
    const cacheOwner = pathVisual
    cacheOwner['data-cache'] = new RenderDataCache(edge, source, target)

    return new SvgVisual(pathVisual)
  }

  /**
   * Updates the visual representation for the given edge.
   * @param {!IRenderContext} context The render context.
   * @param {!SvgVisual} oldVisual The visual that has been created in the call to
   * {@link SvgEdgeStyle.createVisual}.
   * @param {!IEdge} edge The edge to which this style instance is assigned.
   * @returns {!SvgVisual} The visual as required by the {@link IVisualCreator.createVisual} interface.
   * @see {@link SvgEdgeStyle.createVisual}
   */
  updateVisual(context, oldVisual, edge) {
    const source = edge.sourcePort.location
    const target = edge.targetPort.location

    // get the old path
    const pathVisual = oldVisual.svgElement
    const cache = pathVisual['data-cache']
    const oldSource = cache.source
    const oldTarget = cache.target

    const bendLocations = getBendLocations(edge)

    // Did anything change at all? If not, we can just re-use the old visual ...
    if (
      oldSource.equals(source) &&
      oldTarget.equals(target) &&
      arrayEqual(bendLocations, cache.bendLocations)
    ) {
      return oldVisual
    }

    // ... otherwise we need to re-create the geometry and update the cache.
    pathVisual.setAttribute('d', createSvgPath(source, target, edge))
    pathVisual['data-cache'] = new RenderDataCache(edge, source, target)
    return oldVisual
  }

  /**
   * Override visibility test to optimize performance.
   * @param {!ICanvasContext} context
   * @param {!Rect} rectangle
   * @param {!IEdge} edge
   * @returns {boolean}
   */
  isVisible(context, rectangle, edge) {
    // delegate the visibility test to PolylineEdgeStyle, which has an efficient implementation
    return helperEdgeStyle.renderer
      .getVisibilityTestable(edge, helperEdgeStyle)
      .isVisible(context, rectangle)
  }
}

// an edge style instance for efficient visibility testing
const helperEdgeStyle = new PolylineEdgeStyle({
  sourceArrow: IArrow.NONE,
  targetArrow: IArrow.NONE
})

/**
 * Stores the data that is necessary to determine whether or not the visual representation of
 * an edge has to be changed in {@link SvgEdgeStyle.updateVisual}.
 */
class RenderDataCache {
  /**
   * @param {!IEdge} edge
   * @param {!Point} source
   * @param {!Point} target
   */
  constructor(edge, source, target) {
    this.target = target
    this.source = source
    this.bendLocations = getBendLocations(edge)
  }
}

/**
 * Creates the edge path's geometry.
 * @param {!Point} source The source port location.
 * @param {!Point} target The target port location.
 * @param {!IEdge} edge The edge.
 * @returns {!string} The edge path's geometry.
 */
function createSvgPath(source, target, edge) {
  const path = edge.style.renderer.getPathGeometry(edge, edge.style).getPath()
  return path.createSvgPathData(new Matrix())
}

/**
 * Gets a list of bend locations from an edge.
 * @param {!IEdge} edge The edge.
 * @returns {!Array.<Point>} A list of the edge's bend locations, or an empty list if there are no bends.
 */
function getBendLocations(edge) {
  const count = edge.bends.size
  if (count > 0) {
    const points = new Array(count)
    let i = 0
    for (const bend of edge.bends) {
      points[i] = bend.location.toPoint()
      ++i
    }
    return points
  } else {
    return []
  }
}

/**
 * Compares two arrays for equality.
 * @param {!Array.<Point>} a The first array.
 * @param {!Array.<Point>} b The second array.
 * @returns {boolean} `true` if both arrays have the same length and all elements of one array
 * compare equal to the respective element in the other array, `false` otherwise.
 */
function arrayEqual(a, b) {
  if (YObject.referenceEquals(a, b)) {
    return true
  }

  if (a.length !== b.length) {
    return false
  }

  for (let i = 0; i < a.length; i++) {
    if (!a[i].equals(b[i])) {
      return false
    }
  }
  return true
}
