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
  FreeNodePortLocationModel,
  IEnumerable,
  IHandle,
  IInputModeContext,
  INode,
  IPoint,
  IPort,
  IPortLocationModelParameter,
  IPositionHandler,
  Point
} from 'yfiles'

/**
 * An {@link IPositionHandler} which lets the user change the order of rows by dragging on them.
 * It uses the port's {@link IHandle}s to keep the adjacent edges orthogonal.
 */
export class RowPositionHandler extends BaseClass(IPositionHandler) {
  /**
   * @param {!INode} node
   * @param {number} index
   */
  constructor(node, index) {
    super()
    this.index = index
    this.node = node
    this.currentIndex = -1
    this.originalState = []
    this.portHandle = new Map()
  }

  /**
   * The drag has been canceled: restore the original state and clean up.
   * @param {!IInputModeContext} context
   * @param {!Point} originalLocation
   */
  cancelDrag(context, originalLocation) {
    const nodeInfo = this.node.tag
    for (let i = 0; i < this.originalState.length; i++) {
      const handle = this.originalState[i].handle
      handle.cancelDrag(context, this.originalState[i].originalHandleLocation)
      nodeInfo.rows[i] = this.originalState[i].info
    }
    nodeInfo.draggingIndex = null
  }

  /**
   * The drag has been successfully finished.
   * Update the locations and clean up.
   * @param {!IInputModeContext} context
   * @param {!Point} originalLocation
   * @param {!Point} newLocation
   */
  dragFinished(context, originalLocation, newLocation) {
    const nodeInfo = this.node.tag
    this.handleMove(context, originalLocation, newLocation)

    const nodeLocationY = this.node.layout.y
    for (let i = 0; i < this.originalState.length; i++) {
      const portMoveInfo = this.originalState[i]
      const ports = getPortForData(this.node, portMoveInfo.info)
      ports.forEach(port => {
        const portLocation = port.location
        portMoveInfo.handle.dragFinished(context, portMoveInfo.originalHandleLocation, portLocation)
        // Moving ports through their handle might result in port location parameters whose anchor
        // points are no longer the top left or top right corner of the respective owner node
        // if this is the case, resizing the owner node might move the ports.
        // To prevent this from happening, the handle generated location parameters are replaced with
        // parameters that once again are anchored at the owner node's top left or top right corner.
        const incoming = port.tag.incoming
        if (incoming) {
          context.graph.setPortLocationParameter(
            port,
            new FreeNodePortLocationModel().createParameterForRatios(
              [0, 0],
              [0, portLocation.y - nodeLocationY]
            )
          )
        }

        if (!incoming) {
          context.graph.setPortLocationParameter(
            port,
            new FreeNodePortLocationModel().createParameterForRatios(
              [1, 0],
              [0, portLocation.y - nodeLocationY]
            )
          )
        }
      })
    }
    nodeInfo.draggingIndex = null
  }

  /**
   * Called during drag: update the locations.
   * @param {!IInputModeContext} context
   * @param {!Point} originalLocation
   * @param {!Point} newLocation
   */
  handleMove(context, originalLocation, newLocation) {
    const style = this.node.style
    const newIndex = this.getRowIndex(style, newLocation.y)
    if (newIndex < 0 || newIndex >= this.node.tag.rows.length || newIndex == this.currentIndex) {
      return
    }

    const nodeInfo = this.node.tag
    const rowInfo = nodeInfo.rows[this.currentIndex]
    const ports = getPortForData(this.node, rowInfo)
    const otherInfo = nodeInfo.rows[newIndex]
    const otherPorts = getPortForData(this.node, otherInfo)

    nodeInfo.rows[this.currentIndex] = otherInfo
    nodeInfo.rows[newIndex] = rowInfo

    ports.forEach(port => {
      const newMoveInfo = this.portHandle.get(port)
      newMoveInfo.handle.handleMove(
        context,
        newMoveInfo.originalHandleLocation,
        new Point(
          newMoveInfo.originalHandleLocation.x,
          this.node.layout.y + style.getRowCenterY(newIndex)
        )
      )
    })
    otherPorts.forEach(port => {
      const otherMoveInfo = this.portHandle.get(port)
      otherMoveInfo.handle.handleMove(
        context,
        otherMoveInfo.originalHandleLocation,
        new Point(
          otherMoveInfo.originalHandleLocation.x,
          this.node.layout.y + style.getRowCenterY(this.currentIndex)
        )
      )
    })
    this.currentIndex = newIndex
    nodeInfo.draggingIndex = newIndex
  }

  /**
   * Called when the drag gesture is started.
   *
   * Collect all current states and get the port's handles
   * and call initializeDrag for each of them.
   * @param {!IInputModeContext} context
   */
  initializeDrag(context) {
    const nodeInfo = this.node.tag
    this.currentIndex = this.index
    // store the current index in node tag so we can highlight it visually in the node style
    nodeInfo.draggingIndex = this.currentIndex
    this.originalState = []
    this.portHandle = new Map()
    // we initialize all ports since we don't know which one will be moved
    // besides the one at the current row
    for (const p of nodeInfo.rows) {
      const ports = getPortForData(this.node, p)
      ports.forEach(port => {
        const handle = port.lookup(IHandle.$class)
        const info = {
          info: p,
          parameter: port.locationParameter,
          handle: handle,
          originalHandleLocation: port.location
        }
        this.originalState.push(info)
        handle.initializeDrag(context)
        this.portHandle.set(port, info)
      })
    }
  }

  /**
   * @type {!IPoint}
   */
  get location() {
    return Point.ORIGIN
  }

  /**
   * Determines the index of the row that contains the given y-coordinate.
   * @param {!ListNodeStyle} style the style to query.
   * @param {number} y the y-coordinate to check.
   * @returns {number} the index of the row that contains the given y-coordinate or `-1` if there
   * is no such row.
   */
  getRowIndex(style, y) {
    const nl = this.node.layout
    return style.getRowIndex(this.node, new Point(nl.x + nl.width * 0.5, y))
  }
}

/**
 * Returns the port for the row identified by the given row information.
 * @param {!INode} node the node whose is queried for a port.
 * @param {!RowInfo} rowInfo the row information that identifies the row whose port is returned.
 * @returns {!IEnumerable.<IPort>}
 */
export function getPortForData(node, rowInfo) {
  return node.ports.filter(p => p.tag.rowInfo === rowInfo)
}

/**
 * Creates a port location parameter for the row with the given index that is anchored at the
 * owner nodes top left or top right corner.
 * @param {number} rowIndex the index of the row to which the port belongs.
 * @param {boolean} incoming if `true` the port will be anchored that the owner node's top left
 * corner; otherwise it will be anchored at the top right corner.
 * @param {!ListNodeStyle} style the owner node's node style.
 */
export function createPortLocationParameter(rowIndex, incoming, style) {
  return new FreeNodePortLocationModel().createParameterForRatios(
    [incoming ? 0 : 1, 0],
    [0, style.getRowCenterY(rowIndex)]
  )
}

/**
 * @typedef {Object} RowMoveInfo
 * @property {RowInfo} info
 * @property {IPortLocationModelParameter} parameter
 * @property {IHandle} handle
 * @property {Point} originalHandleLocation
 */
