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
# Canvas Painting - Custom Styles Tutorial

[You can also run this demo online](https://live.yworks.com/demos/02-tutorial-custom-styles/27-canvas-painting/index.html).

Custom Styles Tutorial

# Canvas Painting

This step shows how to implement a zoom-dependent high-performance rendering using HTML5 Canvas painting for nodes. With the _High Performance_ button, you can switch between the normal SVG-based rendering and the Canvas painting.

## Description

To use Canvas painting, the style must create `Visuals` that extend [HtmlCanvasVisual](https://docs.yworks.com/yfileshtml/#/api/HtmlCanvasVisual). In this demo, the style which was developed in the earlier tutorial steps has been modified such that its methods `createVisual()` and `updateVisual()` return an `HtmlCanvasVisual` implementation at low zoom levels.

This, together with a very simplified visualization, enables very fast rendering, especially suited for a large number of nodes at a low zoom level.

## Things to Try

- Click "Start Animation" to see the performance of the SVG based node rendering.
- Turn on "High Performance" and click "Start Animation" to see the benefit of the zoom dependent canvas painting.
- Zoom in and out to see the automatic change between the two visualizations.
- Take a look at class `CircleVisual` and methods `MySimpleNodeStyle.createVisual()` and `MySimpleNodeStyle.updateVisual()`.
