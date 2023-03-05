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
import { StorageLocation } from 'yfiles'

/**
 * Saves the given string to a Web Storage, alternatively either to the Local
 * Storage or to the Session Storage.
 */
export default class SaveToWebStorageOperation {
  /**
   * @param {!StorageLocation} storageLocation The storage location.
   * @param {!string} uri The uri that is used in the storage key.
   */
  constructor(storageLocation, uri) {
    this.uri = uri
    this.storageLocation = storageLocation
    this.allowOverwrite = true
  }

  /**
   * Checks if the operation can be executed.
   * @returns {boolean}
   */
  isAvailable() {
    return !isUndefined(SaveToWebStorageOperation.getStorage(this.storageLocation))
  }

  /**
   * Saves the given content to the file with the given name.
   * @returns {!Promise} A Promise that resolves when the save operation is complete.
   * @param {!string} fileContent
   */
  save(fileContent) {
    return new Promise((resolve, reject) => {
      const storage = SaveToWebStorageOperation.getStorage(this.storageLocation)
      const key = `${this.uri}/example.graphml`
      if (isUndefined(storage.getItem(key)) || this.allowOverwrite) {
        storage.setItem(key, fileContent)
        resolve()
      } else {
        reject(new Error(`The key '${key}' already exists and overwriting is not allowed.`))
      }
    })
  }

  /**
   * Gets the storage location.
   * @param {!StorageLocation} storageLocation
   * @returns {!Storage}
   */
  static getStorage(storageLocation) {
    return storageLocation === StorageLocation.LOCAL_STORAGE
      ? window.localStorage
      : window.sessionStorage
  }
}

/**
 * @param {*} value
 * @returns {boolean}
 */
function isUndefined(value) {
  return typeof value === 'undefined'
}
