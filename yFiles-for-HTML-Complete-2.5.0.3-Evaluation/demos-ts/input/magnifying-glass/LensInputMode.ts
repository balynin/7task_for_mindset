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
/* eslint-disable @typescript-eslint/unbound-method */
import {
  CanvasComponent,
  ConcurrencyController,
  delegate,
  EventArgs,
  GraphComponent,
  IInputModeContext,
  InputModeBase,
  MouseEventArgs,
  MouseWheelBehaviors,
  ScrollBarVisibility
} from 'yfiles'

import { applyDemoTheme } from '../../resources/demo-styles'

// noinspection CssInvalidFunction
/**
 * A specialized input mode that shows a floating magnifying lens that magnifies the cursor's
 * surroundings.
 */
export class LensInputMode extends InputModeBase {
  private readonly lensElement: HTMLDivElement
  private lensGraphComponent: GraphComponent | null = null
  private $zoomFactor = 2

  constructor() {
    super()
    // The changeable radius of the lens
    const radius = 120
    // The changeable difference between the coordinates of the mouse and the border of the lens
    const margin = 0

    // Some derived values
    const center = margin + radius
    const diameter = 2 * radius
    // The size with a small offset to make sure that the lens stroke is fully visible
    const size = diameter + margin + 10

    // The SVG path of the "shadow" of the lens
    const lensShadowPath = `m ${margin} ${center} L 0 20 L 20 0 L ${center} ${margin} A ${radius} ${radius} 0 0 0 ${margin} ${center}`
    // THe SVG path of the cross in the center of the lens
    const crossPath = `M ${center - 10} ${center} h 7 m 6 0 h 7 M ${center} ${
      center - 10
    } v 7 m 0 6 v 7`
    // The placement of the lens graph component
    const lensComponentPlacement = `width: ${diameter}px; height: ${diameter}px; top: ${
      margin + 5
    }px; left: ${margin + 5}px;`

    // The DOM elements of the lens
    this.lensElement = document.createElement('div')
    this.lensElement.setAttribute(
      'style',
      `pointer-events: none;
          width: ${size}px;
          height: ${size}px;
          top: 0px;
          left: 0px;
          position: absolute;
          overflow: visible;
          opacity: 0;
          transition: opacity .3s ease-in;`
    )
    this.lensElement.innerHTML = `
      <svg xmlns='http://www.w3.org/2000/svg' class='demo-lens-border'
        width='${size}' height='${size}px' viewBox='-5 -5 ${size} ${size}'
      >
        <defs>
          <linearGradient id='lens-gradient' x1='0' y1='0' x2='1' y2='1'>
            <stop stop-color='black' stop-opacity='0%' offset='0%' />
            <stop stop-color='black' stop-opacity='0%' offset='10%' />
            <stop stop-color='black' stop-opacity='40%' offset='100%' />
          </linearGradient>
        </defs>
        <path d='${lensShadowPath}' fill='url(#lens-gradient)' />
      </svg>
      <div class='demo-lens-component'
        style='${lensComponentPlacement} clip-path: circle(${radius}px); position: absolute; background: white;'></div>
      <svg xmlns='http://www.w3.org/2000/svg' class='demo-lens-cross'
        width='${size}' height='${size}px' viewBox='-5 -5 ${size} ${size}'
        style='position: absolute; top: 0; left: 0;'
      >
        <circle r='${radius}' cx='${center}' cy='${center}'
          stroke='#666' stroke-width='3' fill='none' />
        <path d='${crossPath}' stroke='white' stroke-opacity='0.3' stroke-width='5' stroke-linecap='round' />
        <path d='${crossPath}' stroke='#333' stroke-opacity='0.8' stroke-width='2' stroke-linecap='round' />
      </svg> `
  }

  /**
   * Hides the HTML element that represents the lens component.
   */
  hideLens() {
    this.lensElement.style.opacity = '0.0'
  }

  /**
   * Shows the HTML element that represents the lens component.
   */
  showLens() {
    this.lensElement.style.opacity = '1.0'
  }

  /**
   * Determines whether the lens element should be visible or not.
   * Normally, the magnifying glass should be hidden when the zoom level of the graphComponent is
   * larger than 0.7 or if the size of the graphComponent is small.
   */
  updateLensVisibility() {
    const canvasComponent = this.inputModeContext?.canvasComponent
    if (
      canvasComponent != null &&
      canvasComponent.zoom < 0.7 &&
      canvasComponent.size.width > 200 &&
      canvasComponent.size.height > 200 &&
      canvasComponent.lastInputEvent !== EventArgs.EMPTY &&
      canvasComponent.viewport.contains(canvasComponent.lastEventLocation)
    ) {
      this.showLens()
      return true
    } else {
      this.hideLens()
      return false
    }
  }

  /**
   * Updates the location of the magnifying component.
   * @param sender The source of the event
   * @param location The event
   * @param location.location The current mouse location
   */
  updateLensLocation(sender: CanvasComponent, { location }: MouseEventArgs) {
    if (
      this.lensGraphComponent != null &&
      this.lensElement != null &&
      this.updateLensVisibility()
    ) {
      this.lensGraphComponent.center = location
      const viewCoords = sender.toViewCoordinates(location)
      this.lensElement.style.left = `${Math.round(viewCoords.x)}px`
      this.lensElement.style.top = `${Math.round(viewCoords.y)}px`
    }
  }

  /**
   * Returns the zoom factor of the graphComponent of the LensInputMode.
   */
  get zoomFactor(): number {
    return this.$zoomFactor
  }

  /**
   * Set the zoom factor of the graphComponent of the LensInputMode.
   */
  set zoomFactor(value: number) {
    this.$zoomFactor = value
    this.inputModeContext!.canvasComponent!.invalidate()
    this.lensGraphComponent!.zoom = this.zoomFactor
  }

  /**
   * Installs this LensInputMode.
   * @param context The context to install this mode into
   * @param controller The controller for this mode
   */
  install(context: IInputModeContext, controller: ConcurrencyController) {
    super.install(context, controller)

    const graphComponent = context.canvasComponent as GraphComponent

    // Initialize the lens graph component
    this.lensGraphComponent = new GraphComponent({
      // Get the div for the lens graphComponent
      div: this.lensElement.querySelector<HTMLDivElement>('.demo-lens-component')!,

      // Re-use the same graph, selection, projection
      graph: graphComponent.graph,
      selection: graphComponent.selection,
      projection: graphComponent.projection,

      // Disable interaction and scrollbars
      mouseWheelBehavior: MouseWheelBehaviors.NONE,
      autoDrag: false,
      horizontalScrollBarPolicy: ScrollBarVisibility.NEVER,
      verticalScrollBarPolicy: ScrollBarVisibility.NEVER,

      // Set the zoom factor of the graph component
      zoom: this.zoomFactor
    })
    applyDemoTheme(this.lensGraphComponent)

    graphComponent.overlayPanel.appendChild(this.lensElement)

    // Add the listeners to the initial graph component that will update the position and the zoom
    // of the lens
    const mouseMoveListener = delegate(this.updateLensLocation, this)
    graphComponent.addMouseMoveListener(mouseMoveListener)
    graphComponent.addMouseDragListener(mouseMoveListener)

    const visibilityChangeListener = delegate(this.updateLensVisibility, this)
    graphComponent.addZoomChangedListener(visibilityChangeListener)
    graphComponent.addMouseLeaveListener(visibilityChangeListener)
    graphComponent.addMouseEnterListener(visibilityChangeListener)

    this.hideLens()
  }

  /**
   * Uninstalls this LensInputMode.
   * @param context The context to install this mode into
   */
  uninstall(context: IInputModeContext) {
    this.hideLens()
    const canvasComponent = context.canvasComponent!

    // remove the listeners
    const mouseMoveListener = delegate(this.updateLensLocation, this)
    canvasComponent.removeMouseMoveListener(mouseMoveListener)
    canvasComponent.removeMouseDragListener(mouseMoveListener)

    const visibilityChangeListener = delegate(this.updateLensVisibility, this)
    canvasComponent.removeZoomChangedListener(visibilityChangeListener)
    canvasComponent.removeMouseLeaveListener(visibilityChangeListener)
    canvasComponent.removeMouseEnterListener(visibilityChangeListener)

    // clean up
    canvasComponent.overlayPanel.removeChild(this.lensGraphComponent!.div)
    this.lensGraphComponent!.cleanUp()
    this.lensGraphComponent = null

    super.uninstall(context)
  }
}
