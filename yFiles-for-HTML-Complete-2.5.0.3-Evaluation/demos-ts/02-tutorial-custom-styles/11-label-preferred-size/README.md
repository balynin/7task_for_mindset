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
# Label Preferred Size - Custom Styles Tutorial

[You can also run this demo online](https://live.yworks.com/demos/02-tutorial-custom-styles/11-label-preferred-size/index.html).

Custom Styles Tutorial

# Label Preferred Size

This step shows how to set the size of the label based on the size of its text by overriding the [LabelStyleBase#getPreferredSize](https://docs.yworks.com/yfileshtml/#/api/LabelStyleBase#getPreferredSize) method.

## Things to Try

- Select a label, open the label editor using "F2" to edit the label's text, and see how the label size is adjusted.
- Take a look at `MySimpleLabelStyle.getPreferredSize()`.

## Left to Do

- Override [LabelStyleBase#updateVisual](https://docs.yworks.com/yfileshtml/#/api/LabelStyleBase#updateVisual) to get high-performance rendering.
- Implement a button to open the label editor.
- Allow to change the background color of labels.
- Create a custom edge style.
- Create a custom port style for nodes.
- Use the decorator pattern to add label edges to the nodes.
- Create a custom group node style.
