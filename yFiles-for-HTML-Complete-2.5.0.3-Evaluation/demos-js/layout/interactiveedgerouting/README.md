<!--
 //////////////////////////////////////////////////////////////////////////////
 // @license
 // This file is part of yFiles for HTML 2.5.0.3.
 // Use is subject to license terms.
 //
 // Copyright (c) 2000-2023 by yWorks GmbH, Vor dem Kreuzberg 28,
 // 72070 Tuebingen, Germany. All rights reserved.
 //
 //////////////////////////////////////////////////////////////////////////////
-->
# Interactive Edge Routing Demo

[You can also run this demo online](https://live.yworks.com/demos/layout/interactiveedgerouting/index.html).

# Interactive Edge Routing Demo

The Interactive Edge Routing demo showcases [EdgeRouter](https://docs.yworks.com/yfileshtml/#/api/EdgeRouter)'s ability to find and re-layout edge paths which are not yet ‘good’.

After each user interaction the edge router is applied with [RoutingPolicy](https://docs.yworks.com/yfileshtml/#/api/RoutingPolicy) set to either re-route entire edges or only necessary segments of edges. The edge router itself determines automatically which edges need a re-routing based on various criteria like intersections with other elements or routing style violations.

## Things to Try

- Move nodes with incident edges around to see how the edge paths are re-routed after the move gesture has been finished.
- Open/close group nodes with incident edges.
- Move nodes or create nodes in a way that they overlap existing edges.
- Create new edges and see how they are routed to match the other edges.
- Choose different routing policies with the Routing Policy combo box.
