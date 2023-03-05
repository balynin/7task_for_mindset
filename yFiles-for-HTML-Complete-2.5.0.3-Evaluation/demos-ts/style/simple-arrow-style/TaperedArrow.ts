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
  Fill,
  IArrow,
  IBoundsProvider,
  ICanvasContext,
  IEdge,
  IEdgeStyle,
  ILookup,
  IRenderContext,
  IVisualCreator,
  MarkupExtension,
  Matrix,
  Point,
  Rect,
  SvgVisual,
  Visual
} from 'yfiles'

/**
 * An arrow that appears like the edge tapers to a point.
 */
export class TaperedArrow
  extends BaseClass(IArrow, IVisualCreator, IBoundsProvider)
  implements IArrow, IVisualCreator, IBoundsProvider
{
  // these variables hold the state for the flyweight pattern
  // they are populated in getVisualCreator and used in the implementations of the IVisualCreator interface.
  private anchor: Point = Point.ORIGIN
  private direction: Point = Point.ORIGIN

  // the un-rotated bounds of the arrow
  private bounds: Rect = null!
  // backing field properties width, length
  private _width: number
  private _length: number

  // The shape of the arrow's path.
  // We draw in a normalized coordinate system where the edge is horizontal and meets the target at (0,0)
  // The path is just a simple triangle with length and width 1 - the actual adjustment is done by simply scaling everything later.
  // We create a tiny overlap between the edge and the arrow by painting a fraction over the edge.
  // This avoids anti-aliasing artifacts where the edge meets the arrow.
  private readonly _pathShape = 'M -1.1,-0.5 L -1,-0.5 L 0,0 L -1,0.5 L -1.1,0.5 Z'

  /**
   * The fill of this arrow
   */
  public fill: Fill

  /**
   * Initializes a new instance of the {@link TaperedArrow} class.
   * @param width The width of the arrow
   * @param length The length of the arrow
   * @param fill The color of the arrow
   */
  constructor(width = 2, length = 0, fill: Fill = Fill.BLACK) {
    super()
    this._width = width
    this._length = length
    this.updateBounds()
    this.fill = fill
  }

  /**
   * Returns the length of the arrow, i.e. the distance from the arrow's tip to
   * the position where the visual representation of the edge's path should begin.
   * @see Specified by {@link IArrow.length}.
   */
  get length(): number {
    return this._length
  }

  set length(value: number) {
    this._length = value
    this.updateBounds()
  }

  /**
   * Returns the thickness of the arrow.
   */
  get width(): number {
    return this._width
  }

  set width(value: number) {
    this._width = value
    this.updateBounds()
  }

  /**
   * Calculates the bounds for the current values of length and width.
   */
  private updateBounds() {
    this.bounds = new Rect(-this._length, -this._width / 2, this._width, this._width)
  }

  /**
   * Gets the cropping length associated with this instance.
   * Value: Always returns 0
   * This value is used by {@link IEdgeStyle}s to let the
   * edge appear to end shortly before its actual target.
   * @see Specified by {@link IArrow.cropLength}.
   */
  get cropLength() {
    return 0
  }

  /**
   * Creates the visual for the arrow.
   * @param context The context that contains the information needed to create the visual.
   * @returns The arrow visual.
   * @see Specified by {@link IVisualCreator.createVisual}.
   */
  createVisual(context: IRenderContext): Visual | null {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', this._pathShape)

    // set the fill of the path
    Fill.setFill(this.fill, path, context)

    // scale and arrange the path to the correct position
    path.setAttribute(
      'transform',
      `matrix(${this.direction.x} ${this.direction.y} ${-this.direction.y} ${this.direction.x} ${
        this.anchor.x
      } ${this.anchor.y}) scale(${this.length},${this.width})`
    )

    const visual = new SvgVisual(path)
    ;(visual as any)['render-data-cache'] = this.fill
    return visual
  }

  /**
   * Re-renders the arrow using the old visual for performance reasons.
   * @param context The context that contains the information needed to create the visual.
   * @param oldVisual The visual instance that had been returned the last time the
   *   {@link MySimpleArrow.createVisual} method was called.
   * @returns The updated visual.
   * @see Specified by {@link IVisualCreator.updateVisual}.
   */
  updateVisual(context: IRenderContext, oldVisual: Visual | null): Visual | null {
    const path = (oldVisual as SvgVisual).svgElement
    if (path === null) {
      // no path element exists, re-create the visual from scratch
      return this.createVisual(context)
    }

    const cache = (oldVisual as any)['render-data-cache']
    // check if fill changed
    if (!this.fill.equals(cache)) {
      // fill changed - update the path and the cache
      Fill.setFill(this.fill, path, context)
      ;(oldVisual as any)['render-data-cache'] = this.fill
    }

    // otherwise just scale and re-arrange and transform the arrow path to the right location
    path.setAttribute(
      'transform',
      `matrix(${this.direction.x} ${this.direction.y} ${-this.direction.y} ${this.direction.x} ${
        this.anchor.x
      } ${this.anchor.y}) scale(${this.length},${this.width})`
    )
    return oldVisual
  }

  /**
   * Returns the bounds of the arrow for the current flyweight configuration.
   * @param context The context to calculate the bounds for.
   */
  getBounds(context: ICanvasContext): Rect {
    return this.bounds.getTransformed(
      new Matrix(
        this.direction.x,
        this.direction.y,
        -this.direction.y,
        this.direction.x,
        this.anchor.x,
        this.anchor.y
      )
    )
  }

  /**
   * Gets an {@link IBoundsProvider} implementation that can yield
   * this arrow's bounds if painted at the given location using the
   * given direction for the given edge.
   * @param edge the edge this arrow belongs to
   * @param atSource whether this will be the source arrow
   * @param anchor the anchor point for the tip of the arrow
   * @param directionVector the direction the arrow is pointing in
   * an implementation of the {@link IBoundsProvider} interface that can
   * subsequently be used to query the bounds. Clients will always call
   * this method before using the implementation and may not cache the instance returned.
   * This allows for applying the flyweight design pattern to implementations.
   * @see Specified by {@link IArrow.getBoundsProvider}.
   */
  getBoundsProvider(
    edge: IEdge,
    atSource: boolean,
    anchor: Point,
    directionVector: Point
  ): IBoundsProvider {
    this.anchor = anchor
    this.direction = directionVector
    return this
  }

  /**
   * Gets an {@link IVisualCreator} implementation that will create
   * the {@link IVisualCreator} for this arrow
   * at the given location using the given direction for the given edge.
   * @param edge the edge this arrow belongs to
   * @param atSource whether this will be the source arrow
   * @param anchor the anchor point for the tip of the arrow
   * @param direction the direction the arrow is pointing in
   * Itself as a flyweight.
   * @see Specified by {@link IArrow.getVisualCreator}.
   */
  getVisualCreator(
    edge: IEdge,
    atSource: boolean,
    anchor: Point,
    direction: Point
  ): IVisualCreator {
    this.anchor = anchor
    this.direction = direction
    return this
  }
}

/**
 * A markup extension class used for (de-)serializing the custom arrow style to GraphML.
 */
export class TaperedArrowExtension extends MarkupExtension {
  private _width = 2
  private _length = 0
  private _fill: Fill = Fill.BLACK

  get width(): number {
    return this._width
  }

  set width(value: number) {
    this._width = value
  }

  get length(): number {
    return this._length
  }

  set length(value: number) {
    this._length = value
  }

  get fill(): Fill {
    return this._fill
  }

  set fill(value: Fill) {
    this._fill = value
  }

  /**
   * Returns an object that is set as the value of the target property for this markup extension.
   * @param serviceProvider The object that provides services for the markup extension
   */
  provideValue(serviceProvider: ILookup): TaperedArrow {
    const arrow = new TaperedArrow()
    arrow.width = this.width
    arrow.length = this.length
    arrow.fill = this.fill
    return arrow
  }
}
