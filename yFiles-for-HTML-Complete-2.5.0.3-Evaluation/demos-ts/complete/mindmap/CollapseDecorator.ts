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
  Class,
  ExteriorLabelModel,
  ExteriorLabelModelPosition,
  FilteredGraphWrapper,
  GeneralPath,
  GraphComponent,
  ICanvasContext,
  IconLabelStyle,
  IGraph,
  IInputModeContext,
  ILabelModelParameter,
  INode,
  INodeStyle,
  Insets,
  InteriorLabelModel,
  IRenderContext,
  NodeStyleBase,
  Point,
  Rect,
  SimpleLabel,
  Size,
  SvgVisual,
  Visual
} from 'yfiles'

import DemoCommands from './DemoCommands'
import type { NodeData } from './MindmapUtil'
import { hasChildNodes } from './MindmapUtil'
import { BrowserDetection } from '../../utils/BrowserDetection'

/**
 * A node style decorator that adds a collapse button to the node.
 *
 * This style implements the decorator pattern. Two {@link IconLabelStyle}
 * instances are used to render the collapse and expand buttons. The actual
 * style is determined using the {@link NodeData.isCollapsed isCollapsed}
 * information in the node's tag.
 *
 * A {@link SimpleLabel dummy label} is used to render the collapse
 * button. Two label model parameters determine the placement of the label on the
 * bottom-right and bottom-left corner of the node. This way the button placement
 * is determined automatically by the dummy label's style.
 */
export default class CollapseDecorator extends NodeStyleBase {
  wrappedStyle: INodeStyle

  /**
   * Creates a new instance of this style using the given wrappedStyle style.
   * @param wrappedStyle The style that is decorated by this instance.
   */
  constructor(wrappedStyle: INodeStyle) {
    super()
    this.wrappedStyle = wrappedStyle
  }

  /**
   * Creates the wrappedStyle visual and adds the icon visualization.
   * @param context The render context.
   * @param node The node to which this style instance is assigned.
   * @see Overrides {@link NodeStyleBase.createVisual}
   */
  createVisual(context: IRenderContext, node: INode): SvgVisual {
    // create the outer g element
    const g = window.document.createElementNS('http://www.w3.org/2000/svg', 'g')

    // create the wrappedStyle visual
    const wrappedStyleVisual = this.wrappedStyle.renderer
      .getVisualCreator(node, this.wrappedStyle)
      .createVisual(context) as SvgVisual

    const iconVisual = this.createIconVisual(
      node,
      context,
      hasChildNodes(node, getFullGraph(context)!)
    )

    // adds the click and touch event listeners to the state icon
    iconVisual.addEventListener(
      'click',
      () => {
        const demoCommand = new DemoCommands(context.canvasComponent as GraphComponent)
        demoCommand.executeToggleCollapseState(node)
      },
      true
    )
    iconVisual.addEventListener(
      'touchstart',
      evt => {
        // prevent subsequent firing of a click event
        evt.preventDefault()
        const demoCommand = new DemoCommands(context.canvasComponent as GraphComponent)
        demoCommand.executeToggleCollapseState(node)
      },
      BrowserDetection.passiveEventListeners
        ? {
            passive: false,
            capture: true
          }
        : true
    )

    // add both visuals to outer container
    g.appendChild(wrappedStyleVisual.svgElement)
    g.appendChild(iconVisual)

    // store wrappedStyle visual for updateVisual
    ;(g as any)['wrappedStyle-visual'] = wrappedStyleVisual
    return new SvgVisual(g)
  }

  /**
   * Updates the Visual.
   * @param context The render context.
   * @param oldVisual The old visual.
   * @param node The node to which this style instance is assigned.
   * @see Overrides {@link NodeStyleBase.updateVisual}
   */
  updateVisual(context: IRenderContext, oldVisual: Visual, node: INode): Visual {
    if (!(oldVisual instanceof SvgVisual) || !('wrappedStyle-visual' in oldVisual.svgElement)) {
      return this.createVisual(context, node)
    }

    const container = oldVisual.svgElement as SVGElement & { 'wrappedStyle-visual': SvgVisual }
    // retrieve the wrappedStyle visual from the container
    const wrappedStyleVisual = container['wrappedStyle-visual']
    // update the wrappedStyle visual
    const newWrappedVisual = this.wrappedStyle.renderer
      .getVisualCreator(node, this.wrappedStyle)
      .updateVisual(context, wrappedStyleVisual) as SvgVisual
    if (!wrappedStyleVisual.equals(newWrappedVisual)) {
      container.childNodes[0] = newWrappedVisual.svgElement
      ;(container as any)['wrappedStyle-visual'] = newWrappedVisual
    }

    // retrieve the icon visual from the container
    const iconElement = container.childNodes[1] as Element
    // update the icon visual
    CollapseDecorator.updateIconVisual(
      node,
      context,
      iconElement,
      hasChildNodes(node, getFullGraph(context)!)
    )

    return oldVisual
  }

  /**
   * Creates the icon visualization.
   * @param node The node to create the visual for.
   * @param context The render context.
   * @param visible True if the icon should be visible, false otherwise.
   * @returns The icon visual.
   */
  createIconVisual(node: INode, context: IRenderContext, visible: boolean) {
    const g = window.document.createElementNS('http://www.w3.org/2000/svg', 'g')

    // create a label that acts as a dummy item to render the icon
    const label = createDummyLabel(node)
    // store the label with the visual for updating
    ;(g as any)['data-renderCache'] = label

    if (visible) {
      // delegate the rendering of the dummy label to the label's style
      const renderer = label.style.renderer
      const creator = renderer.getVisualCreator(label, label.style)
      const iconVisual = creator.createVisual(context) as SvgVisual
      if (iconVisual !== null) {
        iconVisual.svgElement.setAttribute('class', 'collapseButton')
        g.appendChild(iconVisual.svgElement)
        ;(g as any)['data-visual'] = iconVisual
      }
    }
    return g
  }

  /**
   * Updates the icon visualization with the current data.
   * @param node The node to update the visual for.
   * @param context The render context.
   * @param container The HTML Element that contains the icon.
   * @param visible True if the icon should be visible, false otherwise.
   */
  static updateIconVisual(
    node: INode,
    context: IRenderContext,
    container: Element,
    visible: boolean
  ): void {
    // retrieve the old dummy label from the container
    const label = (container as any)['data-renderCache']
    // get the label model parameter and style to use for the dummy label
    const newModelParameter = getLabelModelParameter(node.tag)
    const newStyle = getLabelStyle(node.tag)

    const oldButtonVisual = (container as any)['data-visual']

    if (visible) {
      let newButtonVisual: SvgVisual
      if (
        label.style.icon === newStyle.icon &&
        label.style.iconPlacement === newStyle.iconPlacement &&
        label.style.iconSize === newStyle.iconSize &&
        label.layoutParameter === newModelParameter
      ) {
        // if style and label model parameter did not change update the label visual
        newButtonVisual = label.style.renderer
          .getVisualCreator(label, label.style)
          .updateVisual(context, oldButtonVisual) as SvgVisual
      } else {
        label.style = newStyle
        label.layoutParameter = newModelParameter
        // and create new label visual
        newButtonVisual = label.style.renderer
          .getVisualCreator(label, label.style)
          .createVisual(context) as SvgVisual
      }

      if (oldButtonVisual !== newButtonVisual) {
        ;(container as any)['data-visual'] = newButtonVisual
        newButtonVisual.svgElement.setAttribute('class', 'collapseButton')
        while (container.lastChild != null) {
          container.removeChild(container.lastChild)
        }
        container.appendChild(newButtonVisual.svgElement)
      }
    } else {
      // if not visible, remove all children
      while (container.lastChild != null) {
        container.removeChild(container.lastChild)
      }
    }
  }

  /**
   * Checks if the icon and the wrappedStyle style are visible.
   * @param canvasContext The canvas context.
   * @param clip The clipping rectangle.
   * @param node The given node.
   * @see Overrides {@link NodeStyleBase.isVisible}
   */
  isVisible(canvasContext: ICanvasContext, clip: Rect, node: INode): boolean {
    // check if node bounds + icon is visible
    const isIconVisible = clip.intersects(
      node.layout
        .toRect()
        .getEnlarged(
          new Insets(ICON_SIZE.width, ICON_SIZE.height, ICON_SIZE.width, ICON_SIZE.height)
        )
    )
    return (
      isIconVisible ||
      this.wrappedStyle.renderer
        .getVisibilityTestable(node, this.wrappedStyle)
        .isVisible(canvasContext, clip)
    )
  }

  /**
   * Delegates the call to the wrappedStyle style.
   * @param node The given node.
   * @see Overrides {@link NodeStyleBase.getOutline}
   */
  getOutline(node: INode): GeneralPath | null {
    return this.wrappedStyle.renderer.getShapeGeometry(node, this.wrappedStyle).getOutline()
  }

  /**
   * Delegates the call to the wrappedStyle style.
   * @param canvasContext The canvas context.
   * @param node The given node.
   * @see Overrides {@link NodeStyleBase.getBounds}
   */
  getBounds(canvasContext: ICanvasContext, node: INode): Rect {
    return this.wrappedStyle.renderer
      .getBoundsProvider(node, this.wrappedStyle)
      .getBounds(canvasContext)
  }

  /**
   * Delegates the call to the wrappedStyle style.
   * @param canvasContext The canvas context.
   * @param p The point to test.
   * @param node The given node.
   * @see Overrides {@link NodeStyleBase.isHit}
   */
  isHit(canvasContext: IInputModeContext, p: Point, node: INode): boolean {
    return this.wrappedStyle.renderer
      .getHitTestable(node, this.wrappedStyle)
      .isHit(canvasContext, p)
  }

  /**
   * Delegates the call to the wrappedStyle style.
   * @param canvasContext The canvas context.
   * @param box The marquee selection box.
   * @param node The given node.
   * @see Overrides {@link NodeStyleBase.isInBox}
   */
  isInBox(canvasContext: IInputModeContext, box: Rect, node: INode): boolean {
    return this.wrappedStyle.renderer
      .getMarqueeTestable(node, this.wrappedStyle)
      .isInBox(canvasContext, box)
  }

  /**
   * Delegates the call to the wrappedStyle style.
   * @param node The given node.
   * @param type The type to query.
   * @see Overrides {@link NodeStyleBase.lookup}
   */
  lookup(node: INode, type: Class): object | null {
    return this.wrappedStyle.renderer.getContext(node, this.wrappedStyle).lookup(type)
  }

  /**
   * Delegates the call to the wrappedStyle style.
   * @param node The given node.
   * @param inner The inner coordinates.
   * @param outer The outer coordinates.
   * @see Overrides {@link NodeStyleBase.getIntersection}
   */
  getIntersection(node: INode, inner: Point, outer: Point): Point | null {
    return this.wrappedStyle.renderer
      .getShapeGeometry(node, this.wrappedStyle)
      .getIntersection(inner, outer)
  }

  /**
   * Delegates the call to the wrappedStyle style.
   * @param node The given node.
   * @param point The point to test.
   * @see Overrides {@link NodeStyleBase.isInside}
   */
  isInside(node: INode, point: Point): boolean {
    return this.wrappedStyle.renderer.getShapeGeometry(node, this.wrappedStyle).isInside(point)
  }
}

/**
 * Returns the size of the icon.
 */
const ICON_SIZE: Size = new Size(18, 18)

/**
 * Returns the style of an icon that will be placed on the left of the node.
 */
function getIconStyleLeft(): IconLabelStyle {
  return new IconLabelStyle({
    icon: 'resources/arrowLeft.svg',
    iconSize: ICON_SIZE,
    iconPlacement: InteriorLabelModel.CENTER
  })
}

/**
 * Returns the style of an icon that will be placed on the right of the node.
 */
function getIconStyleRight(): IconLabelStyle {
  return new IconLabelStyle({
    icon: 'resources/arrowRight.svg',
    iconSize: ICON_SIZE,
    iconPlacement: InteriorLabelModel.CENTER
  })
}

/**
 * Returns the label model parameter for a label that will be placed on the left of the node.
 */
function getLabelModelParameterLeft(): ILabelModelParameter {
  return new ExteriorLabelModel({ insets: new Insets(0, 0, 0, -9) }).createParameter(
    ExteriorLabelModelPosition.SOUTH_WEST
  )
}

/**
 * Returns the label model parameter for a label that will be placed on the right of the node.
 */
function getLabelModelParameterRight(): ILabelModelParameter {
  return new ExteriorLabelModel({ insets: new Insets(0, 0, 0, -9) }).createParameter(
    ExteriorLabelModelPosition.SOUTH_EAST
  )
}

/**
 * Creates the dummy label used to render the icon.
 * @param node The node to create the label for.
 */
function createDummyLabel(node: INode): SimpleLabel {
  const data = node.tag as NodeData
  // create a new dummy label
  const label = new SimpleLabel(node, '', getLabelModelParameter(data))
  // set the size
  label.preferredSize = ICON_SIZE
  // set the label style
  label.style = getLabelStyle(node.tag)
  return label
}

/**
 * Gets the label style used to render the dummy label.
 * @param data The node tag.
 */
function getLabelStyle(data: NodeData): IconLabelStyle {
  return data.isLeft === data.isCollapsed ? getIconStyleLeft() : getIconStyleRight()
}

/**
 * Gets the label model parameter used to render the dummy label.
 * @param data The node tag.
 */
function getLabelModelParameter(data: NodeData): ILabelModelParameter {
  if (data.depth === 0) {
    return ExteriorLabelModel.SOUTH
  }
  return data.isLeft ? getLabelModelParameterLeft() : getLabelModelParameterRight()
}

/**
 * Gets the full graph from the context.
 * @param context The render context.
 */
function getFullGraph(context: IRenderContext): IGraph | null {
  if (context.canvasComponent instanceof GraphComponent) {
    const graph = context.canvasComponent.graph
    if (graph instanceof FilteredGraphWrapper) {
      return graph.wrappedGraph
    }
  }
  return null
}
