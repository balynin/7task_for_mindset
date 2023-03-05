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
# Drag and Drop Demo

[You can also run this demo online](https://live.yworks.com/demos/input/draganddrop/index.html).

# Drag and Drop Demo

This demo shows how to enable drag and drop functionality for nodes using class [NodeDropInputMode](https://docs.yworks.com/yfileshtml/#/api/NodeDropInputMode), [LabelDropInputMode](https://docs.yworks.com/yfileshtml/#/api/LabelDropInputMode) and [PortDropInputMode](https://docs.yworks.com/yfileshtml/#/api/PortDropInputMode)

Note that, these specialized input modes offer more features than the generic [DropInputMode](https://docs.yworks.com/yfileshtml/#/api/DropInputMode), namely a preview of the item and a support for snapping while dragging.

The second palette supports native drag and drop. The drop input modes are able to react to the native drag events. Unfortunately, snapping is not supported for elements dragged from this palette. Note that this palette only works with mouse events. Native drag and drop is currently not able to handle touch or pen events.

The native drag and drop approach is disabled in Internet Explorer because the HTML5 drag and drop API is only partially supported. See [Known Issues](../../../doc/api/index.html#/dguide/known_issues) for further details.

## Things to Try

- Drag a node from the palette panels onto the canvas to create a new node.
- Drag a port or label from the palette panels onto a node/edge to create a new label/port.
- Drag an item near a node to see snapping guide lines.
- Drag a node over a group node to see group node highlighting.  
  Additionally hold the 'Shift' key, if this node is not dragged from the palette panel.
- Drop a node over a group node to place it inside the group.  
  Additionally hold the 'Shift' key, if this node is not dragged from the palette panel.
- Drag an edge from the palette onto another node in the canvas to start edge creation from there.
- Drag an edge from the palette onto the empty canvas to create a new node with an edge creation in progress.
- Drag an edge from the palette onto another edge to just apply the style of the dragged edge.
- Switch off the _Preview_ or the _Snapping and Preview_ features.

## Related Demos

- [Graph Drag and Drop](../graph-drag-and-drop)
- [Drag From Component](../drag-from-component)
- [Custom Drag and Drop](../custom-drag-and-drop)
- [Tutorial: Drag and Drop](../../03-tutorial-application-features/drag-and-drop/index.html)
