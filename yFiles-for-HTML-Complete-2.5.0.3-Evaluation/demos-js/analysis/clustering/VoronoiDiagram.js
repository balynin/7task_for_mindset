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
  Edge,
  GeneralPath,
  Geom,
  Graph,
  HashMap,
  IEdgeMap,
  IEnumerable,
  INodeMap,
  LineSegment,
  List,
  Maps,
  Point,
  Rect,
  TriangulationAlgorithm,
  YNode,
  YPoint,
  YRectangle,
  YVector
} from 'yfiles'

/**
 * Creates a Voronoi diagram from a Delauney triangulation.
 * The result is returned as a sequence of {@link GeneralPath} instances that define Voronoi faces.
 * This class is built upon the concepts of triangulations, planar embedding, and faces and assumes
 * that the user is familiar with these concepts.
 */
export class VoronoiDiagram {
  /**
   * Creates a new instance of Voronoi diagram.
   * @param {!IEnumerable.<Point>} centroids
   * @param {!Rect} boundingBox
   */
  constructor(centroids, boundingBox) {
    this.centroids = centroids
    // calculate the content rect so that we can bound the Voronoi diagram
    this.boundingBox = boundingBox.toYRectangle()
    this.voronoiFaces = []
    this.createVoronoiDiagram()
  }

  /**
   * Creates the Voronoi graph.
   */
  createVoronoiDiagram() {
    // create the delauney triangulation and get the created faces
    const delauney = this.createDelauneyTriangulation()
    const faces = delauney.faces
    const delauneyCoordinates = delauney.delauneyCoordinates
    const edge2Face = delauney.edge2Face

    // create the voronoiGraph
    const voronoiGraph = new Graph()
    // holds the voronoi node coordinates
    const voronoiNodeCoordinates = voronoiGraph.createNodeMap()

    const closestEdgesMap = new HashMap()
    let outerFace = null

    const existOnlyTwoFaces = faces.size === 2
    let externalFaceFound = false
    faces.forEach(face => {
      // for each face, except the outerFace add a Voronoi node for this face that lies on the faces circumcenter
      if (!face.outer || (existOnlyTwoFaces && externalFaceFound)) {
        const circumcenter = face.calculateCircumcenter()
        face.voronoiNode = this.createVoronoiNode(
          voronoiGraph,
          circumcenter,
          voronoiNodeCoordinates
        )

        // find the edge that is closer to the circumcenter
        // this is necessary to calculate afterwards the direction of the vertical lines
        const faceEdges = face.edges
        let minDist = Number.POSITIVE_INFINITY
        let closestEdge = null
        for (let i = 0; i < faceEdges.length; i++) {
          const edge = faceEdges[i]
          const edgeSource = voronoiNodeCoordinates.get(edge.source)
          const edgeTarget = voronoiNodeCoordinates.get(edge.target)

          const distance = Geom.distanceToLineSegment(
            circumcenter.x,
            circumcenter.y,
            edgeSource.x,
            edgeSource.y,
            edgeTarget.x,
            edgeTarget.y
          )
          if (distance < minDist) {
            minDist = distance
            closestEdge = edge
          }
        }
        closestEdgesMap.set(face, closestEdge)
      } else {
        // get the outerFace
        outerFace = face
        externalFaceFound = true
      }
    })

    const edges = outerFace != null ? outerFace.edges : []
    const outerFaceEdges = new Set(edges)
    const visitedEdges = new Set()
    faces.forEach(face => {
      if (!face.outer || (existOnlyTwoFaces && face.circumcenter)) {
        const circumcenter = face.circumcenter
        face.edges.forEach(edge => {
          const oppositeEdge = edge.target.getEdge(edge.source)
          if (!visitedEdges.has(edge) && !visitedEdges.has(oppositeEdge)) {
            visitedEdges.add(edge)
            const sourceCenter = delauneyCoordinates.get(edge.source)
            const targetCenter = delauneyCoordinates.get(edge.target)

            // The Voronoi edges are drawn as follows:
            // (i) if the face edge is an outerFace edge, we calculate the perpendicular vector to this edge from the
            // circumcenter (enlarge it enough so that it reaches the boundary and calculate the intersection point
            // (at this intersection point we draw a new Voronoi edge), (ii) if the circumcenter lies in the interior
            // of the triangle, we connect the two Voronoi nodes of the two involved faces - again we may have to
            // enlarge somehow the edge if this does not reach the boundary
            if (outerFaceEdges.has(edge) || outerFaceEdges.has(oppositeEdge)) {
              const v = new YVector(targetCenter, sourceCenter)

              // find the orthonormal vector
              let orthonormal = YVector.orthoNormal(v)
              orthonormal.scale(5000)

              // now we have to define the orthonormal vector's direction
              // we create a line-segment from the orthonormal and check if it intersects the triangle
              let point = YVector.add(circumcenter, orthonormal)
              const edgeSegment = new LineSegment(sourceCenter, targetCenter)
              const bisectorSegment = new LineSegment(point, circumcenter)
              const intersection = LineSegment.getIntersection(edgeSegment, bisectorSegment)
              // the circumcenter is internal and the line-segment does not intersect with the edge, we have to rotate
              if (face.isCircumcenterInternal(circumcenter) && !intersection) {
                orthonormal = orthonormal.rotate(Math.PI)
              } else if (!face.isCircumcenterInternal(circumcenter)) {
                // the circumcenter is not internal and there exists an intersection and the vertical line
                // corresponds to the closest edge, or there exists not intersection but the vertical line does not
                // correspond to the closest edge, we have to rotate
                if (
                  (intersection && closestEdgesMap.get(face) === edge) ||
                  (!intersection && closestEdgesMap.get(face) !== edge)
                ) {
                  orthonormal = orthonormal.rotate(Math.PI)
                }
              }
              point = YVector.add(circumcenter, orthonormal)

              // calculate a new segment between the newly calculated point and the circumcenter and calculate the
              // intersection with the boundary
              if (this.boundingBox.contains(circumcenter)) {
                const lineSegment = new LineSegment(circumcenter, point)
                const intersectionPoints = this.calculateIntersectionPoints(lineSegment)
                const newEdgeSource = face.voronoiNode
                if (intersectionPoints.length > 0) {
                  const v1 = this.createVoronoiNode(
                    voronoiGraph,
                    intersectionPoints[0],
                    voronoiNodeCoordinates
                  )
                  this.createEdge(voronoiGraph, newEdgeSource, v1)
                }
              } else if (closestEdgesMap.get(face) !== edge) {
                let p = point
                // if the circumcenter does not belong to the bounding box, we have to draw the vertical lines except
                // the one that corresponds to the closest edge
                if (!this.boundingBox.contains(point)) {
                  // we check if we have an intersection with the boundary, else we have to enlarge the segment
                  // enough, so that it reaches the boundary
                  if (
                    (circumcenter.x < point.x && circumcenter.x < this.boundingBox.x) ||
                    (circumcenter.x > point.x && circumcenter.x > this.boundingBox.x) ||
                    (circumcenter.y < point.y && circumcenter.y < this.boundingBox.y) ||
                    (circumcenter.y > point.y && circumcenter.y > this.boundingBox.y)
                  ) {
                    p = this.enlargeSegment(circumcenter, point)
                  } else {
                    p = this.enlargeSegment(point, circumcenter)
                  }
                }

                // then we take the two intersections... there must be two since one is the intersection with the
                // closest boundary and the second with its parallel one
                const lineSegment = new LineSegment(circumcenter, p)
                const intersectionPoints = this.calculateIntersectionPoints(lineSegment)
                if (intersectionPoints.length > 1) {
                  const v1 = this.createVoronoiNode(
                    voronoiGraph,
                    intersectionPoints[0],
                    voronoiNodeCoordinates
                  )
                  const v2 = this.createVoronoiNode(
                    voronoiGraph,
                    intersectionPoints[1],
                    voronoiNodeCoordinates
                  )
                  this.createEdge(voronoiGraph, v1, v2)
                }
              }
            } else {
              const incidentFaces = edge2Face.get(edge)
              const face1 = incidentFaces[0]
              const face2 = incidentFaces[1]
              const center1 = face1.circumcenter
              const center2 = face2.circumcenter

              // since the edge is not an outerFace edge there always exist two faces, so we can create a segment
              let lineSegment = new LineSegment(center1, center2)
              const containsSource = this.boundingBox.contains(center1)
              const containsTarget = this.boundingBox.contains(center2)

              let newEdgeSource = face1.voronoiNode
              let newEdgeTarget = face2.voronoiNode
              if (containsSource && containsTarget) {
                // if both endpoints belong to the bounding box, we can simply create an edge
                this.createEdge(voronoiGraph, newEdgeSource, newEdgeTarget)
              } else {
                // if both endpoints does not belong to the bounding box, possibly the segment needs enlargement if
                // e.g. two points are both on the left or on the right of the rectangle
                let p1 = center1
                let p2 = center2

                const x1 = this.boundingBox.x
                const x2 = x1 + this.boundingBox.width
                const y1 = this.boundingBox.y
                const y2 = y1 + this.boundingBox.height
                const bothAtTheSameSide =
                  (p1.x <= x1 && p2.x <= x1) ||
                  (p1.y <= y1 && p2.y <= y1) ||
                  (p1.x >= x2 && p2.x >= x2) ||
                  (p1.y >= y2 && p2.y >= y2)

                if (!bothAtTheSameSide) {
                  if (!containsSource) {
                    p1 = this.enlargeSegment(center2, center1)
                  }
                  if (!containsTarget) {
                    p2 = this.enlargeSegment(center1, center2)
                  }

                  lineSegment = new LineSegment(p1, p2)
                  const intersectionPoints = this.calculateIntersectionPoints(lineSegment)
                  if (!containsSource) {
                    newEdgeSource = this.createVoronoiNode(
                      voronoiGraph,
                      intersectionPoints[0],
                      voronoiNodeCoordinates
                    )
                  }

                  if (!containsTarget) {
                    newEdgeTarget = this.createVoronoiNode(
                      voronoiGraph,
                      intersectionPoints.length === 1
                        ? intersectionPoints[0]
                        : intersectionPoints[1],
                      voronoiNodeCoordinates
                    )
                  }
                  this.createEdge(voronoiGraph, newEdgeSource, newEdgeTarget)
                } else {
                  // create a node for the one that is closer to the boundary
                  const rect = this.boundingBox.toRect()
                  const isP1CloserToBoundary =
                    rect.distanceTo(p1.toPoint()) < rect.distanceTo(p2.toPoint())
                  if (isP1CloserToBoundary) {
                    p1 = this.enlargeSegment(center2, center1)
                  } else {
                    p2 = this.enlargeSegment(center1, center2)
                  }

                  lineSegment = new LineSegment(p1, p2)
                  const intersectionPoints = this.calculateIntersectionPoints(lineSegment)
                  if (intersectionPoints.length > 0) {
                    this.createVoronoiNode(
                      voronoiGraph,
                      intersectionPoints[0],
                      voronoiNodeCoordinates
                    )
                  }
                }
              }
            }
          }
        })
      }
    })

    // add the boundary nodes - needed mostly for coloring the Voronoi parts
    const x = this.boundingBox.x
    const y = this.boundingBox.y
    const width = this.boundingBox.width
    const height = this.boundingBox.height

    this.createVoronoiNode(voronoiGraph, new YPoint(x, y), voronoiNodeCoordinates)
    this.createVoronoiNode(voronoiGraph, new YPoint(x + width, y), voronoiNodeCoordinates)
    this.createVoronoiNode(voronoiGraph, new YPoint(x + width, y + height), voronoiNodeCoordinates)
    this.createVoronoiNode(voronoiGraph, new YPoint(x, y + height), voronoiNodeCoordinates)

    // determine which nodes of the graph belong to the boundary so that we connect the consecutive ones and create
    // the Voronoi areas
    const boundaryNodes = []
    voronoiGraph.nodes.forEach(node => {
      if (this.belongsToBoundary(voronoiNodeCoordinates.get(node))) {
        boundaryNodes.push(node)
      }
    })

    // sort the nodes around the boundary so that we add edges between these nodes
    const center = new YPoint(x + width * 0.5, y + height * 0.5)
    boundaryNodes.sort((n1, n2) => {
      const p1 = voronoiNodeCoordinates.get(n1)
      const p2 = voronoiNodeCoordinates.get(n2)
      let angle1 = Math.atan2(p1.y - center.y, p1.x - center.x)
      let angle2 = Math.atan2(p2.y - center.y, p2.x - center.x)

      if (angle1 < 0) {
        angle1 += 2 * Math.PI
      }

      if (angle2 < 0) {
        angle2 += 2 * Math.PI
      }

      // For counter-clockwise, just reverse the signs of the return values
      if (angle1 < angle2) {
        return 1
      } else if (angle2 < angle1) {
        return -1
      }
      return 0
    })

    // create the edges between consecutive boundary nodes and store them
    const boundaryEdges = []
    for (let i = 0; i < boundaryNodes.length; i++) {
      const additionalNode = boundaryNodes[i]
      const edge = this.createEdge(
        voronoiGraph,
        boundaryNodes[(i + 1) % boundaryNodes.length],
        additionalNode
      )
      if (edge) {
        boundaryEdges.push(edge)
      }
    }

    // remove nodes that might lie on the exterior of the graph's bounding box, these can occur only if a
    // circumcenter lies on the exterior of the bounding box after the triangulation
    voronoiGraph.nodes.toArray().forEach(node => {
      if (node.degree === 0) {
        voronoiGraph.removeNode(node)
      }
    })

    // calculate the Voronoi faces
    this.calculateVoronoiFaces(voronoiGraph, voronoiNodeCoordinates, boundaryEdges)
  }

  /**
   * Creates the delauney triangulation and returns an object containing information about the created faces.
   * @returns {!object}
   */
  createDelauneyTriangulation() {
    // generate the delauney triangulation - the nodes of the delauney graph are the center of the clusters
    const delauneyGraph = new Graph()
    // holds the coordinates of each delauney node
    const pointData = delauneyGraph.createNodeMap()
    // holds the reversed edge for each delauney edge
    const revMap = delauneyGraph.createEdgeMap()

    // fill the pointData with the coordinates of the nodes of the delauney graph
    this.centroids.forEach(centroid => {
      const center = delauneyGraph.createNode()
      pointData.set(center, new YPoint(centroid.x, centroid.y))
    })

    // create the delauney triangulation
    const outerFaceEdge = TriangulationAlgorithm.calcDelauneyTriangulation(
      delauneyGraph,
      pointData,
      revMap
    )

    // calculate the faces of the triangulation
    const edge2Face = Maps.createHashedEdgeMap()
    const faces = this.calculateDelauneyFaces(delauneyGraph, revMap, pointData, edge2Face)

    // mark outer face edges
    this.calculateOuterFace(outerFaceEdge, revMap, edge2Face)
    return {
      faces,
      delauneyCoordinates: pointData,
      edge2Face
    }
  }

  /**
   * Calculates the faces of the given graph.
   * @param {!Graph} graph The input graph
   * @param {!IEdgeMap} reversedEdgesMap An edge map that holds for each edge the corresponding
   * reversed edge
   * @param {!INodeMap} coordinatesMap A node map that holds for each node the corresponding node
   * coordinates
   * @param {!IEdgeMap} edge2face An edge map that holds for each edge the face(s) to which the edge
   * belongs
   * @returns {!IEnumerable.<VoronoiFace>} The faces of the given graph as list
   */
  calculateDelauneyFaces(graph, reversedEdgesMap, coordinatesMap, edge2face) {
    const mark = []
    const faceList = new List()
    graph.edges.forEach(edge => {
      if (!mark[edge.index]) {
        const face = this.createFace(edge, mark, reversedEdgesMap)
        faceList.add(face)
        face.nodeCoordinates = coordinatesMap
      }
    })

    faceList.forEach(face => {
      face.edges.forEach(edge => {
        this.addEdgeToFace(edge, face, edge2face)
        this.addEdgeToFace(reversedEdgesMap.get(edge), face, edge2face)
      })
    })
    return faceList
  }

  /**
   * Calculates the outer face, starting from a given outer face edge.
   * @param {!Edge} outerFaceEdge An edge of the outer face to start
   * @param {!IEdgeMap} reversedEdgesMap An edge map that holds for each edge the corresponding
   * reversed edge belongs
   * @param {!IEdgeMap} edge2face An edge map that holds for each edge the face(s) to which the
   * edge belongs
   */
  calculateOuterFace(outerFaceEdge, reversedEdgesMap, edge2face) {
    let eOut = outerFaceEdge
    const outerFaceEdges = new Set()
    do {
      eOut = this.cyclicNextEdge(eOut, reversedEdgesMap)
      outerFaceEdges.add(eOut)
      outerFaceEdges.add(reversedEdgesMap.get(eOut))
    } while (outerFaceEdge !== eOut)

    // define the outer face, it is the face that contains the edge returned by the delauney triangulation
    const outerEdgeFaces = edge2face.get(outerFaceEdge)
    let outerFace = null
    for (let j = 0; j < outerEdgeFaces.length; j++) {
      const face = outerEdgeFaces[j]
      let includedEdges = 0
      const faceEdges = face.edges
      for (let i = 0; i < faceEdges.length; i++) {
        const edge = faceEdges[i]
        if (outerFaceEdges.has(edge)) {
          includedEdges++
        } else {
          break
        }
        if (includedEdges === faceEdges.length) {
          outerFace = face
          // mark the face as outer face
          outerFace.outer = true
          break
        }
      }
    }
  }

  /**
   * Creates a new face starting from the given edge.
   * @param {!Edge} edge The edge to start
   * @param {!Array.<boolean>} mark Holds the edges that have already been visited
   * @param {!IEdgeMap} reversedEdgesMap An edge map that holds for each edge the corresponding
   * reversed edge
   * @returns {!VoronoiFace}
   */
  createFace(edge, mark, reversedEdgesMap) {
    const face = new VoronoiFace()
    const startEdge = edge
    let ok = true
    while (ok) {
      face.addEdge(edge)
      mark[edge.index] = true

      // select the next outgoing edge in counterclockwise direction
      const nextEdge = this.cyclicNextEdge(edge, reversedEdgesMap)
      if (mark[nextEdge.index]) {
        if (nextEdge === startEdge) {
          ok = false
        }
      }
      edge = nextEdge
    }
    return face
  }

  /**
   * Adds an edge to the given face.
   * @param {!Edge} edge The given edge
   * @param {!VoronoiFace} face The face to which the edge belongs
   * @param {!IEdgeMap} edge2face An edge map that holds for each edge the face(s) to which the edge
   * belongs
   */
  addEdgeToFace(edge, face, edge2face) {
    if (!edge2face.get(edge)) {
      edge2face.set(edge, [])
    }
    const faces = edge2face.get(edge)
    if (faces.indexOf(face) < 0) {
      faces.push(face)
    }
  }

  /**
   * Returns the next edge in the face.
   * @param {!Edge} edge The given edge
   * @param {!IEdgeMap} reversedEdgesMap An edge map that holds for each edge the corresponding
   * reversed edge
   * @returns {!Edge} The next edge in the face
   */
  cyclicNextEdge(edge, reversedEdgesMap) {
    const reversedEdge = reversedEdgesMap.get(edge)
    const result = reversedEdge.prevOutEdge
    return result === null ? reversedEdge.source.lastOutEdge : result
  }

  /**
   * Returns the previous edge in the face.
   * @param {!Edge} edge The given edge
   * @param {!IEdgeMap} reversedEdgesMap An edge map that holds for each edge the corresponding
   * reversed edge
   * @returns {!Edge} The previous edge in the face
   */
  cyclicPrevEdge(edge, reversedEdgesMap) {
    let tmp = edge.nextOutEdge
    if (tmp === null) {
      tmp = edge.source.firstOutEdge
    }
    return reversedEdgesMap.get(tmp)
  }

  /**
   * Creates a Voronoi node.
   * @param {!Graph} voronoiGraph The Voronoi graph
   * @param {!YPoint} coordinates The node coordinates
   * @param {!INodeMap} voronoiNodeCoordinates Holds the coordinates of the nodes of the Voronoi
   * graph
   * @returns {!YNode}
   */
  createVoronoiNode(voronoiGraph, coordinates, voronoiNodeCoordinates) {
    const voronoiNode = voronoiGraph.createNode()
    voronoiNodeCoordinates.set(voronoiNode, coordinates)
    return voronoiNode
  }

  /**
   * Creates an edge between the two given nodes if the edge does not already exist in the graph.
   * @param {!Graph} voronoiGraph The voronoi diagram
   * @param {!YNode} source The source of the edge
   * @param {!YNode} target The target of the edge
   * @returns {?Edge}
   */
  createEdge(voronoiGraph, source, target) {
    if (!voronoiGraph.containsEdge(source, target) && !voronoiGraph.containsEdge(target, source)) {
      return voronoiGraph.createEdge(source, target)
    }
    return null
  }

  /**
   * Calculates the faces of the Voronoi graph.
   * @param {!Graph} voronoiGraph The Voronoi graph
   * @param {!INodeMap} voronoiNodeCoordinates Holds the coordinates of the nodes of the Voronoi
   * graph
   * @param {!Array.<Edge>} boundaryEdges An array containing the edges that belong to the boundary
   */
  calculateVoronoiFaces(voronoiGraph, voronoiNodeCoordinates, boundaryEdges) {
    const darts = []
    const node2Darts = new HashMap()
    const boundaryEdgesSet = new Set(boundaryEdges)

    // for each edge segment, we create two darts, one for each direction s -> t and t -> s
    let index = -1
    voronoiGraph.edges.forEach(edge => {
      const source = edge.source
      const target = edge.target
      const dart1 = new VoronoiDart(source, target, edge, index++)
      darts.push(dart1)
      const dart2 = new VoronoiDart(target, source, edge, index++)
      darts.push(dart2)

      // store the dart to its origin node's list
      if (!node2Darts.get(source)) {
        node2Darts.set(source, [])
      }
      node2Darts.get(source)?.push(dart1)

      if (!node2Darts.get(target)) {
        node2Darts.set(target, [])
      }
      node2Darts.get(target)?.push(dart2)

      dart1.reversed = dart2
      dart2.reversed = dart1
    })

    // for each dart, we calculate the angle that creates with the x-axis in counter-clockwise order
    darts.forEach(dart => {
      const sourceCenter = voronoiNodeCoordinates.get(dart.source)
      const targetCenter = voronoiNodeCoordinates.get(dart.target)
      const angle = Math.atan2(sourceCenter.y - targetCenter.y, sourceCenter.x - targetCenter.x)
      dart.angle = angle > 0 ? angle : 2 * Math.PI + angle
    })

    // we sort the darts around their origin based on the angle the form with the x-axis
    voronoiGraph.nodes.forEach(node => {
      const nodeDarts = node2Darts.get(node)
      if (nodeDarts !== null) {
        nodeDarts.sort((dart1, dart2) => {
          if (dart1.angle < dart2.angle) {
            return -1
          } else if (dart1.angle > dart2.angle) {
            return 1
          }
          return 0
        })
        for (let i = 0; i < nodeDarts.length; i++) {
          const dart = nodeDarts[i]
          dart.next = nodeDarts[(i + 1) % nodeDarts.length]
        }
      }
    })

    // we iterate over the darts to create the faces
    const faces = []
    darts.forEach(dart => {
      const face = []
      if (!dart.marked) {
        let d = dart
        while (!d.marked) {
          d.marked = true
          face.push(d)
          // get the next dart of the reversed
          d = d.reversed.next
        }
        // if the face is not the outer face, add the face to the list
        if (face.length !== boundaryEdges.length) {
          faces.push(face)
        } else {
          // if the sizes are equal, we have to examine whether the face contains all edges of the outer face
          for (let i = 0; i < face.length; i++) {
            const faceDart = face[i]
            // if an edge is not included this means that the face is not the same as the outer face
            if (!boundaryEdgesSet.has(faceDart.associatedEdge)) {
              faces.push(face)
              break
            }
          }
        }
      }
    })

    // we create the general paths that form the geometric face
    const voronoiFaces = []
    faces.forEach(face => {
      if (face.length > 2) {
        const facePath = new GeneralPath()
        for (let i = 0; i < face.length - 1; i++) {
          const dart = face[i]
          const sourcePoint = voronoiNodeCoordinates.get(dart.source)
          const targetPoint = voronoiNodeCoordinates.get(dart.target)
          if (i === 0) {
            facePath.moveTo(sourcePoint.x, sourcePoint.y)
          }
          facePath.lineTo(targetPoint.x, targetPoint.y)
        }
        facePath.close()
        voronoiFaces.push(facePath)
      }
    })

    this.voronoiFaces = voronoiFaces
  }

  /**
   * Calculates the intersections between the bounding box and a line segment.
   * @param {!LineSegment} lineSegment The given line segment
   * @returns {!Array.<YPoint>} An array containing the intersections between a rectangle and a line segment
   */
  calculateIntersectionPoints(lineSegment) {
    const v1 = new YPoint(this.boundingBox.x, this.boundingBox.y)
    const v2 = new YPoint(this.boundingBox.x + this.boundingBox.width, this.boundingBox.y)
    const v3 = new YPoint(
      this.boundingBox.x + this.boundingBox.width,
      this.boundingBox.y + this.boundingBox.height
    )
    const v4 = new YPoint(this.boundingBox.x, this.boundingBox.y + this.boundingBox.height)

    const intersections = []
    let intersectionPoint = LineSegment.getIntersection(lineSegment, new LineSegment(v1, v2))
    if (intersectionPoint) {
      intersections.push(intersectionPoint)
    }

    intersectionPoint = LineSegment.getIntersection(lineSegment, new LineSegment(v2, v3))
    if (intersectionPoint) {
      intersections.push(intersectionPoint)
    }

    intersectionPoint = LineSegment.getIntersection(lineSegment, new LineSegment(v3, v4))
    if (intersectionPoint) {
      intersections.push(intersectionPoint)
    }

    intersectionPoint = LineSegment.getIntersection(lineSegment, new LineSegment(v4, v1))
    if (intersectionPoint) {
      intersections.push(intersectionPoint)
    }
    return intersections
  }

  /**
   * Enlarges the segment formed by the two given points from the side of the second point.
   * @param {!YPoint} p1 The first point of the line segment
   * @param {!YPoint} p2 The second point of the line segment
   * @returns {!YPoint} A new point from the side of the second point
   */
  enlargeSegment(p1, p2) {
    const alpha = Math.atan2(p1.y - p2.y, p1.x - p2.x)
    const x = p2.x - 100000 * Math.cos(alpha)
    const y = p2.y - 100000 * Math.sin(alpha)
    return new YPoint(x, y)
  }

  /**
   * Checks whether this point belongs on the bounding box.
   * @param {!YPoint} point The point to check
   * @returns {boolean} True if the point belongs on the boundary, false otherwise
   */
  belongsToBoundary(point) {
    return (
      Math.abs(point.x - this.boundingBox.x) < 0.001 ||
      Math.abs(point.x - this.boundingBox.x - this.boundingBox.width) < 0.001 ||
      Math.abs(point.y - this.boundingBox.y) < 0.001 ||
      Math.abs(point.y - this.boundingBox.y - this.boundingBox.height) < 0.001
    )
  }
}

/**
 * This class represents a dart used for calculating the faces of a given graph drawing. For each edge there exist
 * two darts, one that represents the edge in its original direction (i.e., from source to target) and one that
 * represents its reverse.
 */
class VoronoiDart {
  /**
   * Creates a new instance of Dart.
   * @param {!YNode} source
   * @param {!YNode} target
   * @param {!Edge} associatedEdge
   * @param {number} index
   */
  constructor(source, target, associatedEdge, index) {
    // The next dart in counter-clockwise order.
    this.next = null

    // Whether or not this dart is marked.
    this.marked = false

    // The reversed dart for this dart.
    this.reversed = null

    // The angle formed by this dart in counter-clockwise order.
    this.angle = 0

    this.source = source
    this.target = target
    this.associatedEdge = associatedEdge
    this.index = index
  }
}

/**
 * This class models a triangular face.
 */
class VoronoiFace {
  constructor() {
    // The central Voronoi node of the face.
    this.voronoiNode = null

    // The edges of this face.
    this.edges = []

    this.vertices = []

    // The circumcenter of the face.
    this.circumcenter = null

    // The node map containing the coordinates of the nodes of the faces.
    this.nodeCoordinates = Maps.createHashedNodeMap()

    // Whether this face is the outer face.
    this.outer = false
  }

  /**
   * Adds the given edges to the list of edges of the given face.
   * @param {!Edge} edge The edge to add
   */
  addEdge(edge) {
    this.edges.push(edge)
    const source = edge.source
    const target = edge.target

    if (this.vertices.indexOf(source) < 0) {
      this.vertices.push(source)
    }

    if (this.vertices.indexOf(target) < 0) {
      this.vertices.push(target)
    }
  }

  /**
   * Returns the center of the circle that is defined by the three vertices of this face.
   * May only be called only for triangular faces.
   * @returns {!YPoint}
   */
  calculateCircumcenter() {
    if (!this.circumcenter) {
      this.calculateCircumcenterImpl()
    }
    return this.circumcenter
  }

  /**
   * Calculates the center of the circle that is defined by the three vertices of this face.
   * May only be called for triangular faces.
   */
  calculateCircumcenterImpl() {
    if (this.edges.length > 3 || this.vertices.length < 3) {
      throw new Error('Cannot calculate circumcenter for non-triangular faces.')
    }

    const p1 = this.nodeCoordinates.get(this.vertices[0])
    const p2 = this.nodeCoordinates.get(this.vertices[1])
    const p3 = this.nodeCoordinates.get(this.vertices[2])

    const det =
      2 * (p1.x * p2.y - p2.x * p1.y - p1.x * p3.y + p3.x * p1.y + p2.x * p3.y - p3.x * p2.y)
    const a = p1.x * p1.x + p1.y * p1.y
    const b = p2.x * p2.x + p2.y * p2.y
    const c = p3.x * p3.x + p3.y * p3.y
    const centerX = (a * (p2.y - p3.y) + b * (p3.y - p1.y) + c * (p1.y - p2.y)) / det
    const centerY = (a * (p3.x - p2.x) + b * (p1.x - p3.x) + c * (p2.x - p1.x)) / det
    this.circumcenter = new YPoint(centerX, centerY)
  }

  /**
   * Determines whether the circumcenter of the triangle lies in the interior of the triangular face.
   * @returns {boolean} True if the circumcenter of the triangle lies in the interior of the triangular face, false
   * otherwise
   * @param {!YPoint} circumcenter
   */
  isCircumcenterInternal(circumcenter) {
    const p1 = this.nodeCoordinates.get(this.vertices[0])
    const p2 = this.nodeCoordinates.get(this.vertices[1])
    const p3 = this.nodeCoordinates.get(this.vertices[2])
    const b1 = this.sign(circumcenter, p1, p2) < 0
    const b2 = this.sign(circumcenter, p2, p3) < 0
    const b3 = this.sign(circumcenter, p3, p1) < 0

    return b1 === b2 && b2 === b3
  }

  /**
   * @param {!YPoint} p1
   * @param {!YPoint} p2
   * @param {!YPoint} p3
   * @returns {number}
   */
  sign(p1, p2, p3) {
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y)
  }
}
