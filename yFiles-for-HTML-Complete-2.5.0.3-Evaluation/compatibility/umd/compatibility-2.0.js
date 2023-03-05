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
      if (yfiles.view) {
        if (yfiles.view.VisualCachingPolicy && !yfiles.view.VisualCachingPolicy.STRONG) {
          yfiles.view.VisualCachingPolicy.STRONG = yfiles.view.VisualCachingPolicy.ALWAYS
        }
        if (yfiles.view.VisualCachingPolicy && !yfiles.view.VisualCachingPolicy.WEAK) {
          yfiles.view.VisualCachingPolicy.WEAK = yfiles.view.VisualCachingPolicy.ALWAYS
        }
        if (
          yfiles.view.NodeStyleDecorationInstaller &&
          !yfiles.view.NodeStyleDecorationInstaller.prototype.margin
        ) {
          Object.defineProperty(yfiles.view.NodeStyleDecorationInstaller.prototype, 'margin', {
            get: function () {
              return this.margins
            },
            set: function (insets) {
              this.margins = insets
            }
          })
        }
        if (
          yfiles.view.LabelStyleDecorationInstaller &&
          !yfiles.view.LabelStyleDecorationInstaller.prototype.margin
        ) {
          Object.defineProperty(yfiles.view.LabelStyleDecorationInstaller.prototype, 'margin', {
            get: function () {
              return this.margins
            },
            set: function (insets) {
              this.margins = insets
            }
          })
        }
        if (yfiles.view.SvgExport && !yfiles.view.SvgExport.prototype.margin) {
          Object.defineProperty(yfiles.view.SvgExport.prototype, 'margin', {
            get: function () {
              return this.margins
            },
            set: function (insets) {
              this.margins = insets
            }
          })
        }
      }

      if (yfiles.styles) {
        if (
          yfiles.styles.IconLabelStyleRenderer &&
          !yfiles.styles.IconLabelStyleRenderer.prototype.getInnerStyleInsets
        ) {
          yfiles.styles.IconLabelStyleRenderer.prototype.getInnerStyleInsets =
            yfiles.styles.IconLabelStyleRenderer.prototype.getWrappedStyleInsets
        }
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
