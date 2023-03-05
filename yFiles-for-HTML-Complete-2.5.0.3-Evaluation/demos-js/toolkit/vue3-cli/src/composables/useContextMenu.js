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
import { onMounted, reactive, toRef, watch } from 'vue'
import { ICommand, IEdge, INode, Point, Rect } from 'yfiles'
import { BrowserDetection } from '@/utils/BrowserDetection'

export function useContextMenu(getGraphComponent) {
  // data needed in the context menu' component
  const data = reactive({
    items: [],
    location: { x: 0, y: 0 },
    display: false
  })

  let graphComponent
  let inputMode
  onMounted(() => {
    graphComponent = getGraphComponent()
    register(graphComponent.inputMode)
  })

  // close the context menu when display has been set to false
  watch(toRef(data, 'display'), value => {
    if (!value) {
      close()
    }
  })

  /**
   * Registers the context menu on the current input mode.
   */
  function register(inputMode) {
    addOpeningEventListeners(graphComponent, location => {
      const worldLocation = graphComponent.toWorldFromPage(location)
      const displayMenu = inputMode.contextMenuInputMode.shouldOpenMenu(worldLocation)
      if (displayMenu) {
        open(location)
      }
    })

    inputMode.contextMenuInputMode.addPopulateMenuListener((sender, evt) => {
      evt.showMenu = true
    })

    inputMode.addPopulateItemContextMenuListener((sender, args) => {
      if (args.item) {
        // select the item
        graphComponent.selection.clear()
        graphComponent.selection.setSelected(args.item, true)
      }
      populate(args.item)
    })

    inputMode.contextMenuInputMode.addCloseMenuListener(() => hide())
  }

  /**
   * Populates the context menu depending on the given graph item.
   */
  function populate(item) {
    function getBounds(item) {
      return item instanceof INode
        ? item.layout.toRect()
        : Rect.add(item.sourceNode.layout.toRect(), item.targetNode.layout.toRect())
    }

    const contextMenuItems = []
    if (item instanceof INode || item instanceof IEdge) {
      contextMenuItems.push({
        title: 'Zoom to item',
        action: () => {
          // center the item in the viewport
          let targetBounds = getBounds(item)
          targetBounds = targetBounds.getEnlarged(50 / graphComponent.zoom)
          ICommand.ZOOM.execute(targetBounds, graphComponent)
        }
      })
    }
    data.items = contextMenuItems
  }

  function hide() {
    data.display = false
  }

  function open(location) {
    data.display = true
    data.location = { x: location.x, y: location.y }
  }

  function close() {
    const inputMode = graphComponent.inputMode
    inputMode.contextMenuInputMode.menuClosed()
  }

  function addOpeningEventListeners(graphComponent, openingCallback) {
    const componentDiv = graphComponent.div

    const contextMenuListener = evt => {
      evt.preventDefault()
      if (data.display) {
        // might be open already because of the long press listener
        return
      }
      const me = evt
      if (evt.mozInputSource === 1 && me.button === 0) {
        // This event was triggered by the context menu key in Firefox.
        // Thus, the coordinates of the event point to the lower left corner of the element and should be corrected.
        openingCallback(getCenterInPage(componentDiv))
      } else if (me.pageX === 0 && me.pageY === 0) {
        // Most likely, this event was triggered by the context menu key in IE.
        // Thus, the coordinates are meaningless and should be corrected.
        openingCallback(getCenterInPage(componentDiv))
      } else {
        openingCallback(new Point(me.pageX, me.pageY))
      }
    }

    // Listen for the contextmenu event
    // Note: On Linux based systems (e.g. Ubuntu), the contextmenu event is fired on mouse down
    // which triggers the ContextMenuInputMode before the ClickInputMode. Therefore handling the
    // event, will prevent the ItemRightClicked event from firing.
    // For more information, see https://docs.yworks.com/yfileshtml/#/kb/article/780/
    componentDiv.addEventListener('contextmenu', contextMenuListener, false)

    if (BrowserDetection.safariVersion > 0 || BrowserDetection.iOSVersion > 0) {
      // Additionally add a long press listener especially for iOS, since it does not fire the contextmenu event.
      let contextMenuTimer
      graphComponent.addTouchDownListener((sender, args) => {
        contextMenuTimer = setTimeout(() => {
          openingCallback(
            graphComponent.toPageFromView(graphComponent.toViewCoordinates(args.location))
          )
        }, 500)
      })

      graphComponent.addTouchUpListener(() => {
        clearTimeout(contextMenuTimer)
      })
    }

    // Listen to the context menu key to make it work in Chrome
    componentDiv.addEventListener('keyup', evt => {
      if (evt.key === 'ContextMenu') {
        evt.preventDefault()
        openingCallback(getCenterInPage(componentDiv))
      }
    })
  }

  function getCenterInPage(element) {
    let left = element.clientWidth / 2.0
    let top = element.clientHeight / 2.0
    while (element.offsetParent) {
      left += element.offsetLeft
      top += element.offsetTop
      element = element.offsetParent
    }
    return new Point(left, top)
  }

  return {
    data,
    register,
    hide
  }
}
