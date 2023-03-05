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
declare const neo4j: any

/* global neo4j */
/**
 * @yjs:keep = types,Node
 */
export const Neo4jNode = neo4j.types.Node
/**
 * @yjs:keep = types,Relationship
 */
export const Neo4jEdge = neo4j.types.Relationship

/**
 * Establishes a connection to a Neo4j database.
 * @param url The URL to connect to (neo4j:// bolt:// neo4j+s://).
 * @param databaseName The name of the database.
 * @param user The username to use.
 * @param pass The password to use.
 */
export async function connectToDB(
  url: string,
  databaseName: string,
  user: string,
  pass: string
): Promise<(query: string, params?: {}) => Promise<Result>> {
  // create a new Neo4j driver instance
  const neo4jDriver = neo4j.driver(url, neo4j.auth.basic(user, pass))

  const runCypherQuery = createCypherQueryRunner(neo4jDriver, databaseName)

  try {
    // check connection
    await runCypherQuery('MATCH (n) RETURN n LIMIT 1')
  } catch (e) {
    throw new Error(`Could not connect to Neo4j: ${e}`)
  }

  return runCypherQuery
}

function createCypherQueryRunner(neo4jDriver: any, databaseName: string) {
  /**
   * Runs the Cypher query.
   * @yjs:keep = run
   */
  return async (query: string, params: {} = {}): Promise<Result> => {
    const session = neo4jDriver.session({
      database: databaseName,
      defaultAccessMode: neo4j.session.READ
    })
    let result: Promise<Result>
    try {
      result = await session.run(query, params)
    } catch (e) {
      throw new Error(`Could not run cypher query: ${e}`)
    } finally {
      session.close()
    }
    return result
  }
}

export type Node = {
  identity: Integer
  labels: string[]
  properties: Object
}

export type Relationship = {
  identity: Integer
  start: Integer
  end: Integer
  type: string
  properties: Object
}

export type Neo4jRecord = {
  keys: String[]
  length: Number
  get: (key: string | Number) => any
  forEach: (visitor: (value: Object, key: string, record: Neo4jRecord) => void) => void
}

export type Integer = {
  high: number
  low: number
  toInt: () => number
  equals: (other: Integer | number | string) => boolean
}

export type Result = {
  summary: Promise<any>
  records: Neo4jRecord[]
}
