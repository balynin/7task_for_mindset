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
  GeneralPath,
  GraphMLAttribute,
  IArrow,
  IBoundsProvider,
  IEdge,
  ILookup,
  IRenderContext,
  IVisualCreator,
  MarkupExtension,
  Point,
  Rect,
  SvgVisual,
  TypeAttribute,
  Visual,
  YString
} from 'yfiles'
import { isColorSetName } from '../../resources/demo-styles.js'

/**
 * A custom demo arrow style whose colors match the given well-known CSS rule.
 */
export class Sample2Arrow extends BaseClass(IArrow, IVisualCreator, IBoundsProvider) {
  /**
   * @param {!(string|ColorSetName)} [cssClass]
   */
  constructor(cssClass) {
    super()
    this.cssClass = cssClass
    this.anchor = null
    this.direction = null
    this.arrowFigure = null
  }

  /**
   * Returns the length of the arrow, i.e. the distance from the arrow's tip to
   * the position where the visual representation of the edge's path should begin.
   * @see Specified by {@link IArrow.length}.
   * @type {number}
   */
  get length() {
    return 5.5
  }

  /**
   * Gets the cropping length associated with this instance.
   * This value is used by edge styles to let the
   * edge appear to end shortly before its actual target.
   * @see Specified by {@link IArrow.cropLength}.
   * @type {number}
   */
  get cropLength() {
    return 1
  }

  /**
   * Returns a configured visual creator.
   * @param {!IEdge} edge
   * @param {boolean} atSource
   * @param {!Point} anchor
   * @param {!Point} direction
   * @returns {!Sample2Arrow}
   */
  getVisualCreator(edge, atSource, anchor, direction) {
    this.anchor = anchor
    this.direction = direction
    return this
  }

  /**
   * Gets an {@link IBoundsProvider} implementation that can yield
   * this arrow's bounds if painted at the given location using the
   * given direction for the given edge.
   * @param {!IEdge} edge the edge this arrow belongs to
   * @param {boolean} atSource whether this will be the source arrow
   * @param {!Point} anchor the anchor point for the tip of the arrow
   * @param {!Point} direction the direction the arrow is pointing in
   * an implementation of the {@link IBoundsProvider} interface that can
   * subsequently be used to query the bounds. Clients will always call
   * this method before using the implementation and may not cache the instance returned.
   * This allows for applying the flyweight design pattern to implementations.
   * @see Specified by {@link IArrow.getBoundsProvider}.
   * @returns {!Sample2Arrow}
   */
  getBoundsProvider(edge, atSource, anchor, direction) {
    this.anchor = anchor
    this.direction = direction
    return this
  }

  /**
   * This method is called by the framework to create a visual
   * that will be included into the {@link IRenderContext}.
   * @param {!IRenderContext} ctx The context that describes where the visual will be used.
   * The arrow visual to include in the canvas object visual tree./>.
   * @see {@link Sample2Arrow.updateVisual}
   * @see Specified by {@link IVisualCreator.createVisual}.
   * @returns {!Visual}
   */
  createVisual(ctx) {
    // Create a new path to draw the arrow
    if (this.arrowFigure === null) {
      this.arrowFigure = new GeneralPath()
      this.arrowFigure.moveTo(new Point(-7.5, -2.5))
      this.arrowFigure.lineTo(new Point(0, 0))
      this.arrowFigure.lineTo(new Point(-7.5, 2.5))
      this.arrowFigure.close()
    }

    const path = window.document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', this.arrowFigure.createSvgPathData())
    path.setAttribute('fill', '#662b00')

    if (this.cssClass) {
      const attribute = isColorSetName(this.cssClass)
        ? `${this.cssClass}-edge-arrow`
        : this.cssClass
      path.setAttribute('class', attribute)
    }

    // Rotate arrow and move it to correct position
    path.setAttribute(
      'transform',
      `matrix(${this.direction.x} ${this.direction.y} ${-this.direction.y} ${this.direction.x} ${
        this.anchor.x
      } ${this.anchor.y})`
    )
    path['data-renderDataCache'] = {
      direction: this.direction,
      anchor: this.anchor
    }

    return new SvgVisual(path)
  }

  /**
   * This method updates or replaces a previously created visual for inclusion
   * in the {@link IRenderContext}.
   * The {@link CanvasComponent} uses this method to give implementations a chance to
   * update an existing Visual that has previously been created by the same instance during a call
   * to {@link Sample2Arrow.createVisual}. Implementations may update the `oldVisual`
   * and return that same reference, or create a new visual and return the new instance or `null`.
   * @param {!IRenderContext} ctx The context that describes where the visual will be used in.
   * @param {!SvgVisual} oldVisual The visual instance that had been returned the last time the
   *   {@link Sample2Arrow.createVisual} method was called on this instance.
   *  `oldVisual`, if this instance modified the visual, or a new visual that should replace the
   * existing one in the canvas object visual tree.
   * @see {@link Sample2Arrow.createVisual}
   * @see {@link ICanvasObjectDescriptor}
   * @see {@link CanvasComponent}
   * @see Specified by {@link IVisualCreator.updateVisual}.
   * @returns {!Visual}
   */
  updateVisual(ctx, oldVisual) {
    const path = oldVisual.svgElement
    const cache = path['data-renderDataCache']

    if (this.direction !== cache.direction || this.anchor !== cache.anchor) {
      path.setAttribute(
        'transform',
        `matrix(${this.direction.x} ${this.direction.y} ${-this.direction.y} ${this.direction.x} ${
          this.anchor.x
        } ${this.anchor.y})`
      )
    }

    return oldVisual
  }

  /**
   * Returns the bounds of the arrow for the current flyweight configuration.
   * @see Specified by {@link IBoundsProvider.getBounds}.
   * @param {!IRenderContext} ctx
   * @returns {!Rect}
   */
  getBounds(ctx) {
    return new Rect(this.anchor.x - 8, this.anchor.y - 8, 32, 32)
  }
}

export class Sample2ArrowExtension extends MarkupExtension {
  constructor() {
    super()
    this._cssClass = ''
  }

  /**
   * @type {!string}
   */
  get cssClass() {
    return this._cssClass
  }

  /**
   * @type {!string}
   */
  set cssClass(value) {
    this._cssClass = value
  }

  /**
   * @type {!object}
   */
  static get $meta() {
    return {
      cssClass: [GraphMLAttribute().init({ defaultValue: '' }), TypeAttribute(YString.$class)]
    }
  }

  /**
   * @param {!ILookup} serviceProvider
   * @returns {!Sample2Arrow}
   */
  provideValue(serviceProvider) {
    const arrow = new Sample2Arrow()
    arrow.cssClass = this.cssClass
    return arrow
  }
}
