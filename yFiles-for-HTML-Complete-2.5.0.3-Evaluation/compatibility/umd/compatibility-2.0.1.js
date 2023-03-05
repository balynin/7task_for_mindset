/****************************************************************************
 ** @license
 ** This file is part of yFiles for HTML 2.5.0.3.
 **
 ** yWorks proprietary/confidential. Use is subject to license terms.
 **
 ** Copyright (c) 2023 by yWorks GmbH, Vor dem Kreuzberg 28,
 ** 72070 Tuebingen, Germany. All rights reserved.
 **
 ***************************************************************************/
/****************************************************************************
 *
 * This file provides compatibility for user code written for yFiles for HTML 2.0
 * with the library of yFiles for HTML 2.0.1.
 *
 ***************************************************************************/

'use strict'
;(function (r) {
  ;(function (f) {
    if (typeof define === 'function' && define.amd) {
      define(['yfiles/lang'], function (lang) {
        f(lang.yfiles)
      })
    } else {
      f(r.yfiles || (r.yfiles = {}))
    }
  })(function (yfiles) {
    yfiles.enable_2_0_compatibility = function () {
      if (yfiles.input) {
        defineStaticMember(
          yfiles.input.KeyEventRecognizers,
          'DELETE_PRESSED',
          yfiles.input.KeyEventRecognizers.DELETE_DOWN
        )
        defineStaticMember(
          yfiles.input.KeyEventRecognizers,
          'ESCAPE_PRESSED',
          yfiles.input.KeyEventRecognizers.ESCAPE_DOWN
        )
        defineStaticMember(
          yfiles.input.KeyEventRecognizers,
          'ESCAPE_TYPED',
          yfiles.input.KeyEventRecognizers.ESCAPE_PRESS
        )
        defineStaticMember(
          yfiles.input.KeyEventRecognizers,
          'ESCAPE_RELEASED',
          yfiles.input.KeyEventRecognizers.ESCAPE_UP
        )
        defineStaticMember(
          yfiles.input.KeyEventRecognizers,
          'KEY_PRESSED',
          yfiles.input.KeyEventRecognizers.KEY_DOWN
        )
        defineStaticMember(
          yfiles.input.KeyEventRecognizers,
          'KEY_TYPED',
          yfiles.input.KeyEventRecognizers.KEY_PRESS
        )
        defineStaticMember(
          yfiles.input.KeyEventRecognizers,
          'KEY_RELEASED',
          yfiles.input.KeyEventRecognizers.KEY_UP
        )
        defineStaticMember(
          yfiles.input.KeyEventRecognizers,
          'ALT_PRESSED',
          yfiles.input.KeyEventRecognizers.ALT_IS_DOWN
        )
        defineStaticMember(
          yfiles.input.KeyEventRecognizers,
          'CONTROL_PRESSED',
          yfiles.input.KeyEventRecognizers.CTRL_IS_DOWN
        )
        defineStaticMember(
          yfiles.input.KeyEventRecognizers,
          'SHIFT_PRESSED',
          yfiles.input.KeyEventRecognizers.SHIFT_IS_DOWN
        )
        defineStaticMember(
          yfiles.input.KeyEventRecognizers,
          'META_PRESSED',
          yfiles.input.KeyEventRecognizers.META_IS_DOWN
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'LEFT_PRESSED',
          yfiles.input.MouseEventRecognizers.LEFT_DOWN
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'RIGHT_PRESSED',
          yfiles.input.MouseEventRecognizers.RIGHT_DOWN
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'PRESSED',
          yfiles.input.MouseEventRecognizers.DOWN
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'LEFT_RELEASED',
          yfiles.input.MouseEventRecognizers.LEFT_UP
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'RIGHT_RELEASED',
          yfiles.input.MouseEventRecognizers.RIGHT_UP
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'RELEASED',
          yfiles.input.MouseEventRecognizers.UP
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'CLICKED',
          yfiles.input.MouseEventRecognizers.CLICK
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'DRAGGED',
          yfiles.input.MouseEventRecognizers.DRAG
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'ENTERED',
          yfiles.input.MouseEventRecognizers.ENTER
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'EXITED',
          yfiles.input.MouseEventRecognizers.LEAVE
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'LEFT_CLICKED',
          yfiles.input.MouseEventRecognizers.LEFT_CLICK
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'LEFT_DOUBLE_CLICKED',
          yfiles.input.MouseEventRecognizers.LEFT_DOUBLE_CLICK
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'LEFT_DRAGGED',
          yfiles.input.MouseEventRecognizers.LEFT_DRAG
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'MIDDLE_CLICKED',
          yfiles.input.MouseEventRecognizers.MIDDLE_CLICK
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'MIDDLE_DOUBLE_CLICKED',
          yfiles.input.MouseEventRecognizers.MIDDLE_DOUBLE_CLICK
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'MIDDLE_DRAGGED',
          yfiles.input.MouseEventRecognizers.MIDDLE_DRAG
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'MOVED',
          yfiles.input.MouseEventRecognizers.MOVE
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'MOVED_OR_DRAGGED',
          yfiles.input.MouseEventRecognizers.MOVE_OR_DRAG
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'MULTI_CLICKED',
          yfiles.input.MouseEventRecognizers.MULTI_CLICK
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'RIGHT_CLICKED',
          yfiles.input.MouseEventRecognizers.RIGHT_CLICK
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'RIGHT_DOUBLE_CLICKED',
          yfiles.input.MouseEventRecognizers.RIGHT_DOUBLE_CLICK
        )
        defineStaticMember(
          yfiles.input.MouseEventRecognizers,
          'RIGHT_DRAGGED',
          yfiles.input.MouseEventRecognizers.RIGHT_DRAG
        )
        defineStaticMember(
          yfiles.input.TouchEventRecognizers,
          'TOUCH_DOUBLE_TAPPED_PRIMARY',
          yfiles.input.TouchEventRecognizers.TOUCH_DOUBLE_TAP_PRIMARY
        )
        defineStaticMember(
          yfiles.input.TouchEventRecognizers,
          'TOUCH_DOUBLE_TAPPED_SECONDARY',
          yfiles.input.TouchEventRecognizers.TOUCH_DOUBLE_TAP_SECONDARY
        )
        defineStaticMember(
          yfiles.input.TouchEventRecognizers,
          'TOUCH_ENTERED_PRIMARY',
          yfiles.input.TouchEventRecognizers.TOUCH_ENTER_PRIMARY
        )
        defineStaticMember(
          yfiles.input.TouchEventRecognizers,
          'TOUCH_ENTERED_SECONDARY',
          yfiles.input.TouchEventRecognizers.TOUCH_ENTER_SECONDARY
        )
        defineStaticMember(
          yfiles.input.TouchEventRecognizers,
          'TOUCH_EXITED_PRIMARY',
          yfiles.input.TouchEventRecognizers.TOUCH_LEAVE_PRIMARY
        )
        defineStaticMember(
          yfiles.input.TouchEventRecognizers,
          'TOUCH_EXITED_SECONDARY',
          yfiles.input.TouchEventRecognizers.TOUCH_LEAVE_SECONDARY
        )
        defineStaticMember(
          yfiles.input.TouchEventRecognizers,
          'TOUCH_LONG_PRESSED_PRIMARY',
          yfiles.input.TouchEventRecognizers.TOUCH_LONG_PRESS_PRIMARY
        )
        defineStaticMember(
          yfiles.input.TouchEventRecognizers,
          'TOUCH_LONG_PRESSED_SECONDARY',
          yfiles.input.TouchEventRecognizers.TOUCH_LONG_PRESS_SECONDARY
        )
        defineStaticMember(
          yfiles.input.TouchEventRecognizers,
          'TOUCH_MOVED_PRIMARY',
          yfiles.input.TouchEventRecognizers.TOUCH_MOVE_PRIMARY
        )
        defineStaticMember(
          yfiles.input.TouchEventRecognizers,
          'TOUCH_MOVED_SECONDARY',
          yfiles.input.TouchEventRecognizers.TOUCH_MOVE_SECONDARY
        )
        defineStaticMember(
          yfiles.input.TouchEventRecognizers,
          'TOUCH_MULTI_TAPPED_PRIMARY',
          yfiles.input.TouchEventRecognizers.TOUCH_MULTI_TAP_PRIMARY
        )
        defineStaticMember(
          yfiles.input.TouchEventRecognizers,
          'TOUCH_MULTI_TAPPED_SECONDARY',
          yfiles.input.TouchEventRecognizers.TOUCH_MULTI_TAP_SECONDARY
        )
        defineStaticMember(
          yfiles.input.TouchEventRecognizers,
          'TOUCH_TAPPED_PRIMARY',
          yfiles.input.TouchEventRecognizers.TOUCH_TAP_PRIMARY
        )
        defineStaticMember(
          yfiles.input.TouchEventRecognizers,
          'TOUCH_TAPPED_SECONDARY',
          yfiles.input.TouchEventRecognizers.TOUCH_TAP_SECONDARY
        )

        defineMethod(
          yfiles.input.ItemDropInputMode,
          'cleanup',
          yfiles.input.ItemDropInputMode.prototype.cleanUp
        )
        defineMethod(
          yfiles.input.ItemDropInputMode,
          'cleanupPreview',
          yfiles.input.ItemDropInputMode.prototype.cleanUpPreview
        )
        defineMethod(
          yfiles.input.ItemDropInputMode,
          'cleanupDropTarget',
          yfiles.input.ItemDropInputMode.prototype.cleanUpDropTarget
        )
        defineMethod(
          yfiles.input.ItemDropInputMode,
          'cleanupSnapContext',
          yfiles.input.ItemDropInputMode.prototype.cleanUpSnapContext
        )
        defineMethod(
          yfiles.input.OrthogonalEdgeEditingContext,
          'cleanupEdgePaths',
          yfiles.input.OrthogonalEdgeEditingContext.prototype.cleanUpEdgePaths
        )
      }

      if (yfiles.graph) {
        defineProperty(yfiles.graph.IPortDefaults, 'autoCleanup', 'autoCleanUp')
        defineProperty(yfiles.graph.PortDefaults, 'autoCleanup', 'autoCleanUp')
      }

      if (yfiles.view) {
        defineStaticMember(yfiles.view.KeyEventType, 'PRESSED', yfiles.view.KeyEventType.DOWN)
        defineStaticMember(yfiles.view.KeyEventType, 'TYPED', yfiles.view.KeyEventType.PRESS)
        defineStaticMember(yfiles.view.KeyEventType, 'RELEASED', yfiles.view.KeyEventType.UP)

        defineMethod(
          yfiles.view.CanvasComponent,
          'globalToLocal',
          yfiles.view.CanvasComponent.prototype.toViewFromPage
        )
        defineMethod(
          yfiles.view.CanvasComponent,
          'localToGlobal',
          yfiles.view.CanvasComponent.prototype.toPageFromView
        )
        defineProperty(yfiles.view.CanvasComponent, 'mouseCaptureEnabled', 'mouseCapture')

        defineMethod(yfiles.view.Animator, 'destroy', yfiles.view.Animator.prototype.stop)
        defineMethod(yfiles.view.IAnimation, 'cleanup', yfiles.view.IAnimation.prototype.cleanUp)
        defineMethod(
          yfiles.view.ViewportAnimation,
          'cleanup',
          yfiles.view.ViewportAnimation.prototype.cleanUp
        )
        defineMethod(
          yfiles.view.TableAnimation,
          'cleanup',
          yfiles.view.TableAnimation.prototype.cleanUp
        )

        defineStaticMember(
          yfiles.view.ShowFocusPolicy,
          'WHEN_FOCUSED',
          yfiles.view.ShowFocusPolicy.ONLY_WHEN_FOCUSED
        )

        defineMethod(yfiles.view.SvgExport, 'getClip', yfiles.view.SvgExport.prototype.createClip)
        defineMethod(
          yfiles.view.SvgDefsManager,
          'cleanupDefs',
          yfiles.view.SvgDefsManager.prototype.cleanUpDefs
        )
        defineMethod(
          yfiles.view.SvgDefsManager,
          'cleanupTimerInterval',
          yfiles.view.SvgDefsManager.prototype.cleanUpTimerInterval
        )
      }

      if (yfiles.layout) {
        defineStaticMember(
          yfiles.layout.LayoutGraphAdapter,
          'applyLayout',
          function (graph, layout, layoutData) {
            graph.applyLayout(layout, layoutData)
          }
        )

        defineProperty(
          yfiles.layout.DiscreteEdgeLabelLayoutModel,
          'autoRotationEnabled',
          'autoRotation'
        )
        defineProperty(yfiles.layout.EdgePathLabelModel, 'autoRotationEnabled', 'autoRotation')
        defineProperty(yfiles.layout.EdgeSegmentLabelModel, 'autoRotationEnabled', 'autoRotation')
        defineProperty(
          yfiles.layout.SliderEdgeLabelLayoutModel,
          'autoRotationEnabled',
          'autoRotation'
        )
        defineProperty(yfiles.layout.LabelLayoutTranslator, 'autoFlippingEnabled', 'autoFlipping')

        defineProperty(yfiles.layout.SingleCycleLayout, 'fromSketchModeEnabled', 'fromSketchMode')
      }

      if (yfiles.router) {
        defineMethod(
          yfiles.router.ChannelBasedPathRouting,
          'cleanup',
          yfiles.router.ChannelBasedPathRouting.prototype.cleanUp
        )
        defineMethod(
          yfiles.router.IGraphPartitionExtension,
          'cleanup',
          yfiles.router.IGraphPartitionExtension.prototype.cleanUp
        )
        defineMethod(
          yfiles.router.GraphPartitionExtensionAdapter,
          'cleanup',
          yfiles.router.GraphPartitionExtensionAdapter.prototype.cleanUp
        )
      }
    }

    yfiles.enable_2_0_compatibility_wrap_require = function () {
      yfiles.enable_2_0_compatibility()
      if (window.require) {
        var wrappedRequire = window.require
        window.require = function (a, f) {
          yfiles.enable_2_0_compatibility()
          wrappedRequire(a, f)
        }
        var p
        for (p in wrappedRequire) {
          window.require[p] = wrappedRequire[p]
        }
      }
      return window.require
    }

    /**
     * Defines a new static member on the given type.
     * @param {object} type The type.
     * @param {string} name The name of the new member.
     * @param {function|object} value A function or object that is set to the new member.
     */
    function defineStaticMember(type, name, value) {
      if (type && !type[name]) {
        type[name] = value
      }
    }

    /**
     * Defines a new instance method on the given type.
     * @param {object} type The type.
     * @param {string} name The name of the new member.
     * @param {function} func The function for the new method.
     */
    function defineMethod(type, name, func) {
      if (type && !type[name]) {
        type.prototype[name] = func
      }
    }

    /**
     * Defines a new instance property on the given type.
     * @param {object} type The type.
     * @param {string} name The name of the new member.
     * @param {string} existingName The name of an existing property that the new property duplicates.
     */
    function defineProperty(type, name, existingName) {
      if (type && !type.prototype[name]) {
        Object.defineProperty(type.prototype, name, {
          get: function () {
            return this[existingName]
          },
          set: function (value) {
            this[existingName] = value
          }
        })
      }
    }
  })
})(
  typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined'
    ? global
    : typeof self !== 'undefined'
    ? self
    : this
)
