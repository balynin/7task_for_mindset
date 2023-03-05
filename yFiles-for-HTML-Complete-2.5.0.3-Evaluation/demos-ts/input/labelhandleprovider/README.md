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
# Label Handle Provider Demo

[You can also run this demo online](https://live.yworks.com/demos/input/labelhandleprovider/index.html).

# Label Handle Provider Demo

This demo shows how to implement custom [IHandle](https://docs.yworks.com/yfileshtml/#/api/IHandle)s that allow interactive resizing and rotation of labels.

## Things to Try

- Select a node label or an edge label and change its size by dragging its resize handle (the square).
- The _Free Node Label_ can also be rotated: Select that label and drag its rotate handle (the dot).
- Take a look at the source code, especially _LabelHandleProvider_, _LabelResizeHandle_, and _LabelRotateHandle_.

Note that the actual resize behavior depends on the label model parameter, since some parameters constrain the label's center to stay at the same position. For these parameters, the label is resized symmetrically in both directions.
