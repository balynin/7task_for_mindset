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
  Color,
  Geom,
  GeomUtilities,
  IGraph,
  IMapper,
  INode,
  IRenderContext,
  IVisualCreator,
  Point,
  RadialLayoutNodeInfo,
  Rect,
  Size,
  SvgVisual,
  Visual
} from 'yfiles'

/**
 * @typedef {Object} Sector
 * @property {number} startAngle
 * @property {number} endAngle
 * @property {number} middleAngle
 * @property {string} color
 * @property {INode} root
 */

/**
 * @typedef {Object} RenderDataCache
 * @property {Array.<Sector>} sectors
 * @property {Sector} highlightedSector
 * @property {number} zoom
 */

/**
 * An {@link IVisualCreator} that manages and renders the sectors.
 */
export default class SectorVisual extends BaseClass(IVisualCreator) {
  constructor() {
    super()
    this.highlightColor = '#e01a4f'
    this.center = Point.ORIGIN
    this.radius = 100
    this.sectors = []
  }

  /**
   * Updates the sector drawing using the sector information from the layout algorithm.
   * @param {!IGraph} graph
   * @param {!IMapper.<INode,RadialLayoutNodeInfo>} [sectorMapper]
   */
  updateSectors(graph, sectorMapper) {
    if (!sectorMapper) {
      this.sectors = []
      return
    }

    // find the root node of the graph
    const root = graph.nodes.find(node => graph.inDegree(node) === 0)
    if (!root) {
      this.sectors = []
      return
    }

    // determine the center of the circles which is identical to the root node's center
    const rootInfo = sectorMapper.get(root)
    this.center = rootInfo
      ? new Point(
          rootInfo.centerOffset.x - root.layout.center.x,
          rootInfo.centerOffset.y - root.layout.center.y
        )
      : Point.ORIGIN

    // determine sector radius
    this.radius = graph.nodes
      .map(node => sectorMapper.get(node))
      .filter(info => info != null)
      .reduce((previous, info) => Math.max(info.radius, previous), 100)

    // create one sector for each child of the root node
    let lastColor
    this.sectors = graph
      .successors(root)
      .toArray()
      .filter(child => sectorMapper.get(child) instanceof RadialLayoutNodeInfo)
      .map((child, i) => {
        const info = sectorMapper.get(child)
        const startAngle = normalizeAngle(Geom.toRadians(info.sectorStart))
        const endAngle = normalizeAngle(Geom.toRadians(info.sectorStart + info.sectorSize))
        const color = Color.from(child.tag.color)
        const alpha = color.equals(lastColor || null) ? (i % 2 === 0 ? 0.1 : 0.2) : 0.1
        lastColor = color
        return {
          startAngle: startAngle,
          endAngle: endAngle,
          middleAngle: (startAngle + endAngle) / 2,
          color: `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`,
          root: child
        }
      })

    // sort the sectors by their start angle to get the neighbor information
    this.sectors = this.sectors.sort((sector1, sector2) => sector2.startAngle - sector1.startAngle)

    // fill sectors to get a full circle
    let lastSector
    this.sectors.forEach(sector => {
      if (!lastSector) {
        lastSector = this.sectors[this.sectors.length - 1]
        if (sector.endAngle > sector.startAngle) {
          // when the end angle is larger than the start angle it must be decreased by 2 * PI
          // to restore the correct order
          sector.endAngle -= Math.PI * 2
        }
      }

      // enlarge the sectors if there is space between them by dividing this space
      const diff = Math.abs(sector.endAngle - lastSector.startAngle)
      if (diff > 0.000001) {
        lastSector.startAngle = normalizeAngle(lastSector.startAngle - diff / 2)
        sector.endAngle = normalizeAngle(sector.endAngle + diff / 2)
      }
      lastSector = sector
    })
  }

  /**
   * Creates a new visual that emphasizes the sectors of the subtrees.
   * @see overrides {@link IVisualCreator.createVisual}
   * @param {!IRenderContext} context
   * @returns {!Visual}
   */
  createVisual(context) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    return this.updateVisual(context, new SvgVisual(g))
  }

  /**
   * Updates the visual that emphasizes the sectors of the subtrees.
   * @see overrides {@link IVisualCreator.updateVisual}
   * @param {!IRenderContext} context
   * @param {!Visual} oldVisual
   * @returns {!Visual}
   */
  updateVisual(context, oldVisual) {
    if (!(oldVisual instanceof SvgVisual)) {
      return this.createVisual(context)
    }

    const g = oldVisual.svgElement

    const cache = g['render-data-cache']
    if (
      cache &&
      this.sectors.length === cache.sectors.length &&
      this.sectors.every((sector, i) => sector === cache.sectors[i]) &&
      this.highlightedSector === cache.highlightedSector &&
      context.zoom === cache.zoom
    ) {
      // visual needs no update
      return oldVisual
    }

    // remove all sector elements
    while (g.childElementCount > 0) {
      g.removeChild(g.lastChild)
    }

    if (this.sectors.length === 1) {
      const sectorPath = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse')
      sectorPath.setAttribute('cx', String(this.center.x))
      sectorPath.setAttribute('cy', String(this.center.y))
      sectorPath.setAttribute('rx', String(this.radius))
      sectorPath.setAttribute('ry', String(this.radius))
      const sector = this.sectors[0]
      sectorPath.style.fill = sector.color
      sectorPath.style.stroke = sector.color
      sectorPath.style.strokeWidth = '2px'
      g.appendChild(sectorPath)
    } else {
      this.sectors.forEach(sector => {
        // create new sector element
        const sectorPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        g.appendChild(sectorPath)

        // update path and colors of the sector
        const sectorAngle = getSectorAngle(sector.startAngle, sector.endAngle)
        sectorPath.setAttribute(
          'd',
          `
          M ${this.center.x},${this.center.y}
          L ${Math.cos(sector.endAngle) * this.radius},${-Math.sin(sector.endAngle) * this.radius}
          A ${this.radius},${this.radius},${sector.endAngle < sector.startAngle ? 1 : 0},
            ${sectorAngle > Math.PI ? 1 : 0},1,${Math.cos(sector.startAngle) * this.radius},
            ${-Math.sin(sector.startAngle) * this.radius}
          Z`
        )
        sectorPath.style.fill = sector.color
        sectorPath.style.stroke =
          sector !== this.highlightedSector ? sector.color : this.highlightColor
        sectorPath.style.strokeWidth =
          sector !== this.highlightedSector ? '2px' : `${5 / context.zoom}px`
        sectorPath.style.cursor = 'pointer'
      })
    }

    g['render-data-cache'] = {
      sectors: this.sectors.slice(),
      highlightedSector: this.highlightedSector,
      zoom: context.zoom
    }
    return oldVisual
  }

  /**
   * Updates the highlighted sector. Returns true if the highlighted sector changes, otherwise false.
   * @param {!Point} location
   * @returns {boolean}
   */
  updateHighlight(location) {
    const hitSector = this.getSector(location)
    if (this.highlightedSector === hitSector) {
      return false
    }
    this.highlightedSector = hitSector
    return true
  }

  /**
   * Returns the sector that contains the given location.
   * @param {!Point} location
   * @returns {!Sector}
   */
  getSector(location) {
    // location is outside the bound of the circle
    const bounds = Rect.fromCenter(this.center, new Size(this.radius * 2, this.radius * 2))
    if (!bounds.contains(location)) {
      return
    }

    // location is outside the circle
    const isInCircle = GeomUtilities.ellipseContains(bounds, location, 0)
    if (!isInCircle) {
      return
    }

    // location is inside the circle and there is only one sector
    if (this.sectors.length === 1) {
      return this.sectors[0]
    }

    // location is inside the circle and there are multiple sectors
    // find the sector that contains the location
    const angle = getAngle(location, this.center)
    return this.sectors.find(sector => isAngleBetween(angle, sector.startAngle, sector.endAngle))
  }

  /**
   * Returns the root of the subtree which is in the sector of the given location.
   * @param {!Point} location
   * @returns {?INode}
   */
  getSubtreeRoot(location) {
    const sector = this.getSector(location)
    return sector ? sector.root : null
  }
}

/**
 * Returns the angle between the start and end angle.
 * @param {number} startAngle
 * @param {number} endAngle
 */
function getSectorAngle(startAngle, endAngle) {
  return startAngle <= endAngle ? endAngle - startAngle : endAngle + Math.PI * 2 - startAngle
}

/**
 * Checks if the given angle is in between the start and end angle.
 * @param {number} angle
 * @param {number} startAngle
 * @param {number} endAngle
 */
function isAngleBetween(angle, startAngle, endAngle) {
  return startAngle <= endAngle
    ? angle >= startAngle && angle < endAngle
    : angle >= startAngle || angle < endAngle
}

/**
 * Get the angle of the location relative to the origin.
 * @param {!Point} location
 * @param {!Point} origin
 * @returns {number}
 */
function getAngle(location, origin) {
  const delta = location.subtract(origin)
  const angle = Math.atan2(-delta.y, delta.x)
  return normalizeAngle(angle)
}

/**
 * Normalizes the angle to a value between 0 and 2 * PI.
 * @param {number} angle
 * @returns {number}
 */
function normalizeAngle(angle) {
  while (angle < 0) {
    angle += Math.PI * 2
  }
  while (angle >= Math.PI * 2) {
    angle -= Math.PI * 2
  }
  return angle
}
