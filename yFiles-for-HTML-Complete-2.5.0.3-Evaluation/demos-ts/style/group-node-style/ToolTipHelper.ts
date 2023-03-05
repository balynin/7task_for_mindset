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
import type { IModelItem, QueryItemToolTipEventArgs, SolidColorFill } from 'yfiles'
import {
  Color,
  Enum,
  Fill,
  GraphEditorInputMode,
  GroupNodeStyle,
  GroupNodeStyleIconPosition,
  GroupNodeStyleIconType,
  GroupNodeStyleTabPosition,
  INode,
  Point,
  TimeSpan
} from 'yfiles'
import { addClass } from '../../resources/demo-app'

/**
 * Configures the given input mode to show tool tips for group nodes and folder nodes.
 * The tool tips show a description of the corresponding node style configuration.
 */
export function configureToolTips(inputMode: GraphEditorInputMode): void {
  // Customize the tool tip's behavior to our liking.
  const mouseHoverInputMode = inputMode.mouseHoverInputMode
  mouseHoverInputMode.toolTipLocationOffset = new Point(30, 30)
  mouseHoverInputMode.delay = TimeSpan.fromMilliseconds(500)
  mouseHoverInputMode.duration = TimeSpan.fromSeconds(10)

  // Register a listener for when a tool tip should be shown.
  inputMode.addQueryItemToolTipListener(
    (src: object, eventArgs: QueryItemToolTipEventArgs<IModelItem>): void => {
      if (eventArgs.handled) {
        // Tool tip content has already been assigned -> nothing to do.
        return
      }

      // Use a rich HTML element as tool tip content. Alternatively, a plain string would do as well.
      if (eventArgs.item instanceof INode && eventArgs.item.style instanceof GroupNodeStyle) {
        eventArgs.toolTip = createToolTipContent(eventArgs.item)
        // Indicate that the tool tip content has been set.
        eventArgs.handled = true
      }
    }
  )
}

/**
 * The tool tip may either be a plain string or it can also be a rich HTML element. In this case, we
 * show the latter. We just extract the first label text from the given item and show it as
 * tool tip.
 */
function createToolTipContent(node: INode): HTMLElement {
  const style = node.style as GroupNodeStyle

  const title = document.createElement('h4')
  title.innerHTML = 'GroupNodeStyle Properties'

  const grid = document.createElement('div')
  addClass(grid, 'tooltip-content')
  addToToolTipGrid(
    grid,
    'Folder Icon',
    Enum.getName(GroupNodeStyleIconType.$class, style.folderIcon)
  )
  addToToolTipGrid(grid, 'Group Icon', Enum.getName(GroupNodeStyleIconType.$class, style.groupIcon))
  addToToolTipGrid(
    grid,
    'Icon Position',
    Enum.getName(GroupNodeStyleIconPosition.$class, style.iconPosition)
  )
  addSeparator(grid)
  addToToolTipGrid(
    grid,
    'Tab Position',
    Enum.getName(GroupNodeStyleTabPosition.$class, style.tabPosition)
  )
  addToToolTipGrid(grid, 'Tab Inset', `${style.tabInset}`)
  addToToolTipGrid(grid, 'Tab Slope', `${style.tabSlope}`)
  addToToolTipGrid(grid, 'Tab Width', `${style.tabWidth}`)
  addToToolTipGrid(grid, 'Tab Height', `${style.tabHeight}`)
  addToToolTipGrid(grid, 'Tab Fill', style.tabFill)
  addToToolTipGrid(grid, 'Tab Background Fill', style.tabBackgroundFill)
  addSeparator(grid)
  addToToolTipGrid(grid, 'Content Area Fill', style.contentAreaFill)
  const insets = style.contentAreaInsets
  addToToolTipGrid(
    grid,
    'Content Area Insets',
    `[${insets.top} ${insets.right} ${insets.bottom} ${insets.left}]`
  )
  addSeparator(grid)
  addToToolTipGrid(grid, 'Corner Radius', `${style.cornerRadius}`)

  // build the tooltip container
  const toolTip = document.createElement('div')
  addClass(toolTip, 'tooltip-container')
  toolTip.appendChild(title)
  toolTip.appendChild(grid)
  return toolTip
}
/**
 * Adds a property with a given key and value to the grid div element that shows properties
 * as key-value pairs.
 */
function addToToolTipGrid(grid: HTMLDivElement, key: string, value: string | Fill | null): void {
  const keySpan = document.createElement('span')
  keySpan.innerHTML = key
  grid.appendChild(keySpan)

  const valueSpan = document.createElement('span')
  if (typeof value === 'string') {
    valueSpan.innerHTML = value
  } else if (value) {
    addClass(valueSpan, 'color')
    valueSpan.setAttribute('style', `background-color: ${fillToHexString(value)};`)
  } else {
    valueSpan.style.fontStyle = 'italic'
    valueSpan.innerHTML = 'null'
  }
  grid.appendChild(valueSpan)
}

/**
 * Returns the hexadecimal representation of the given solid color fill.
 */
function fillToHexString(fill: Fill): string {
  return colorToHexString((fill as SolidColorFill).color)
}

/**
 * Returns the hexadecimal representation of the given color.
 */
function colorToHexString(c: Color): string {
  return '#' + (toHexString(c.r) + toHexString(c.g) + toHexString(c.b)).toUpperCase()
}

/**
 * Returns the hexadecimal representation of the given number.
 * This methods assumes a value in the range [0, 255].
 */
function toHexString(value: number): string {
  return (value < 16 ? '0' : '') + value.toString(16)
}

/**
 * Adds some extra spacing below the last row in the given grid.
 */
function addSeparator(grid: HTMLDivElement): void {
  const lastValue = grid.lastElementChild as HTMLElement
  lastValue.style.marginBottom = '8px'
  const lastKey = lastValue.previousElementSibling as HTMLElement
  lastKey.style.marginBottom = '8px'
}
