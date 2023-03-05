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
# Web Worker Demo

This demo shows how to run a yFiles layout algorithm in a [Web Worker](https://html.spec.whatwg.org/multipage/workers.html) task in order to prevent the layout calculation from blocking the UI.

The graph, layout, and layout data are configured in the main thread and transferred to the web worker using class [LayoutExecutorAsync](https://docs.yworks.com/yfileshtml/#/api/LayoutExecutorAsync). The actual layout calculation is performed in _WorkerLayout.ts_ with class [LayoutExecutorAsyncWorker](https://docs.yworks.com/yfileshtml/#/api/LayoutExecutorAsyncWorker) on the web worker thread.

## Build

Install the required npm packages and run the build script

```
\> npm install
> npm run build

```

## Run

The output files will be placed in the `dist/` directory inside this demo's directory. To run the demo, open `dist/index.html` in a browser with

```
\> npm run serve

```
