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
# Grouped Graphs - Getting Started Tutorial

[You can also run this demo online](https://live.yworks.com/demos/01-tutorial-getting-started/08-grouping/index.html).

Getting Started Tutorial - Step 8

# Grouped Graphs

Enabling and using the grouping feature.

This step shows how to configure [support for grouped (or hierarchically organized) graphs](https://docs.yworks.com/yfileshtml/#/dguide/interaction-grouping). Note that collapse/expand functionality is introduced later in this tutorial.

[GraphEditorInputMode](https://docs.yworks.com/yfileshtml/#/api/GraphEditorInputMode) already provides the following default gestures for grouping/ungrouping:

- Press CTRL+G to group the currently selected nodes.
- Press CTRL+U to ungroup the currently selected nodes. Note that this does not automatically shrink the group node or remove it if it would be empty.
- Press SHIFT+CTRL+G to shrink a group node to its minimum size.
- Press SHIFT when dragging nodes into or out of groups to change the graph hierarchy.

See the sources for details.
