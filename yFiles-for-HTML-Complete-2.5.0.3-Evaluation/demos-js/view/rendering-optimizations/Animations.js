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
  CanvasComponent,
  IAnimation,
  IEnumerable,
  IGraph,
  INode,
  List,
  Point,
  Rect,
  TimeSpan
} from 'yfiles'

/**
 * Animation that zooms in and out again.
 * Half the animation duration is spent zooming in from the initial zoom level to a given target
 * zoom level. The other half of the duration is spent zooming out again.
 */
export class ZoomInAndBackAnimation extends BaseClass(IAnimation) {
  /**
   * Initializes a new instance of the {@link ZoomInAndBackAnimation} class with the given target
   * zoom factor and preferred duration.
   * @param {!CanvasComponent} canvas The {@link CanvasComponent} whose viewport will be animated.
   * @param {number} targetZoom The target zoom factor.
   * @param {!TimeSpan} duration The preferred duration for the animation.
   */
  constructor(canvas, targetZoom, duration) {
    super()
    this.duration = duration
    this.canvas = canvas
    this.delta = 0
    this.initialZoomLog = 0
    this.targetZoomLog = Math.log(targetZoom) / Math.log(2)
  }

  /**
   * Gets the preferred duration of the animation.
   * @see Specified by {@link IAnimation.preferredDuration}.
   * @type {!TimeSpan}
   */
  get preferredDuration() {
    return this.duration
  }

  /**
   * Initializes the animation. Call this method once before subsequent
   * calls to {@link IAnimation.animate}.
   * @see Specified by {@link IAnimation.initialize}.
   */
  initialize() {
    this.initialZoomLog = Math.log(this.canvas.zoom) / Math.log(2)
    this.delta = this.targetZoomLog - this.initialZoomLog
  }

  /**
   * Does the animation according to the relative animation time.
   * The animation starts with the time 0 and ends with time 1.
   * @param {number} time the animation time [0,1]
   * @see Specified by {@link IAnimation.animate}.
   */
  animate(time) {
    const newZoom =
      time < 0.5
        ? this.initialZoomLog + this.delta * (time * 2)
        : this.targetZoomLog - this.delta * ((time - 0.5) * 2)
    this.canvas.zoom = Math.pow(2, newZoom)
  }

  /**
   * Cleans up after an animation has finished.
   * @see Specified by {@link IAnimation.cleanUp}.
   */
  cleanUp() {}
}

/**
 * An animation that pans the viewport in a circular motion.
 * The animation pans the viewport in a circle with a diameter of half the viewport's width.
 */
export class CirclePanAnimation extends BaseClass(IAnimation) {
  /**
   * Initializes a new instance of the {@link CirclePanAnimation} class with the given number of
   * revolutions and preferred duration.
   * @param {!CanvasComponent} canvas The {@link CanvasComponent} whose viewport will be animated.
   * @param {number} revolutions The number of rotations during the animation.
   * @param {!TimeSpan} duration The preferred duration for the animation.
   */
  constructor(canvas, revolutions, duration) {
    super()
    this.duration = duration
    this.revolutions = revolutions
    this.canvas = canvas
    this.lastAngle = 0
    this.lastRadius = 0
  }

  /**
   * Gets the preferred duration of the animation.
   * @see Specified by {@link IAnimation.preferredDuration}.
   * @type {!TimeSpan}
   */
  get preferredDuration() {
    return this.duration
  }

  /**
   * Initializes the animation. Call this method once before subsequent
   * calls to {@link IAnimation.animate}.
   * @see Specified by {@link IAnimation.initialize}.
   */
  initialize() {
    this.lastAngle = 0
    this.lastRadius = this.canvas.viewport.width / 4
  }

  /**
   * Does the animation according to the relative animation time.
   * The animation starts with the time 0 and ends with time 1.
   * @param {number} time the animation time [0,1]
   * @see Specified by {@link IAnimation.animate}.
   */
  animate(time) {
    // The circle radius depends on the viewport size to be zoom-invariant
    const radius = this.canvas.viewport.width / 4
    const totalAngle = 2 * Math.PI * this.revolutions
    const currentAngle = totalAngle * time

    // Undo the last frame's movement first
    const undo = new Point(
      Math.cos(this.lastAngle) * this.lastRadius,
      Math.sin(this.lastAngle) * this.lastRadius
    )
    // Then apply the current one. This is needed to play well with a simultaneous zoom animation.
    const p1 = new Point(this.canvas.viewPoint.x - undo.x, this.canvas.viewPoint.y - undo.y)
    const p2 = new Point(Math.cos(currentAngle) * radius, Math.sin(currentAngle) * radius)
    this.canvas.viewPoint = p1.add(p2)
    this.lastRadius = radius
    this.lastAngle = currentAngle
  }

  /**
   * Cleans up after an animation has finished.
   * @see Specified by {@link IAnimation.cleanUp}.
   */
  cleanUp() {}
}

/**
 * An animation that moves nodes in a circular motion.
 */
export class CircleNodeAnimation extends BaseClass(IAnimation) {
  /**
   * Initializes a new instance of the {@link CircleNodeAnimation} class with the given graph,
   * nodes, radius, number of revolutions, and preferred duration.
   * @param {!IGraph} graph The graph the nodes belong to.
   * @param {!IEnumerable.<INode>} nodes The nodes.
   * @param {number} radius The radius of the movement circle.
   * @param {number} revolutions The number of revolutions around the circle.
   * @param {!TimeSpan} duration The preferred duration for the animation.
   */
  constructor(graph, nodes, radius, revolutions, duration) {
    super()
    this.duration = duration
    this.revolutions = revolutions
    this.radius = radius
    this.graph = graph
    this.startBounds = new List()
    this.nodes = nodes.toList()
  }

  /**
   * Gets the preferred duration of the animation.
   * @see Specified by {@link IAnimation.preferredDuration}.
   * @type {!TimeSpan}
   */
  get preferredDuration() {
    return this.duration
  }

  /**
   * Initializes the animation. Call this method once before subsequent
   * calls to {@link IAnimation.animate}.
   * @see Specified by {@link IAnimation.initialize}.
   */
  initialize() {
    this.startBounds = this.nodes.map(n => n.layout.toRect()).toList()
  }

  /**
   * Does the animation according to the relative animation time.
   * The animation starts with the time 0 and ends with time 1.
   * @param {number} time the animation time [0,1]
   * @see Specified by {@link IAnimation.animate}.
   */
  animate(time) {
    const totalAngle = 2 * Math.PI * this.revolutions
    const currentAngle = totalAngle * time
    const offset = new Point(
      Math.cos(currentAngle) * this.radius,
      Math.sin(currentAngle) * this.radius
    )

    this.nodes.forEach((node, index) => {
      const topRight = new Point(this.radius, 0)
      const bounds = this.startBounds.get(index)
      const topLeft = bounds.topLeft
      const p = new Point(topLeft.x - topRight.x, topLeft.y - topRight.y)
      this.graph.setNodeLayout(node, new Rect(p.add(offset), bounds.size))
    })
  }

  /**
   * Cleans up after an animation has finished.
   * @see Specified by {@link IAnimation.cleanUp}.
   */
  cleanUp() {}
}
