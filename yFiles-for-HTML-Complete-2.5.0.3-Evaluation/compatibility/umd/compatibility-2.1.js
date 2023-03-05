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
 * This file provides compatibility for user code written for yFiles for HTML 2.1
 * with the library of yFiles for HTML 2.2.
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
    yfiles.enable_2_1_compatibility = function () {
      if (yfiles.layout) {
        if (
          yfiles.layout.LayoutExecutor &&
          !yfiles.layout.LayoutExecutor.prototype.improvePortAssignment
        ) {
          Object.defineProperty(yfiles.layout.LayoutExecutor.prototype, 'improvePortAssignment', {
            get: function () {
              return this.portAdjustmentPolicy !== yfiles.layout.PortAdjustmentPolicy.NEVER
            },
            set: function (value) {
              this.portAdjustmentPolicy = value
                ? yfiles.layout.PortAdjustmentPolicy.LENGTHEN
                : yfiles.layout.PortAdjustmentPolicy.NEVER
            }
          })
        }
        if (
          yfiles.layout.LayoutGraphAdapter &&
          !yfiles.layout.LayoutGraphAdapter.prototype.improvePortAssignment
        ) {
          Object.defineProperty(
            yfiles.layout.LayoutGraphAdapter.prototype,
            'improvePortAssignment',
            {
              get: function () {
                return this.portAdjustmentPolicy !== yfiles.layout.PortAdjustmentPolicy.NEVER
              },
              set: function (value) {
                this.portAdjustmentPolicy = value
                  ? yfiles.layout.PortAdjustmentPolicy.LENGTHEN
                  : yfiles.layout.PortAdjustmentPolicy.NEVER
              }
            }
          )
        }
        defineProperty(yfiles.layout.FixNodeLayoutData, 'fixedNode', 'fixedNodes')
      }

      if (yfiles.hierarchic) {
        defineProperty(
          yfiles.hierarchic.HierarchicLayoutData,
          'alternativeEdgePath',
          'alternativeEdgePaths'
        )
      }

      if (yfiles.tree) {
        defineProperty(
          yfiles.tree.TreeLayoutData,
          'leftRightPlacersLeftNodes',
          'leftRightNodePlacerLeftNodes'
        )
        defineProperty(
          yfiles.tree.TreeLayoutData,
          'leftRightPlacersLeftNodes',
          'leftRightNodePlacerLeftNodes'
        )
      }

      if (yfiles.view) {
        if (
          yfiles.view.GraphOverviewComponent &&
          !yfiles.view.GraphOverviewComponent.prototype.svgRendering
        ) {
          Object.defineProperty(yfiles.view.GraphOverviewComponent.prototype, 'svgRendering', {
            get: function () {
              return this.renderMode === yfiles.view.RenderModes.SVG
            },
            set: function (value) {
              this.renderMode = value ? yfiles.view.RenderModes.SVG : yfiles.view.RenderModes.CANVAS
            }
          })
        }
      }

      if (yfiles.graph) {
        if (yfiles.graph.DefaultGraph && !yfiles.graph.DefaultGraph.getPortLabels) {
          defineMethod(yfiles.graph.DefaultGraph, 'getPortLabels', function () {
            return this.portLabels
          })
        }
        if (yfiles.graph.GraphWrapperBase && !yfiles.graph.GraphWrapperBase.getPortLabels) {
          defineMethod(yfiles.graph.GraphWrapperBase, 'getPortLabels', function () {
            return this.portLabels
          })
        }
        if (yfiles.graph.Table) {
          if (!yfiles.graph.Table.getAccumulatedInsets) {
            defineMethod(yfiles.graph.Table, 'getAccumulatedInsets', function () {
              return this.accumulatedInsets
            })
          }
          if (!yfiles.graph.Table.getDecorator) {
            defineMethod(yfiles.graph.Table, 'getDecorator', function () {
              return this.decorator
            })
          }
        }
      }

      if (yfiles.algorithms) {
        if (!yfiles.algorithms.BfsDirection) {
          yfiles.algorithms.BfsDirection = yfiles.algorithms.TraversalDirection
        }
      }
    }

    yfiles.enable_2_1_compatibility_wrap_require = function () {
      yfiles.enable_2_1_compatibility()
      if (window.require) {
        var wrappedRequire = window.require
        window.require = function (a, f) {
          yfiles.enable_2_1_compatibility()
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
