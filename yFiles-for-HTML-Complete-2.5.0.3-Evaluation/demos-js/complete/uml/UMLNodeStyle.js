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
import {
  Class,
  DefaultLabelStyle,
  Fill,
  Font,
  FontStyle,
  GraphComponent,
  GraphEditorInputMode,
  GraphMLIOHandler,
  HandleSerializationEventArgs,
  HorizontalTextAlignment,
  IClipboardHelper,
  IEditLabelHelper,
  IGraphClipboardContext,
  ILabel,
  ILabelStyle,
  ILookup,
  IModelItem,
  INode,
  INodeSizeConstraintProvider,
  INodeStyle,
  Insets,
  InteriorStretchLabelModel,
  InteriorStretchLabelModelPosition,
  IRectangle,
  IRenderContext,
  ItemClickedEventArgs,
  IVisualCreator,
  LabelEditingEventArgs,
  MarkupExtension,
  NodeStyleBase,
  Point,
  Rect,
  ShapeNodeStyle,
  SimpleLabel,
  SimpleNode,
  Size,
  SolidColorFill,
  Stroke,
  SvgVisual,
  TextEditorInputMode,
  TextRenderSupport,
  TypeAttribute,
  VerticalTextAlignment,
  Visual,
  YObject
} from 'yfiles'

import { UMLClassModel } from './UMLClassModel.js'
// additional spacing after certain elements
const VERTICAL_SPACING = 2

// additional spacing to account for rounded corners
const ROUNDED_CORNER = 10

// additional spacing for the text element background
const BORDER_SPACING = 1

// empty space before the text elements
const LEFT_SPACING = 25

/**
 * An UML node style that visualizes an UMLClassModel.
 */
export class UMLNodeStyle extends NodeStyleBase {
  /**
   * Creates a new instance of the UML node style.
   * @param model The UML data that should be visualization by this style
   * @param fill The background fill of the header sections.
   * @param highlightFill The background fill of the selected entry.
   * @param {!UMLClassModel} [model]
   * @param {!Fill} [fill]
   * @param {!Fill} [highlightFill]
   */
  constructor(model, fill, highlightFill) {
    super()
    this.dummyNode = null
    this.backgroundLabelStyle = null
    this.stretchLabelModel = null
    this.categoryLabel = null
    this.elementLabel = null
    this.classLabel = null
    this.stereotypeLabel = null
    this.constraintLabel = null
    this.$model = model || new UMLClassModel()
    this.$fill = fill || new SolidColorFill(0x60, 0x7d, 0x8b)
    this.$highlightFill = highlightFill || new SolidColorFill(0xa3, 0xf1, 0xbb)
    this.$backgroundFill = new SolidColorFill('white')
    this.initializeStyles()
  }

  /**
   * Returns the background fill.
   * @type {!Fill}
   */
  get fill() {
    return this.$fill
  }

  /**
   * Sets the fill for the background.
   * @type {!Fill}
   */
  set fill(value) {
    this.$fill = value
  }

  /**
   * Returns the highlight background fill.
   * @type {!Fill}
   */
  get highlightFill() {
    return this.$highlightFill
  }

  /**
   * Sets the fill for the highlight background.
   * @type {!Fill}
   */
  set highlightFill(value) {
    this.$highlightFill = value
  }

  /**
   * Gets the UML data of this style.
   * @type {!UMLClassModel}
   */
  get model() {
    return this.$model
  }

  /**
   * Sets the UML data for this style.
   * @type {!UMLClassModel}
   */
  set model(model) {
    this.$model = model
  }

  /**
   * Creates the UML node style visual based on the UMLClassModel.
   * @param {!IRenderContext} ctx The render context.
   * @param {!INode} node The node to which this style instance is assigned.
   * @returns {!Visual}
   */
  createVisual(ctx, node) {
    this.initializeStyles() // fill color might have changed
    const data = this.$model
    const layout = node.layout
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.setAttribute('class', 'uml-node')
    this.dummyNode.layout = new Rect(0, 0, layout.width, layout.height)
    g.appendChild(newSvgElement(getCreator(this.dummyNode), ctx))

    let yOffset = 0

    // add the class label
    this.stretchLabelModel.insets = new Insets(0, yOffset, 0, 0)
    this.classLabel.text = data.className
    g.appendChild(newSvgElement(getCreator(this.classLabel), ctx))

    // add stereotype
    if (data.stereotype) {
      this.stretchLabelModel.insets = new Insets(0, 5, 0, 0)
      this.stereotypeLabel.text = `<<${data.stereotype}>>`
      g.appendChild(newSvgElement(getCreator(this.stereotypeLabel), ctx))
    }

    // add constraint
    if (data.constraint) {
      this.stretchLabelModel.insets = new Insets(0, 5, 0, 0)
      this.constraintLabel.text = `{${data.constraint}}`
      g.appendChild(newSvgElement(getCreator(this.constraintLabel), ctx))
    }

    yOffset += this.classLabel.preferredSize.height

    let selectedIndex = -1
    if (ctx.canvasComponent.currentItem === node && data.selectedIndex > -1) {
      selectedIndex = data.selectedIndex
    }

    // a separator
    const titleSectionOffset = createSvgRect(
      BORDER_SPACING,
      yOffset,
      node.layout.width - 2 * BORDER_SPACING,
      VERTICAL_SPACING,
      getSvgColor(this.$backgroundFill)
    )
    g.appendChild(titleSectionOffset)

    yOffset += VERTICAL_SPACING
    this.stretchLabelModel.insets = new Insets(0, yOffset, 0, 0)
    this.categoryLabel.text = ''
    const attributesHeaderBackground = newSvgElement(
      getCreator(this.categoryLabel, this.backgroundLabelStyle),
      ctx
    )
    attributesHeaderBackground.setAttribute('cursor', 'pointer')
    g.appendChild(attributesHeaderBackground)
    this.categoryLabel.text = 'Attributes'
    this.stretchLabelModel.insets = new Insets(LEFT_SPACING, yOffset, 0, 0)
    const attributesTextElement = newSvgElement(getCreator(this.categoryLabel), ctx)
    attributesTextElement.setAttribute('cursor', 'pointer')
    g.appendChild(attributesTextElement)

    yOffset += this.categoryLabel.preferredSize.height
    const attributesHeaderOffset = yOffset

    // draw a background for the attribute list
    const attributeBackground = createSvgRect(
      BORDER_SPACING,
      yOffset,
      node.layout.width - 2 * BORDER_SPACING,
      data.attributesOpen ? this.elementLabel.preferredSize.height * data.attributes.length : 0,
      getSvgColor(this.$backgroundFill)
    )
    g.appendChild(attributeBackground)

    let counter = 0
    let hasLocalSelection = false
    let hasGlobalSelection = false
    if (data.attributesOpen) {
      for (let i = 0; i < data.attributes.length; i++, counter++) {
        if (counter === selectedIndex) {
          hasGlobalSelection = true
          hasLocalSelection = true
          this.elementLabel.text = ''
          setBackgroundFill(this.elementLabel, this.$highlightFill)
          this.stretchLabelModel.insets = new Insets(1, yOffset, 1, 0)
          g.appendChild(newSvgElement(getCreator(this.elementLabel), ctx))
        }
        if (data.attributes[i] !== null && typeof data.attributes[i] !== 'undefined') {
          this.elementLabel.text = data.attributes[i]
          setBackgroundFill(this.elementLabel, null)
          this.stretchLabelModel.insets = new Insets(LEFT_SPACING, yOffset, 5, 0)
          g.appendChild(newSvgElement(getCreator(this.elementLabel), ctx))
          yOffset += this.elementLabel.preferredSize.height
        }
      }
    } else {
      counter += data.attributes.length
    }
    if (attributesHeaderOffset <= layout.height) {
      this.addControls(
        ctx,
        attributesHeaderBackground,
        layout,
        data.attributesOpen,
        hasLocalSelection
      )
    }

    this.stretchLabelModel.insets = new Insets(0, yOffset, 0, 0)
    this.categoryLabel.text = ''
    const operationsHeaderBackground = newSvgElement(
      getCreator(this.categoryLabel, this.backgroundLabelStyle),
      ctx
    )
    operationsHeaderBackground.setAttribute('cursor', 'pointer')
    g.appendChild(operationsHeaderBackground)
    this.categoryLabel.text = 'Operations'
    this.stretchLabelModel.insets = new Insets(LEFT_SPACING, yOffset, 0, 0)
    const operationsTextElement = newSvgElement(getCreator(this.categoryLabel), ctx)
    operationsTextElement.setAttribute('cursor', 'pointer')
    g.appendChild(operationsTextElement)
    yOffset += this.categoryLabel.preferredSize.height
    const operationsHeaderOffset = yOffset

    // draw a background for the attribute list
    const operationBackground = createSvgRect(
      BORDER_SPACING,
      yOffset,
      node.layout.width - 2 * BORDER_SPACING,
      data.operationsOpen ? this.elementLabel.preferredSize.height * data.operations.length : 0,
      getSvgColor(this.$backgroundFill)
    )
    getSvgColor(this.$highlightFill)
    g.appendChild(operationBackground)

    hasLocalSelection = false
    if (data.operationsOpen) {
      for (let i = 0; i < data.operations.length; i++, counter++) {
        if (counter === selectedIndex) {
          hasGlobalSelection = true
          hasLocalSelection = true
          this.elementLabel.text = ''
          setBackgroundFill(this.elementLabel, this.$highlightFill)
          this.stretchLabelModel.insets = new Insets(1, yOffset, 1, 0)
          g.appendChild(newSvgElement(getCreator(this.elementLabel), ctx))
        }
        if (data.operations[i] !== null && typeof data.operations[i] !== 'undefined') {
          this.elementLabel.text = data.operations[i]
          setBackgroundFill(this.elementLabel, null)
          this.stretchLabelModel.insets = new Insets(LEFT_SPACING, yOffset, 5, 0)
          g.appendChild(newSvgElement(getCreator(this.elementLabel), ctx))
          yOffset += this.elementLabel.preferredSize.height
        }
      }
    }
    if (operationsHeaderOffset <= layout.height) {
      this.addControls(
        ctx,
        operationsHeaderBackground,
        layout,
        data.operationsOpen,
        hasLocalSelection
      )
    }

    // a separator if the footer follows the operation header immediately
    const footerSectionOffset = createSvgRect(
      BORDER_SPACING,
      yOffset,
      node.layout.width - 2 * BORDER_SPACING,
      !data.operationsOpen || data.operations.length == 0 ? VERTICAL_SPACING : 0,
      getSvgColor(this.$backgroundFill)
    )
    g.appendChild(footerSectionOffset)

    SvgVisual.setTranslate(g, layout.x, layout.y)
    g['data-renderDataCache'] = {
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.height,
      dataModCount: data.modCount,
      hasSelection: hasGlobalSelection,
      fill: this.$fill,
      highlightFill: this.$highlightFill
    }
    return new SvgVisual(g)
  }

  /**
   * Updates the location of the UML node style. If anything other changed, a new visual is created.
   * @param {!IRenderContext} ctx The render context.
   * @param {!SvgVisual} oldVisual The visual that has been created in the call to
   *   {@link NodeStyleBase.createVisual}.
   * @param {!INode} node The node to which this style instance is assigned.
   * @returns {!Visual}
   */
  updateVisual(ctx, oldVisual, node) {
    const layout = node.layout

    const data = oldVisual.svgElement['data-renderDataCache']
    const model = this.$model
    const style = node.style
    if (
      !data ||
      data.dataModCount !== model.modCount ||
      data.width !== layout.width ||
      data.height !== layout.height ||
      (data.hasSelection && ctx.canvasComponent.currentItem !== node) ||
      data.fill !== style.fill ||
      data.highlightFill !== style.highlightFill
    ) {
      return this.createVisual(ctx, node)
    }

    if (data.x !== layout.x || data.y !== layout.y) {
      SvgVisual.setTranslate(oldVisual.svgElement, layout.x, layout.y)
      data.x = layout.x
      data.y = layout.y
    }
    return oldVisual
  }

  /**
   * Return the size of this node considering the associated UML data.
   * @param {!INode} node The node of which the size should be determined.
   * @returns {!Size} The preferred size of this node.
   */
  getPreferredSize(node) {
    const data = this.$model

    // determine height
    let entries = data.attributesOpen ? data.attributes.length : 0
    entries += data.operationsOpen ? data.operations.length : 0
    const height =
      this.classLabel.preferredSize.height +
      VERTICAL_SPACING + // title section
      this.categoryLabel.preferredSize.height * 2 + // both section titles
      this.elementLabel.preferredSize.height * entries + // visible entries
      ROUNDED_CORNER // offset to make space for the lower curvature

    // determine width
    let width = 125
    const elementFont = getFont(this.elementLabel)
    const elements = data.attributes.concat(data.operations)
    elements.forEach(element => {
      const size = TextRenderSupport.measureText(element, elementFont)
      width = Math.max(width, size.width + LEFT_SPACING + 5)
    })
    const classNameSize = TextRenderSupport.measureText(data.className, getFont(this.classLabel))
    width = Math.max(width, classNameSize.width)
    const stereotypeSize = TextRenderSupport.measureText(
      data.stereotype,
      getFont(this.stereotypeLabel)
    )
    width = Math.max(width, stereotypeSize.width)
    const constraintSize = TextRenderSupport.measureText(
      data.className,
      getFont(this.constraintLabel)
    )
    width = Math.max(width, constraintSize.width)

    return new Size(width, height)
  }

  /**
   * Adjusts the size of the given node considering UML data of the node. If the current node layout is bigger than
   * the minimal needed size for the UML data then the current node layout will be used instead.
   * @param {!INode} node The node whose size should be adjusted.
   * @param {!GraphEditorInputMode} geim The responsible input mode.
   */
  adjustSize(node, geim) {
    const layout = node.layout
    const minSize = this.getPreferredSize(node)
    const width = Math.max(minSize.width, layout.width)
    const height = Math.max(minSize.height, layout.height)
    // GEIM's setNodeLayout handles affected orthogonal edges automatically
    geim.setNodeLayout(node, new Rect(layout.x, layout.y, width, height))
    geim.graphComponent.invalidate()
  }

  /**
   * Adjusts the height of the given node to fit the UML data.
   * @param {!INode} node The node whose size should be adjusted.
   * @param {!GraphEditorInputMode} geim The responsible input mode.
   */
  fitHeight(node, geim) {
    const layout = node.layout
    const newSize = this.getPreferredSize(node)
    // GEIM's setNodeLayout handles affected orthogonal edges automatically
    geim.setNodeLayout(node, new Rect(layout.x, layout.y, layout.width, newSize.height))
    geim.graphComponent.invalidate()
  }

  /**
   * Upon label edit, we check which UML entry was hit and adjust the label edit accordingly. Additionally, we provide
   * an {@link INodeSizeConstraintProvider} to limit the interactive node resizing to the node's size
   * considering the attached UML data.
   * @param {!INode} node The node to use for the context lookup.
   * @param {!Class} type The type to query.
   * @returns {*}
   */
  lookup(node, type) {
    const outerThis = this
    if (type === IEditLabelHelper.$class) {
      const oldData = this.$model.clone()
      return IEditLabelHelper.create({
        async onLabelAdding(evt) {
          const newData = await outerThis.editLabel(evt, node, true)
          outerThis.handleUndo(evt.context.canvasComponent.inputMode, node, newData, oldData)
        },
        async onLabelEditing(evt) {
          const newData = await outerThis.editLabel(evt, node, false)
          outerThis.handleUndo(evt.context.canvasComponent.inputMode, node, newData, oldData)
        }
      })
    } else if (type === INodeSizeConstraintProvider.$class) {
      return INodeSizeConstraintProvider.create({
        getMinimumSize: item => this.getPreferredSize(item),
        getMaximumSize: _item => Size.INFINITE,
        getMinimumEnclosedArea: _item => Rect.EMPTY
      })
    } else if (type === IClipboardHelper.$class) {
      return IClipboardHelper.create({
        shouldCopy: (_context, _item) => true,
        shouldCut: (_context, _item) => true,
        shouldPaste: (_context, _item, _userData) => true,
        copy: (_context, _item) => null,
        cut: (_context, _item) => null,
        paste: (context, item, _userData) => {
          if (item instanceof INode) {
            const style = item.style
            if (style instanceof UMLNodeStyle) {
              if (context.targetGraph.foldingView) {
                context.targetGraph.foldingView.manager.masterGraph.setStyle(item, style.clone())
              } else {
                context.targetGraph.setStyle(item, style.clone())
              }
            }
          }
        }
      })
    }
    return null
  }

  /**
   * Manages text edits on the {@link UMLNodeStyle} by preconfiguring the {@link TextEditorInputMode}
   * with the text that should be edited and its position such that the label edit text box is opened on top of the
   * clicked text.
   * @param {!LabelEditingEventArgs} evt The event args with which the edit label was triggered.
   * @param {!INode} node The node whose label should be edited.
   * @param {boolean} adding Whether a new label is added or an existing one should be edited.
   * @returns {!Promise.<UMLClassModel>}
   */
  async editLabel(evt, node, adding) {
    const data = this.$model
    const index = data.selectedIndex
    const categoryHit = data.selectedCategory
    evt.cancel = true
    evt.handled = true
    const graphComponent = evt.context.canvasComponent
    const editorInputMode = graphComponent.inputMode

    const layout = this.getRelativeSlotLayout(index, node, adding, categoryHit)

    let text = ''
    if (!adding) {
      if (index < 0) {
        text = data.className
      } else if (index >= data.attributes.length) {
        text = data.operations[index - data.attributes.length] || ''
      } else {
        text = data.attributes[index] || ''
      }
    } else {
      // we add a dummy entry to make space for the label editing
      // eslint-disable-next-line no-lonely-if
      if (categoryHit === 1) {
        data.attributes.push('')
        this.adjustSize(node, editorInputMode)
      } else if (categoryHit === 2) {
        data.operations.push('')
        this.adjustSize(node, editorInputMode)
      }
    }

    editorInputMode.textEditorInputMode.editorText = text
    editorInputMode.textEditorInputMode.upVector = new Point(0, -1)
    const leftPadding = index < 0 ? 0 : LEFT_SPACING
    editorInputMode.textEditorInputMode.location = new Point(
      layout.x + node.layout.x + leftPadding,
      layout.y + node.layout.y + layout.height
    )
    editorInputMode.textEditorInputMode.anchor = new Point(0, 1)

    // actually edit the text and update the UML data model
    const res = await editorInputMode.textEditorInputMode.edit()
    if (res !== null) {
      if (index < 0) {
        data.className = res
      } else if (categoryHit === 1) {
        if (adding) {
          data.attributes[data.attributes.length - 1] = res
          data.selectedIndex = data.attributes.length - 1
        } else {
          data.attributes[index] = res
        }
      } else if (categoryHit === 2) {
        if (adding) {
          data.operations[data.operations.length - 1] = res
          data.selectedIndex = data.attributes.length + (data.operations.length - 1)
        } else {
          data.operations[index - data.attributes.length] = res
        }
      }
    } else {
      // canceled, maybe remove the dummy entry
      // eslint-disable-next-line no-lonely-if
      if (adding) {
        if (categoryHit === 1) {
          data.attributes.splice(data.attributes.length - 1, 1)
        } else if (categoryHit === 2) {
          data.operations.splice(data.operations.length - 1, 1)
        }
        this.adjustSize(node, editorInputMode)
      }
    }
    data.modify()
    graphComponent.invalidate()
    return data
  }

  /**
   * Clones this style and the associated UML model.
   * @returns {*}
   */
  clone() {
    const clone = super.clone()
    clone.model = clone.model.clone()
    return clone
  }

  /**
   * Handles clicks on this style.
   * @param {!GraphEditorInputMode} geim
   * @param {!ItemClickedEventArgs.<IModelItem>} args
   */
  nodeClicked(geim, args) {
    const node = args.item
    const data = this.$model
    const location = args.location
    const x = location.x - node.layout.x
    const y = location.y - node.layout.y

    // the vertical relative coordinates of the different interactive parts
    const topAttributesCategory = this.classLabel.preferredSize.height + VERTICAL_SPACING
    const bottomAttributesCategory = topAttributesCategory + this.categoryLabel.preferredSize.height
    let topOperationsCategory = bottomAttributesCategory
    let bottomOperationsCategory = topOperationsCategory + this.categoryLabel.preferredSize.height
    if (data.attributesOpen) {
      const attributesHeight = this.elementLabel.preferredSize.height * data.attributes.length
      topOperationsCategory += attributesHeight
      bottomOperationsCategory += attributesHeight
    }

    // determine which section or button was clicked
    if (y < topAttributesCategory) {
      if (data.selectedIndex !== -1) {
        data.selectedIndex = -1
      }
      return
    } else if (y >= topAttributesCategory && y <= bottomAttributesCategory) {
      // the attributes header was clicked
      if (x >= 5 && x < node.layout.width - 36) {
        this.toggleOpenState(1, geim, node)
      } else if (x >= node.layout.width - 36 && x <= node.layout.width - 20) {
        this.addLabel(1, geim, node)
      } else if (
        x >= node.layout.width - 18 &&
        x <= node.layout.width - 2 &&
        data.selectedIndex >= 0 &&
        data.selectedIndex <= data.attributes.length - 1
      ) {
        this.removeLabel(1, geim, node)
        this.fitHeight(node, geim)
      } else {
        if (data.selectedIndex !== -1) {
          data.selectedIndex = -1
        }
        return
      }
    } else if (data.attributesOpen && y > bottomAttributesCategory && y < topOperationsCategory) {
      // an attribute was clicked
      data.selectedCategory = 1
      data.selectedIndex =
        ((y - bottomAttributesCategory) / this.elementLabel.preferredSize.height) | 0
    } else if (y >= topOperationsCategory && y <= bottomOperationsCategory) {
      // the operations header was clicked
      if (x >= 5 && x < node.layout.width - 36) {
        this.toggleOpenState(2, geim, node)
      } else if (x >= node.layout.width - 36 && x <= node.layout.width - 20) {
        this.addLabel(2, geim, node)
      } else if (
        x >= node.layout.width - 18 &&
        x <= node.layout.width - 2 &&
        data.selectedIndex >= data.attributes.length &&
        data.selectedIndex <= data.attributes.length + data.operations.length - 1
      ) {
        this.removeLabel(2, geim, node)
        this.fitHeight(node, geim)
      } else {
        if (data.selectedIndex !== -1) {
          data.selectedIndex = -1
        }
        return
      }
    } else if (y > bottomOperationsCategory) {
      // an operation was clicked
      data.selectedCategory = 2
      data.selectedIndex =
        (data.attributes.length +
          (y - (topOperationsCategory + this.categoryLabel.preferredSize.height)) /
            this.elementLabel.preferredSize.height) |
        0
    } else {
      // a non-interactive part of the style was clicked, just do nothing
      return
    }

    const graphComponent = geim.inputModeContext.canvasComponent
    graphComponent.currentItem = node
    graphComponent.invalidate()
    args.handled = true
  }

  /**
   * Triggers interactive label adding.
   * @param {number} category 1 represents the attributes section, 2 represents the operations section
   * @param {!GraphEditorInputMode} geim
   * @param {!INode} node
   */
  addLabel(category, geim, node) {
    const data = this.$model
    data.selectedCategory = category
    if (category === 1) {
      data.selectedIndex = Math.max(0, data.attributes.length)
      data.attributesOpen = true
    } else if (category === 2) {
      data.selectedIndex = Math.max(
        data.attributes.length,
        data.attributes.length + data.operations.length
      )
      data.operationsOpen = true
    }
    geim.clickInputMode.preventNextDoubleClick()
    geim.addLabel(node)
  }

  /**
   * Removes the selected label from the node.
   * @param {number} category 1 represents the attributes section, 2 represents the operations section
   * @param {!GraphEditorInputMode} geim
   * @param {!INode} node
   */
  removeLabel(category, geim, node) {
    const data = this.$model
    const oldData = data.clone()
    data.selectedCategory = category
    if (category === 1) {
      data.attributes.splice(data.selectedIndex, 1)
    } else if (category === 2) {
      data.operations.splice(data.selectedIndex - data.attributes.length, 1)
    }
    data.selectedIndex = Math.min(
      data.selectedIndex,
      data.attributes.length + data.operations.length - 1
    )
    data.modify()
    geim.clickInputMode.preventNextDoubleClick()
    this.handleUndo(geim, node, data, oldData)
    this.adjustSize(node, geim)
  }

  /**
   * Toggles the open/closed state of the attributes or operations section.
   * @param {number} category 1 represents the attributes section, 2 represents the operations section
   * @param {!GraphEditorInputMode} geim
   * @param {!INode} node
   */
  toggleOpenState(category, geim, node) {
    const data = this.$model
    if (category === 1) {
      data.attributesOpen = !data.attributesOpen
    } else if (category === 2) {
      data.operationsOpen = !data.operationsOpen
    }
    data.modify()
    this.fitHeight(node, geim)
    geim.clickInputMode.preventNextDoubleClick()
  }

  /**
   * Adds an undo unit to the graphs undo engine which may undo/redo the UML data change.
   * @param {!GraphEditorInputMode} geim The responsible input mode.
   * @param {!INode} node The node whose data is changed.
   * @param {!UMLClassModel} newData The new data.
   * @param {!UMLClassModel} oldData The previous data.
   */
  handleUndo(geim, node, newData, oldData) {
    const graph = geim.graph
    const edit = graph.beginEdit('AddingLabel', 'AddingLabel')
    graph.addUndoUnit(
      'DataChanged',
      'DataChanged',
      () => {
        this.$model = oldData
        this.adjustSize(node, geim)
      },
      () => {
        this.$model = newData
        this.adjustSize(node, geim)
      }
    )
    edit.commit()
  }

  /**
   * Helper function to return the relative layout of a given slot index. A negative index indicates the class header
   * area.
   * @param {number} slot
   * @param {!INode} node
   * @param {boolean} isAdding
   * @param {number} category
   * @returns {!Rect}
   */
  getRelativeSlotLayout(slot, node, isAdding, category) {
    const data = this.$model
    const layout = node.layout

    if (slot < 0) {
      const classNameSize = TextRenderSupport.measureText(data.className, getFont(this.classLabel))
      return new Rect(
        layout.width / 2 - classNameSize.width / 2,
        0,
        layout.width,
        this.classLabel.preferredSize.height - 10
      )
    }

    // determine y-coordinate of the queried slot
    let top =
      this.classLabel.preferredSize.height +
      VERTICAL_SPACING +
      this.categoryLabel.preferredSize.height
    top += slot * this.elementLabel.preferredSize.height
    if ((isAdding && category === 2) || (!isAdding && slot >= data.attributes.length)) {
      // account for the operations category label
      top += this.categoryLabel.preferredSize.height
    }

    return new Rect(0, top, layout.width, this.elementLabel.preferredSize.height)
  }

  /**
   * Helper function to add the control buttons.
   * @param {!IRenderContext} ctx
   * @param {!Element} container
   * @param {!IRectangle} nodeLayout
   * @param {boolean} opened
   * @param {boolean} enableRemoveButton
   */
  addControls(ctx, container, nodeLayout, opened, enableRemoveButton) {
    const openMarker = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    openMarker.setAttribute('fill', 'white')
    openMarker.setAttribute('points', opened ? '-5,-3.5 5,-3.5 0,6' : '-3.5,5 6,0 -3.5,-5')
    openMarker.setAttribute('transform', 'translate(12 10)')
    openMarker.setAttribute('class', 'uml-button')
    container.appendChild(openMarker)

    const plusBackground = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    Fill.setFill(this.$fill, plusBackground, ctx)
    plusBackground.setAttribute('x', `${nodeLayout.width - 37}px`)
    plusBackground.setAttribute('y', '2px')
    plusBackground.setAttribute('width', '16px')
    plusBackground.setAttribute('height', '16px')
    const plusButtonPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    plusButtonPath.setAttribute('fill', 'white')
    plusButtonPath.setAttribute(
      'd',
      'M8.5,16.5c-4.418,0-8,3.582-8,8s3.582,8,8,8c4.418,0,8-3.582,8-8S12.918,16.5,8.5,16.5z M13.5,25.5h-4v4h-2v-4h-4v-2h4v-4h2v4h4V25.5z'
    )
    plusButtonPath.setAttribute('transform', `matrix(0.8 0 0 0.8 ${nodeLayout.width - 36} -10)`)
    const plus = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    plus.setAttribute('class', 'uml-button')
    plus.appendChild(plusBackground)
    plus.appendChild(plusButtonPath)
    container.appendChild(plus)

    const minusButtonBackground = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    Fill.setFill(this.$fill, minusButtonBackground, ctx)
    minusButtonBackground.setAttribute('x', `${nodeLayout.width - 19}px`)
    minusButtonBackground.setAttribute('y', '2px')
    minusButtonBackground.setAttribute('width', '16px')
    minusButtonBackground.setAttribute('height', '16px')
    const minusButtonPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    minusButtonPath.setAttribute('fill', 'white')
    minusButtonPath.setAttribute('fill-opacity', enableRemoveButton ? '1' : '0.5')
    minusButtonPath.setAttribute(
      'd',
      'M8.5,16.5c-4.418,0-8,3.582-8,8s3.582,8,8,8c4.418,0,8-3.582,8-8S12.918,16.5,8.5,16.5z M13.5,25.5h-10v-2h10V25.5z'
    )
    minusButtonPath.setAttribute('transform', `matrix(0.8 0 0 0.8 ${nodeLayout.width - 18} -10)`)
    const minus = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    minus.setAttribute('class', enableRemoveButton ? 'uml-button' : 'uml-button disabled')
    minus.appendChild(minusButtonBackground)
    minus.appendChild(minusButtonPath)
    container.appendChild(minus)
  }

  /**
   * Helper method to initialize the dummy styles and label models that are used to build the UML node style.
   */
  initializeStyles() {
    this.dummyNode = new SimpleNode()
    this.dummyNode.style = new ShapeNodeStyle({
      stroke: new Stroke({
        fill: this.$fill,
        thickness: 2
      }).freeze(),
      shape: 'round-rectangle',
      fill: this.$fill
    })

    this.backgroundLabelStyle = new DefaultLabelStyle({
      backgroundFill: this.$fill
    })

    this.stretchLabelModel = new InteriorStretchLabelModel()

    // initialize the category label visualization
    this.categoryLabel = new SimpleLabel(
      this.dummyNode,
      '',
      this.stretchLabelModel.createParameter(InteriorStretchLabelModelPosition.NORTH)
    )
    this.categoryLabel.style = new DefaultLabelStyle({
      textFill: Fill.WHITE,
      verticalTextAlignment: VerticalTextAlignment.CENTER
    })
    this.categoryLabel.preferredSize = new Size(1, 20)

    // initialize the element label visualization
    this.elementLabel = new SimpleLabel(
      this.dummyNode,
      '',
      this.stretchLabelModel.createParameter(InteriorStretchLabelModelPosition.NORTH)
    )
    this.elementLabel.style = new DefaultLabelStyle({
      verticalTextAlignment: VerticalTextAlignment.CENTER
    })
    this.elementLabel.preferredSize = new Size(1, 16)

    // initialize the class label visualization
    this.classLabel = new SimpleLabel(
      this.dummyNode,
      '',
      this.stretchLabelModel.createParameter(InteriorStretchLabelModelPosition.NORTH)
    )
    this.classLabel.style = new DefaultLabelStyle({
      textFill: Fill.WHITE,
      horizontalTextAlignment: HorizontalTextAlignment.CENTER,
      verticalTextAlignment: VerticalTextAlignment.CENTER
    })
    this.classLabel.preferredSize = new Size(1, 50)

    // initialize the stereotype label visualization
    this.stereotypeLabel = new SimpleLabel(
      this.dummyNode,
      '',
      this.stretchLabelModel.createParameter(InteriorStretchLabelModelPosition.NORTH)
    )
    this.stereotypeLabel.style = new DefaultLabelStyle({
      textFill: Fill.WHITE,
      horizontalTextAlignment: HorizontalTextAlignment.CENTER,
      font: new Font({
        fontStyle: FontStyle.ITALIC,
        fontSize: 10
      })
    })

    // initialize the constraint label visualization
    this.constraintLabel = new SimpleLabel(
      this.dummyNode,
      '',
      this.stretchLabelModel.createParameter(InteriorStretchLabelModelPosition.NORTH)
    )
    this.constraintLabel.style = new DefaultLabelStyle({
      textFill: Fill.WHITE,
      horizontalTextAlignment: HorizontalTextAlignment.CENTER,
      verticalTextAlignment: VerticalTextAlignment.BOTTOM,
      font: new Font({
        fontStyle: FontStyle.ITALIC,
        fontSize: 10
      })
    })
  }
}

/**
 * Helper function to obtain the visual creator of the item.
 * @param {!(INode|ILabel)} item
 * @param {!(INodeStyle|ILabelStyle)} [itemStyle]
 * @returns {!IVisualCreator}
 */
function getCreator(item, itemStyle) {
  if (item instanceof INode) {
    const style = itemStyle || item.style
    return style.renderer.getVisualCreator(item, style)
  } else {
    const style = itemStyle || item.style
    return style.renderer.getVisualCreator(item, style)
  }
}

/**
 * @param {!IVisualCreator} creator
 * @param {!IRenderContext} ctx
 * @returns {!SVGElement}
 */
function newSvgElement(creator, ctx) {
  return creator.createVisual(ctx).svgElement
}

/**
 * @param {!SimpleLabel} label
 * @returns {!Font}
 */
function getFont(label) {
  return label.style.font
}

/**
 * @param {!SimpleLabel} label
 * @param {?Fill} fill
 */
function setBackgroundFill(label, fill) {
  label.style.backgroundFill = fill
}
/**
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {?string} color
 * @returns {!SVGRectElement}
 */
function createSvgRect(x, y, width, height, color) {
  const svgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  if (color) {
    svgRect.setAttribute('fill', color)
  }
  svgRect.setAttribute('x', String(x))
  svgRect.setAttribute('y', String(y))
  svgRect.setAttribute('width', String(width))
  svgRect.setAttribute('height', String(height))
  return svgRect
}

/**
 * @param {!Fill} fill
 * @returns {?string}
 */
function getSvgColor(fill) {
  if (!(fill instanceof SolidColorFill)) {
    return null
  }
  const color = fill.color
  return `rgb(${color.r},${color.g},${color.b})`
}

/**
 * Markup extension needed to (de-)serialize the UML style.
 */
export class UMLNodeStyleExtension extends MarkupExtension {
  constructor() {
    super()
    this._fill = null
    this._highlightFill = null
    this._model = null
  }

  /**
   * @type {!Fill}
   */
  get fill() {
    return this._fill
  }

  /**
   * @type {!Fill}
   */
  set fill(value) {
    this._fill = value
  }

  /**
   * @type {!Fill}
   */
  get highlightFill() {
    return this._highlightFill
  }

  /**
   * @type {!Fill}
   */
  set highlightFill(value) {
    this._highlightFill = value
  }

  /**
   * @type {!UMLClassModel}
   */
  get model() {
    return this._model
  }

  /**
   * @type {!UMLClassModel}
   */
  set model(value) {
    this._model = value
  }

  /**
   * @type {!object}
   */
  static get $meta() {
    return {
      fill: TypeAttribute(Fill.$class),
      highlightFill: TypeAttribute(Fill.$class),
      model: TypeAttribute(YObject.$class)
    }
  }

  /**
   * @param {?ILookup} _serviceProvider
   */
  provideValue(_serviceProvider) {
    return new UMLNodeStyle(this.model, this.fill, this.highlightFill)
  }
}

/**
 * Listener that handles the serialization of the UML style.
 */
export const UMLNodeStyleSerializationListener = (sender, args) => {
  const item = args.item
  if (item instanceof UMLNodeStyle) {
    const umlNodeStyleExtension = new UMLNodeStyleExtension()
    umlNodeStyleExtension.fill = item.fill
    umlNodeStyleExtension.highlightFill = item.highlightFill
    umlNodeStyleExtension.model = item.model
    const context = args.context
    context.serializeReplacement(UMLNodeStyleExtension.$class, item, umlNodeStyleExtension)
    args.handled = true
  }
}

// export a default object to be able to map a namespace to this module for serialization
export default { UMLNodeStyle, UMLNodeStyleExtension }
