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
  BaseClass,
  CanvasComponent,
  HtmlCanvasVisual,
  IRenderContext,
  IVisualCreator,
  Visual
} from 'yfiles'
import type { Task } from './GanttMapper'
import { GanttMapper } from './GanttMapper'

/**
 * Manages and renders the background of the main component.
 */
export default class GridVisual extends BaseClass<HtmlCanvasVisual, IVisualCreator>(
  HtmlCanvasVisual,
  IVisualCreator
) {
  /**
   * Creates a new instance.
   * @param mapper The mapper to help with converting from coordinate to date.
   * @param dataModel The model data to create the grid for.
   */
  constructor(private readonly mapper: GanttMapper, private readonly dataModel: any) {
    super()
  }

  /**
   * Paints the grid visualization.
   * @param renderContext The render context of the {@link CanvasComponent}
   * @param renderingContext2D The HTML5 Canvas context to use for rendering.
   */
  paint(renderContext: IRenderContext, renderingContext2D: CanvasRenderingContext2D): void {
    const { x, width } = renderContext.canvasComponent!.viewport
    const { startDate, endDate, startX, endX } = this.mapper.getVisualRange(
      x - 100,
      x + width + 100
    )

    this.paintDays(renderContext, renderingContext2D, startX, endX)
    this.paintMonths(renderContext, renderingContext2D, startX, endX, startDate)
    this.paintTaskSeparators(renderContext, renderingContext2D, startX, endX)
  }

  /**
   * Paints the day separators.
   */
  private paintDays(
    renderContext: IRenderContext,
    renderingContext2D: CanvasRenderingContext2D,
    startX: number,
    endX: number
  ): void {
    const component = renderContext.canvasComponent!
    const y1 = component.viewport.y
    const y2 = component.viewport.bottomLeft.y
    const width = GanttMapper.dayWidth

    renderingContext2D.strokeStyle = '#ccc'
    renderingContext2D.lineWidth = 1

    renderingContext2D.beginPath()
    for (let x = startX; x < endX; x += width) {
      renderingContext2D.moveTo(x, y1)
      renderingContext2D.lineTo(x, y2)
    }
    renderingContext2D.stroke()
  }

  /**
   * Paints the month separators.
   */
  private paintMonths(
    renderContext: IRenderContext,
    renderingContext2D: CanvasRenderingContext2D,
    startX: number,
    endX: number,
    startDate: Date
  ): void {
    const component = renderContext.canvasComponent!
    const y1 = component.viewport.y
    const y2 = component.viewport.bottomLeft.y
    const width = GanttMapper.dayWidth

    renderingContext2D.strokeStyle = '#ccc'
    renderingContext2D.lineWidth = 3

    renderingContext2D.beginPath()
    for (
      let x = startX,
        // set date to "1" to make sure we don't get a problem with short months
        month = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      x < endX;
      x += GanttMapper.dayWidth * GanttMapper.daysInMonth(month),
        // works because date is set to "1"
        month.setMonth(month.getMonth() + 1)
    ) {
      renderingContext2D.moveTo(x, y1)
      renderingContext2D.lineTo(x, y2)
    }
    renderingContext2D.stroke()
  }

  /**
   * Paints the horizontal task lane separators.
   */
  private paintTaskSeparators(
    renderContext: IRenderContext,
    renderingContext2D: CanvasRenderingContext2D,
    beginX: number,
    endX: number
  ): void {
    const x1 = beginX
    const x2 = endX

    renderingContext2D.save()
    renderingContext2D.strokeStyle = '#ccc'
    renderingContext2D.lineWidth = 1
    try {
      renderingContext2D.setLineDash([5, 5])
    } catch (e) {
      // Unsupported in IE9 and IE10. Just use solid line then
    }

    renderingContext2D.beginPath()
    this.dataModel.tasks.forEach((task: Task) => {
      const y =
        this.mapper.getTaskY(task) +
        this.mapper.getCompleteTaskHeight(task) +
        GanttMapper.taskSpacing * 0.5
      renderingContext2D.moveTo(x1, y)
      renderingContext2D.lineTo(x2, y)
    })
    renderingContext2D.stroke()
    renderingContext2D.restore()
  }

  /**
   * Returns this instance.
   */
  createVisual(context: IRenderContext): Visual {
    return this
  }

  /**
   * Returns this instance.
   */
  updateVisual(context: IRenderContext, oldVisual: Visual): Visual {
    return oldVisual
  }
}
