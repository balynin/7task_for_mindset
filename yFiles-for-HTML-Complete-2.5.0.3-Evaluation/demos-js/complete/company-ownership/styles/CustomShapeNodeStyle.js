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
  DashStyle,
  Fill,
  GeneralPath,
  GeneralPathNodeStyle,
  INode,
  IRenderContext,
  NodeStyleBase,
  Point,
  Rect,
  Stroke,
  Visual
} from 'yfiles'
import { NodeTypeEnum } from '../DemoTypes.js'

/**
 * A node style implementation that creates shapes based on the type of a given node by delegating to GeneralPathNodeStyle.
 */
export class CustomShapeNodeStyle extends NodeStyleBase {
  /**
   * Creates the custom style for the given type of node.
   * @param {!NodeTypeEnum} [type]
   * @param {!FillConvertible} [stroke]
   * @param {!FillConvertible} [fill]
   */
  constructor(type, stroke, fill) {
    super()
    this.$type = type ?? NodeTypeEnum.CORPORATION
    this.$stroke = stroke ? new Stroke(stroke, 2) : Stroke.BLACK
    this.$fill = fill ? Fill.from(fill) : Fill.WHITE

    let gp
    this.$gpNodeStyle = new GeneralPathNodeStyle()
    this.$gpNodeStyle.stroke = this.$stroke
    this.$gpNodeStyle.fill = this.$fill

    switch (type) {
      case NodeTypeEnum.CORPORATION:
        gp = createCorporationPath()
        break
      case NodeTypeEnum.CTB:
        gp = createCtbPath()
        break
      case NodeTypeEnum.PARTNERSHIP:
        gp = createPartnershipPath()
        break
      case NodeTypeEnum.RCTB:
        gp = createRctbPath()
        break
      case NodeTypeEnum.BRANCH:
      case NodeTypeEnum.INDIVIDUAL:
        gp = createBranchPath()
        break
      case NodeTypeEnum.DISREGARDED:
        gp = createDisregardedPath()
        break
      case NodeTypeEnum.DUAL_RESIDENT:
        gp = createDualResidentPath()
        break
      case NodeTypeEnum.MULTIPLE:
        gp = createMultiplePath()
        break
      case NodeTypeEnum.TRUST:
        gp = createTrustPath()
        break
      case NodeTypeEnum.THIRD_PARTY:
        gp = createThirdPartyPath()
        break
      case NodeTypeEnum.TRAPEZOID:
        gp = createTrapezoidPath()
        break
      case NodeTypeEnum.PE_RISK:
        this.$gpNodeStyle.stroke = new Stroke({
          fill: this.stroke.fill,
          dashStyle: DashStyle.DASH,
          lineCap: 'square',
          thickness: 2
        })
        this.$gpNodeStyle.stroke.freeze()
        gp = createPeRiskPath()
        break
      default:
        throw new Error('Unknown Type')
    }

    this.$gpNodeStyle.path = gp
  }

  /**
   * Gets/sets the node type.
   * @type {!NodeTypeEnum}
   */
  get type() {
    return this.$type
  }

  /**
   * @type {!NodeTypeEnum}
   */
  set type(value) {
    this.$type = value
  }

  /**
   * Gets/sets the stroke to be used.
   * @type {!Stroke}
   */
  get stroke() {
    return this.$stroke
  }

  /**
   * @type {!Stroke}
   */
  set stroke(value) {
    this.$stroke = value
  }

  /**
   * Gets/sets the fill to be used.
   * @type {!Fill}
   */
  get fill() {
    return this.$fill
  }

  /**
   * @type {!Fill}
   */
  set fill(value) {
    this.$fill = value
  }

  /**
   * Creates the visual for the given node.
   * @param {!IRenderContext} renderContext The render context
   * @param {!INode} node The node to which this style is assigned
   * @see Overrides {@link NodeStyleBase.createVisual}
   * @returns {?Visual}
   */
  createVisual(renderContext, node) {
    return this.$gpNodeStyle.renderer
      .getVisualCreator(node, this.$gpNodeStyle)
      .createVisual(renderContext)
  }

  /**
   * Updates the visual for the given node.
   * @param {!IRenderContext} renderContext The render context
   * @param {!Visual} oldVisual The visual that has been created in the call to createVisual
   * @param {!INode} node The node to which this style is assigned
   * @returns {?Visual}
   */
  updateVisual(renderContext, oldVisual, node) {
    return this.$gpNodeStyle.renderer
      .getVisualCreator(node, this.$gpNodeStyle)
      .updateVisual(renderContext, oldVisual)
  }

  /**
   * Gets the outline of the visual style.
   * @param {!INode} node The node to which this style is assigned
   * @returns {?GeneralPath}
   */
  getOutline(node) {
    switch (this.$type) {
      case NodeTypeEnum.PARTNERSHIP:
      case NodeTypeEnum.BRANCH:
      case NodeTypeEnum.MULTIPLE:
      case NodeTypeEnum.TRUST:
      case NodeTypeEnum.INDIVIDUAL:
      case NodeTypeEnum.THIRD_PARTY:
      case NodeTypeEnum.PE_RISK:
        return this.$gpNodeStyle.renderer.getShapeGeometry(node, this.$gpNodeStyle).getOutline()
      default:
        return null
    }
  }
}

/**
 * Creates the path for nodes of type "partnership".
 * @returns {!GeneralPath} The general path the describes this style
 */
function createPartnershipPath() {
  const gp = new GeneralPath()
  gp.moveTo(0, 1)
  gp.lineTo(0.5, 0)
  gp.lineTo(1, 1)
  gp.close()
  return gp
}

/**
 * Creates the path for nodes of type "RCTB".
 * @returns {!GeneralPath} The general path the describes this style
 */
function createRctbPath() {
  const gp = new GeneralPath()
  gp.moveTo(0, 0)
  gp.lineTo(1, 0)
  gp.lineTo(1, 1)
  gp.lineTo(0, 1)
  gp.close()
  gp.moveTo(1, 0)
  gp.lineTo(0.5, 1)
  gp.lineTo(0, 0)
  return gp
}

/**
 * Creates the path for nodes of type "Trapezoid".
 * @returns {!GeneralPath} The general path the describes this style
 */
function createTrapezoidPath() {
  const gp = new GeneralPath()
  gp.moveTo(0, 0)
  gp.lineTo(1, 0)
  gp.lineTo(1, 1)
  gp.lineTo(0, 1)
  gp.close()
  gp.moveTo(0.2, 0)
  gp.lineTo(0.8, 0)
  gp.lineTo(1, 1)
  gp.lineTo(0, 1)
  gp.lineTo(0.2, 0)
  return gp
}

/**
 * Creates the path for nodes of type "Branch".
 * @returns {!GeneralPath} The general path the describes this style
 */
function createBranchPath() {
  const gp = new GeneralPath()
  gp.appendEllipse(new Rect(0, 0, 1, 1), false)
  return gp
}

/**
 * Creates the path for nodes of type "Disregarded".
 * @returns {!GeneralPath} The general path the describes this style
 */
function createDisregardedPath() {
  const gp = new GeneralPath()
  gp.moveTo(0, 0)
  gp.lineTo(1, 0)
  gp.lineTo(1, 1)
  gp.lineTo(0, 1)
  gp.close()
  gp.appendEllipse(new Rect(0, 0, 1, 1), false)
  return gp
}

/**
 * Creates the path for nodes of type "Dual_Resident".
 * @returns {!GeneralPath} The general path the describes this style
 */
function createDualResidentPath() {
  const gp = new GeneralPath()
  gp.moveTo(0, 0)
  gp.lineTo(1, 0)
  gp.lineTo(1, 1)
  gp.lineTo(0, 1)
  gp.close()
  gp.moveTo(0, 1)
  gp.lineTo(1, 0)
  return gp
}

/**
 * Creates the path for nodes of type "Multiple_Path".
 * @returns {!GeneralPath} The general path the describes this style
 */
function createMultiplePath() {
  const gp = new GeneralPath()
  gp.moveTo(0, 0)
  gp.lineTo(0.9, 0)
  gp.lineTo(0.9, 0.9)
  gp.lineTo(0, 0.9)
  gp.close()
  gp.moveTo(0.9, 0.1)
  gp.lineTo(1, 0.1)
  gp.lineTo(1, 1)
  gp.lineTo(0.1, 1)
  gp.lineTo(0.1, 0.9)
  gp.lineTo(0.9, 0.9)
  gp.close()
  return gp
}

/**
 * Creates the path for nodes of type "Trust".
 * @returns {!GeneralPath} The general path the describes this style
 */
function createTrustPath() {
  const gp = new GeneralPath()
  gp.moveTo(0, 0.5)
  gp.lineTo(0.5, 0)
  gp.lineTo(1, 0.5)
  gp.lineTo(0.5, 1)
  gp.close()
  return gp
}

/**
 * Creates the path for nodes of type "PE_Risk".
 * @returns {!GeneralPath} The general path the describes this style
 */
function createPeRiskPath() {
  const gp = new GeneralPath()
  gp.appendEllipse(new Rect(0, 0, 1, 1), false)
  return gp
}

/**
 * Creates the path for nodes of type "Third_Party".
 * @returns {!GeneralPath} The general path the describes this style
 */
function createThirdPartyPath() {
  const gp = new GeneralPath()
  gp.moveTo(0.25273825759228363, 0.2106077406985223)
  gp.cubicTo(
    new Point(0.37940464379944383, 0.008533694660719517),
    new Point(0.5427384738867617, -0.07436838307589484),
    new Point(0.7327381431952041, 0.20542116176184805)
  )
  gp.cubicTo(
    new Point(0.9727395859583705, 0.2054237109534111),
    new Point(1.026070204427681, 0.5059367593821318),
    new Point(0.9360671322061148, 0.6302855466359552)
  )
  gp.cubicTo(
    new Point(0.9727385659844104, 1.0499824248785579),
    new Point(0.7327384631870348, 0.9929823150021839),
    new Point(0.5727383979886994, 0.9308125068113157)
  )
  gp.cubicTo(
    new Point(0.37607164889080386, 1.044795193100142),
    new Point(0.23606605323366095, 0.9878057307616991),
    new Point(0.17274109991971903, 0.8064517974237797)
  )
  gp.cubicTo(
    new Point(-0.1039264767570484, 0.68210650753643),
    new Point(0.012736869827713297, 0.2572344906314848),
    new Point(0.25273825759228363, 0.2106077406985223)
  )
  gp.close()
  return gp
}

/**
 * Creates the path for nodes of type "Corporation".
 * @returns {!GeneralPath} The general path the describes this style
 */
function createCorporationPath() {
  const gp = new GeneralPath()
  gp.moveTo(0, 0)
  gp.lineTo(1, 0)
  gp.lineTo(1, 1)
  gp.lineTo(0, 1)
  gp.close()
  return gp
}

/**
 * Creates the path for nodes of type "CTB".
 * @returns {!GeneralPath} The general path the describes this style
 */
function createCtbPath() {
  const gp = new GeneralPath()
  gp.moveTo(0, 0)
  gp.lineTo(1, 0)
  gp.lineTo(1, 1)
  gp.lineTo(0, 1)
  gp.close()
  gp.moveTo(0, 1)
  gp.lineTo(0.5, 0)
  gp.lineTo(1, 1)
  return gp
}
