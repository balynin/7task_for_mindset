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
import type { GraphWizardInputMode } from './GraphWizardInputMode'
import { CreateEdgeInputMode, IEdge, INode } from 'yfiles'

export type PreCondition = (mode: GraphWizardInputMode) => boolean

/**
 * Combines several {@link PreCondition} with a logic AND.
 * @param conditions The conditions to combine.
 */
export function checkAnd(conditions: PreCondition[]): PreCondition {
  return mode => conditions.every(condition => condition(mode))
}

/**
 * Combines several {@link PreCondition} with a logic OR.
 * @param conditions The conditions to combine.
 */
export function checkOr(conditions: PreCondition[]): PreCondition {
  return mode => conditions.some(condition => condition(mode))
}

/**
 * Negates a {@link PreCondition}.
 * @param condition The condition to negate.
 */
export function checkNot(condition: PreCondition): PreCondition {
  return mode => !condition(mode)
}

/**
 * Checks if the {@link GraphWizardInputMode.currentItem currentItem} is an {@link INode}.
 * @param mode The current {@link GraphWizardInputMode}.
 */
export function checkForNode(mode: GraphWizardInputMode): boolean {
  return mode.currentItem instanceof INode
}

/**
 * Checks if the {@link GraphWizardInputMode.currentItem currentItem} is an {@link IEdge}.
 * @param mode The current {@link GraphWizardInputMode}.
 */
export function checkForEdge(mode: GraphWizardInputMode): boolean {
  return mode.currentItem instanceof IEdge
}

/**
 * Checks if the {@link GraphWizardInputMode.currentItem currentItem} is an {@link INode} and
 * has the specified {@link INode.style style}.
 * @param styleClass The style class the current node is checked for.
 */
export function checkForNodeStyle(styleClass: any): PreCondition {
  return mode => mode.currentItem instanceof INode && mode.currentItem.style instanceof styleClass
}

/**
 * Checks if the {@link GraphWizardInputMode.currentItem currentItem} is an {@link IEdge} and
 * has the specified {@link IEdge.style style}.
 * @param styleClass The style class the current edge is checked for.
 */
export function checkForEdgeStyle(styleClass: any): PreCondition {
  return mode => mode.currentItem instanceof IEdge && mode.currentItem.style instanceof styleClass
}

/**
 * Checks if no edge creation is currently {@link CreateEdgeInputMode.isCreationInProgress in progress}.
 * @param mode The current {@link GraphWizardInputMode}.
 */
export function checkNotCreatingEdge(mode: GraphWizardInputMode): boolean {
  return !mode.createEdgeMode.isCreationInProgress
}

/**
 * Checks if an edge creation is currently {@link CreateEdgeInputMode.isCreationInProgress in progress}.
 * @param mode The current {@link GraphWizardInputMode}.
 */
export function checkCreatingEdge(mode: GraphWizardInputMode): boolean {
  return mode.createEdgeMode.isCreationInProgress
}
