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
import { addClass, hasClass, removeClass } from '../../resources/demo-app'
import { CSS_CLASS_PRESET_APPLIED } from './PresetsUiBuilder'

const CSS_CLASS_VISIBLE = 'visible'
const CSS_CLASS_ACTIVE = 'active'

/**
 * Manages the tooltips for the preset buttons.
 */
export class Tooltip {
  private readonly element: HTMLDivElement
  private dummy: HTMLDivElement
  private hideTimer: any
  private deltaHeight: number

  constructor() {
    this.element = document.getElementById('preset-tooltip') as HTMLDivElement
    this.dummy = Tooltip.createDummyElement(this.element)
    this.deltaHeight = this.element.parentElement!.getBoundingClientRect().top
  }

  /**
   * Shows the tooltip text for the given activator element.
   * @param activator The button for which the tool tip is shown.
   * @param content The tool tip text.
   */
  show(activator: HTMLElement, content: string): void {
    const triangleSize = 12
    const activatorBounds = activator.getBoundingClientRect()
    const activatorAnchorX = activatorBounds.left + activatorBounds.width / 2
    const activatorAnchorY = activatorBounds.top + activatorBounds.height + triangleSize + 2

    const tooltipHeight = this.calculateTooltipHeight(content)
    if (Tooltip.fitsViewport(activatorAnchorY + tooltipHeight)) {
      // do not hide tooltip if a new one is already triggered
      clearTimeout(this.hideTimer)

      const element = this.element
      const contentDiv = element.querySelector('.content') as HTMLDivElement
      contentDiv.innerHTML = content
      element.style.display = 'block'
      element.style.top = `${activatorAnchorY - this.deltaHeight}px`

      const tooltipBounds = element.getBoundingClientRect()
      const triangle = element.querySelector('.triangle') as HTMLSpanElement
      triangle.style.left = `${activatorAnchorX - tooltipBounds.left - triangleSize}px`

      this.updateActive(activator)
      addClass(element, CSS_CLASS_VISIBLE)
    }
  }

  /**
   * Hides the tooltip.
   */
  hide(): void {
    const element = this.element
    removeClass(element, CSS_CLASS_VISIBLE)

    // remove the tooltip from the DOM, after the fade-out CSS transition has finished
    this.hideTimer = setTimeout(() => {
      element.style.display = 'none'
    }, 210)
  }

  /**
   * @param activator The button for which the tool tip is shown.
   */
  private updateActive(activator: HTMLElement): void {
    const element = this.element
    removeClass(element, CSS_CLASS_ACTIVE)
    if (hasClass(activator, CSS_CLASS_PRESET_APPLIED)) {
      addClass(element, CSS_CLASS_ACTIVE)
    }
  }

  /**
   * Whether the tooltip fits into the current view port without being clipped.
   * @param maxY The maximum y-coordinate of the current viewport.
   */
  private static fitsViewport(maxY: number): boolean {
    return document.documentElement.clientHeight > maxY
  }

  /**
   * @param content The tool tip text.
   */
  private calculateTooltipHeight(content: string): number {
    this.dummy.innerHTML = content
    const height = this.dummy.getBoundingClientRect().height
    this.dummy.innerHTML = ''
    return height
  }

  /**
   * Creates a dummy element to measure the tooltip height off-screen in order to not show the
   * tooltip content if it does not fit the current viewport.
   * @param tooltipElement The container for the tool tip text.
   */
  private static createDummyElement(tooltipElement: HTMLDivElement): HTMLDivElement {
    const dummy = document.createElement('div')
    addClass(dummy, 'preset-tooltip-dummy')
    dummy.style.width = tooltipElement.style.width
    tooltipElement.parentElement!.appendChild(dummy)
    return dummy
  }
}
