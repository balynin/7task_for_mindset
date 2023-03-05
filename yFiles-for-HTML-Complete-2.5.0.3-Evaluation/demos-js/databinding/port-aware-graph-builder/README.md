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
# Port-aware Graph Builder Demo

[You can also run this demo online](https://live.yworks.com/demos/databinding/port-aware-graph-builder/index.html).

# Port-aware Graph Builder Demo

This demo automatically builds a graph from business data using a [GraphBuilder](https://docs.yworks.com/yfileshtml/#/api/GraphBuilder).  
The business data is stored in **JSON** format.

By default, a [GraphBuilder](https://docs.yworks.com/yfileshtml/#/dguide/graph_builder-GraphBuilder) connects the graph elements directly. It does not support further specification of the connection points (ports). The [Graph Builder](../graphbuilder/index.html) demo shows such an unmodified GraphBuilder.

In this sample the GraphBuilder is modified to support ports. These ports are created based on different node types. Edges are connected to these specific ports.

Additionally, the demo shows how to update a graph built with GraphBuilder when the corresponding business data changes. See the source code for details.

## Things to Try

- Use the "Update" button to change the business data and update the graph. Note that existing elements are kept stable.
- Inspect the source code to see how the [GraphBuilder](https://docs.yworks.com/yfileshtml/#/api/GraphBuilder) can be modified to support ports.
