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
# Vite Loading Demo

This demo shows how to load yFiles for HTML with [Vite](https://vitejs.dev/) as a loader for efficient web development and easy builds.

Also a layout algorithm in a Web Worker thread without blocking the UI or main thread is loaded using [Vite's built-in support for Web Workers](https://vitejs.dev/guide/features.html#web-workers).

## Running the demo

First, install the required npm modules in the demo directory:

```
\> npm install
```

Now the Vite development server can be started:

```
\> npm run dev
```

The Vite development server will launch the [index file](http://localhost:3000) in a browser.

The Vite loading demo supports Vite's [Hot Module Replacement (HMR)](https://vitejs.dev/guide/features.html#hot-module-replacement) abilities: When the server runs, try making changes to the demo source code and see how the app will be updated in the browser immediately.

The demo code uses [module workers](https://web.dev/module-workers/). Vite's development build relies on browser native support and therefore currently only works in some browser (e.g. Chrome). These browsers only support this demo in production mode.

The demo can be built for production and subsequently served:

```
\> npm run build
> npm run serve
```
