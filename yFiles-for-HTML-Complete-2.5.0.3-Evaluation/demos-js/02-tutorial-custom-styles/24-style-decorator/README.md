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
# Style Decorator - Custom Styles Tutorial

[You can also run this demo online](https://live.yworks.com/demos/02-tutorial-custom-styles/24-style-decorator/index.html).

Custom Styles Tutorial

# Style Decorator

This step shows how to enhance an existing node style by adding visual decorators. In this case the decorating node style adds the "label edges" that were formerly part of `MySimpleNodeStyle` to the wrapped style's visualization.

For the purpose of this tutorial step, the "label edges" rendering code has been removed from `MySimpleNodeStyle`.

Other graph item styles can be wrapped in the same fashion by subclassing [EdgeStyleBase](https://docs.yworks.com/yfileshtml/#/api/EdgeStyleBase), [LabelStyleBase](https://docs.yworks.com/yfileshtml/#/api/LabelStyleBase) and [PortStyleBase](https://docs.yworks.com/yfileshtml/#/api/PortStyleBase).

## Things to Try

- Take a look at the source code of `MyNodeStyleDecorator` class.
- Uncomment the line in `SampleApplication.initializeGraph()` that creates an instance of [RectangleNodeStyle](https://docs.yworks.com/yfileshtml/#/api/RectangleNodeStyle) instead of `MySimpleNodeStyle` and observe the outcome.

## Left to Do

- Create a custom group node style.
- Render nodes with HTML5 canvas instead of SVG for improved performance, especially for large graphs.
- Add [bridge support](https://docs.yworks.com/yfileshtml/#/dguide/bridges-customizations) to the edge style.
