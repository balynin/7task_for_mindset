/****************************************************************************
 ** @license
 ** This demo file is part of yFiles for HTML 2.5.0.3.
 ** Copyright (c) 2000-2023 by yWorks GmbH, Vor dem Kreuzberg 28,
 ** 72070 Tuebingen, Germany. All rights reserved.
 **
 ** yFiles demo files exhibit yFiles for HTML functionalities. Any redistribution
 ** of demo files in source code or binary form, with or without
 ** modification, is not permitted.
 **
 ** Owners of a valid software license for a yFiles for HTML version that this
 ** demo is shipped with are allowed to use the demo source code as basis
 ** for their own yFiles for HTML powered applications. Use of such programs is
 ** governed by the rights and conditions as set out in the yFiles for HTML
 ** license agreement.
 **
 ** THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESS OR IMPLIED
 ** WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 ** MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN
 ** NO EVENT SHALL yWorks BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 ** SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 ** TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 ** PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 ** LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 ** NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 ** SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 **
 ***************************************************************************/
/* global CodeMirror */

import {
  HashMap,
  IEdge,
  IGraph,
  IGraphElementIdProvider,
  ILabelOwner,
  IModelItem,
  INode,
  ParseEventArgs,
  WriteEventArgs
} from 'yfiles'

/**
 * This class handles synchronization of the GraphML editor with the view graph.
 * @yjs:keep = setValue,getValue
 */
export class EditorSync {
  constructor() {
    this.itemToIdMap = new HashMap()
    this.itemToMarkerMap = new HashMap()
    this.markerToItemMap = new HashMap()
    this._editor = null
    this._graph = null
    this.contentChanged = this.onContentChanged.bind(this)
    this.cursorActivity = this.onCursorActivity.bind(this)
    this.editorContentChangedListener = () => {}
    this.itemSelectedListener = () => {}
  }

  /**
   * Dispatched when the GraphML content has been modified by the used.
   * @param {!function} listener
   */
  addEditorContentChangedListener(listener) {
    this.editorContentChangedListener = listener
  }

  /**
   * Dispatched when the GraphML content has been modified by the used.
   */
  removeEditorContentChangedListener() {
    this.editorContentChangedListener = () => {}
  }

  /**
   * Dispatched when the GraphML representation of a graph item has been selected in the editor.
   * @param {!function} listener
   */
  addItemSelectedListener(listener) {
    this.itemSelectedListener = listener
  }

  /**
   * Dispatched when the GraphML representation of a graph item has been selected in the editor.
   */
  removeItemSelectedListener() {
    this.itemSelectedListener = () => {}
  }

  /**
   * Initializes the graph and text editor.
   * @param {!IGraph} masterGraph
   */
  initialize(masterGraph) {
    this._graph = masterGraph

    // Initialize the CodeMirror editor
    const textarea = document.getElementById('xmlEditor')
    const editor = CodeMirror.fromTextArea(textarea, {
      lineNumbers: true,
      mode: 'application/xml'
    })
    editor.on('changes', this.contentChanged)
    editor.on('cursorActivity', this.cursorActivity)
    this._editor = editor
  }

  /**
   * The editor content has been edited: dispatch an event that notifies the view, and update the markers.
   */
  onContentChanged() {
    const value = this.editor.getValue()
    this.editorContentChangedListener({ value })
    this.onCursorActivity()
  }

  /**
   * The graph has been modified interactively in the view:
   * replace the editor content with the updated GraphML representation, and update the editor markers.
   * @param {!object} event
   */
  onGraphModified(event) {
    // don't fire changes while replacing the content
    this.editor.off('changes', this.contentChanged)
    this.editor.setValue(event.graphml)
    setOutput('')
    this.editor.on('changes', this.contentChanged)
    this.setMarkers()
    this.onItemSelected(event.selectedItem)
  }

  /**
   * Display GraphML errors in a HTML div element.
   * @param {!Error} ex
   */
  onGraphMLError(ex) {
    setOutput(ex.message)
  }

  /**
   * The GraphML has been parsed successfully: update markers
   */
  onGraphMLParsed() {
    this.setMarkers()
    // clear text in output area
    setOutput('')
  }

  /**
   * We need to extract the (internal) GraphML IDs for nodes and edges during parsing and writing,
   * so we can identify the corresponding GraphML snippets later.
   * @param {!WriteEventArgs} args
   */
  onWriting(args) {
    this.itemToIdMap.clear()
    const idProvider = args.context.lookup(IGraphElementIdProvider.$class)

    args.context.writeEvents.addNodeWrittenListener((s, a) => {
      const node = a.item
      const nodeId = idProvider.getNodeId(a.context, node)
      this.itemToIdMap.set(node, nodeId)
    })

    args.context.writeEvents.addEdgeWrittenListener((s, a) => {
      const edge = a.item
      const edgeId = idProvider.getEdgeId(a.context, edge)
      this.itemToIdMap.set(edge, edgeId)
    })
  }

  /**
   * Called when parsing of a document is about to begin.
   * @param {!ParseEventArgs} args
   */
  onParsing(args) {
    this.itemToIdMap.clear()

    args.context.parseEvents.addNodeParsedListener((s, a) => {
      const xmlElement = a.element
      const node = a.context.getCurrent(INode.$class)
      const id = xmlElement.getAttribute('id')
      this.itemToIdMap.set(node, id)
    })

    args.context.parseEvents.addEdgeParsedListener((s, a) => {
      const xmlElement = a.element
      const edge = a.context.getCurrent(IEdge.$class)
      const id = xmlElement.getAttribute('id')
      this.itemToIdMap.set(edge, id)
    })
  }

  /**
   * Called when a document has been parsed.
   * @param {!ParseEventArgs} args
   */
  onParsed(args) {
    // clear text in output area
    setOutput('')
  }

  /**
   * When the editor cursor is moved, see if we can identify a graph item representation
   * at the current cursor position.
   */
  onCursorActivity() {
    const cursor = this.editor.getCursor()
    const markers = this.editor.findMarksAt(cursor)
    if (markers[0]) {
      const marker = getInnermostMarker(cursor, markers)
      const item = this.markerToItemMap.get(marker)
      this.itemSelectedListener({ item })
    }
  }

  /**
   * Map editor markers to graph items.
   */
  setMarkers() {
    this.itemToMarkerMap.values.forEach(marker => {
      marker.clear()
    })
    this.itemToMarkerMap.clear()
    this.markerToItemMap.clear()

    const editorText = this.editor.getValue()

    const graph = this._graph
    graph.nodes.forEach(node => {
      this.setMarkersForItem(node, 'node', editorText)
    })
    graph.edges.forEach(edge => {
      this.setMarkersForItem(edge, 'edge', editorText)
    })
  }

  /**
   * Identify corresponding node/edge and label snippets for the provided item.
   * @param {!ILabelOwner} item A node or edge
   * @param {!string} tagName "node" or "edge"
   * @param {!string} editorText The GraphML text shown in the editor
   */
  setMarkersForItem(item, tagName, editorText) {
    // The internal GraphML ID for the item (determined during GraphML parsing/writing)
    const itemId = this.itemToIdMap.get(item)

    // Find the <node> or <edge> start tag
    const regexpStr = `<${tagName}.*?id="${itemId}".*?>`
    const regexp = new RegExp(regexpStr, 'i')
    const matches = regexp.exec(editorText)
    if (!matches) {
      return
    }

    // set an editor marker with the corresponding start and end indices
    const startIndex = editorText.indexOf(matches[0], 0)
    const endIndex = findMatchingTag(editorText, startIndex, tagName)
    const marker = this.editor.markText(
      this.editor.posFromIndex(startIndex),
      this.editor.posFromIndex(endIndex)
    )

    this.itemToMarkerMap.set(item, marker)
    this.markerToItemMap.set(marker, item)

    //
    // Find Label markers (labels are not part of the core GraphML standard and have no individual IDs).
    //
    // Identifying the correct set of <y:Label> elements is tedious, because <nodes> can contain nested
    // <graphs> and styles that also contain <y:Label> elements.
    //

    // The full GraphML representation of the label owner
    const labelOwnerText = editorText.substring(startIndex, endIndex)

    // If there is a nested <graph> section, we remove it for further matching,
    // so we find only labels belonging to the correct item.
    const nestedGraphRegExp = new RegExp('<graph(.|\\n)*<\\/graph>', '')
    const nestedGraphMatch = nestedGraphRegExp.exec(labelOwnerText)
    let nestedGraphStartIndex = 0
    let nestedGraphMatchLength = 0
    let labelOwnerTextWithoutNesting = labelOwnerText
    if (nestedGraphMatch) {
      nestedGraphStartIndex = labelOwnerText.indexOf(nestedGraphMatch[0], 0)
      labelOwnerTextWithoutNesting = labelOwnerText.replace(nestedGraphMatch[0], '')
      nestedGraphMatchLength = nestedGraphMatch[0].length
    }
    // Find the whole label data section (so we don't match other nested <y:Label> elements (e.g. inside of a
    // TableNodeStyle)
    const labelDataRegExp = new RegExp(
      '<data.*>(?:\\s|\\n)*?<x:List>(?:\\s|\\n)*(<y:Label.*>(?:\\n|.)*?<\\/y:Label>)*(?:\\s|\\n)*<\\/x:List>(?:\\s|\\n)*<\\/data>',
      'gi'
    )
    const labelDataMatch = labelOwnerTextWithoutNesting.match(labelDataRegExp)

    if (labelDataMatch !== null) {
      const labelData = labelDataMatch[0]

      // Finally, find the individual <y:Label> elements
      const labelRegExp = new RegExp('<y:Label.*>(?:\\n|.)*?<\\/y:Label>', 'gi')

      let labelMatches = labelRegExp.exec(labelData)
      let labelIndex = 0
      while (labelMatches) {
        const labelItem = item.labels.get(labelIndex)
        const labelText = labelMatches[0]

        let labelStartIndex = labelOwnerTextWithoutNesting.indexOf(labelText)
        // If we removed a nested graph, we have to consider this for the marker index
        if (nestedGraphMatch && labelStartIndex > nestedGraphStartIndex) {
          // label element after nested graph: increase index
          labelStartIndex += nestedGraphMatchLength
        }
        labelStartIndex += startIndex
        const labelEndIndex = labelStartIndex + labelText.length
        const labelMarker = this.editor.markText(
          this.editor.posFromIndex(labelStartIndex),
          this.editor.posFromIndex(labelEndIndex)
        )
        this.itemToMarkerMap.set(labelItem, labelMarker)
        this.markerToItemMap.set(labelMarker, labelItem)
        labelIndex++
        labelMatches = labelRegExp.exec(labelData)
      }
    }
  }

  /**
   * An view item has been selected by the user: identify the corresponding editor section and highlight it.
   * @param {?IModelItem} masterItem
   */
  onItemSelected(masterItem) {
    if (masterItem && this.itemToMarkerMap.keys.includes(masterItem)) {
      const options = {
        className: 'text-highlight'
      }
      const marker = this.replaceMarker(masterItem, options)
      if (marker) {
        this.editor.scrollIntoView(marker.find())
        this.editor.refresh()
      }
    }
  }

  /**
   * Unhighlight a deselected item by providing null-options to {@link replaceMarker}.
   * @param {!IModelItem} masterItem
   */
  onItemDeselected(masterItem) {
    this.replaceMarker(masterItem, {})
  }

  /**
   * Update a marker with the provided options (e.g. CSS class)
   * @param {!IModelItem} masterItem
   * @param {*} options
   * @returns {*}
   */
  replaceMarker(masterItem, options) {
    if (masterItem !== null && this.itemToMarkerMap.keys.includes(masterItem)) {
      const oldMarker = this.itemToMarkerMap.get(masterItem)
      const range = oldMarker.find()
      if (typeof range !== 'undefined') {
        this.markerToItemMap.delete(oldMarker)
        oldMarker.clear()
        const newMarker = this.editor.markText(range.from, range.to, options)
        this.markerToItemMap.set(newMarker, masterItem)
        this.itemToMarkerMap.set(masterItem, newMarker)
        return newMarker
      }
    }
    return null
  }

  /**
   * @type {!Editor}
   */
  get editor() {
    return this._editor
  }
}

/**
 * Find the shortest marker (text index pair) that spans the provided position.
 * @param {!Position} position
 * @param {!Array.<TextMarker>} markers
 * @returns {!TextMarker}
 */
function getInnermostMarker(position, markers) {
  let inner = markers[0]
  let innerPos = inner.find().from
  for (let i = 1; i < markers.length; i++) {
    const marker = markers[i]
    const markerPos = marker.find().from
    if (isGreater(markerPos, innerPos) && isGreater(position, markerPos)) {
      inner = marker
      innerPos = markerPos
    }
  }

  return inner
}

/**
 * @param {!Position} pos1
 * @param {!Position} pos2
 * @returns {boolean}
 */
function isGreater(pos1, pos2) {
  return (
    (pos1.line | 0) > (pos2.line | 0) || (pos1.line === pos2.line && (pos1.ch | 0) >= (pos2.ch | 0))
  )
}

/**
 * Finds a matching closing tag for a provided start tag (at the appropriate nesting depth).
 * @returns {number} The index of the match
 * @param {!string} str
 * @param {number} startIndex
 * @param {!string} tagName
 */
function findMatchingTag(str, startIndex, tagName) {
  const regExp = new RegExp(`<${tagName}.*>|</${tagName}>`, 'gi')
  const substr = str.substr(startIndex)
  let matches = regExp.exec(substr)
  let depth = 0
  while (matches) {
    depth = matches[0].indexOf(`<${tagName}`) === 0 ? depth + 1 : depth - 1
    if (depth === 0) {
      break
    }
    matches = regExp.exec(substr)
  }
  return regExp.lastIndex + startIndex
}

/**
 * @param {!string} text
 */
function setOutput(text) {
  const outputText = document.getElementById('outputText')
  outputText.textContent = text
}
