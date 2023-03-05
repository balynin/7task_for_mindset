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
# Dropshadow Performance - Custom Styles Tutorial

[You can also run this demo online](https://live.yworks.com/demos/02-tutorial-custom-styles/07-drop-shadow-performance/index.html).

Custom Styles Tutorial

# Dropshadow Performance

This step replaces the simple drop shadow in the last steps with a more visually appealing, blurred one. The dropshadow is pre-rendered into an image using a HTML canvas drawing. This image is placed in the defs section of the svg and referenced in each node visualization using a use element.

For this purpose, we need an implementation of [ISvgDefsCreator](https://docs.yworks.com/yfileshtml/#/api/ISvgDefsCreator) which in this demo is performed in `MySimpleNodeStyle#createDropShadow`.

## Things to Try

- Take a look at the blurred drop shadow of the nodes.
- Take a look at the methods `createDropShadow()`, `drawShadow()` and `render()` of class `MySimpleNodeStyle`.

## Left to Do

- Draw edges from nodes to their labels.
- Create a custom label style.
- Create a custom edge style.
- Create a custom port style for nodes.
- Create a custom group node style.
