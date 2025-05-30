import { logger } from '@/utils'
import type {
  ChangeStreamDeleteDocument,
  ChangeStreamInsertDocument,
  ChangeStreamUpdateDocument,
  Document,
} from 'mongodb'
import type { Model } from 'mongoose'

type CallbackId = string

type InsertCallback<T> = (
  change: ChangeStreamInsertDocument<T & { _id: string }>
) => void
type UpdateCallback<T> = (
  change: ChangeStreamUpdateDocument<T & { _id: string }>
) => void
type DeleteCallback<T> = (
  change: ChangeStreamDeleteDocument<T & { _id: string }>
) => void

export class ModelChangeListener<T extends Document> {
  private static instances: Map<string, ModelChangeListener<any>> = new Map()
  private onInsertCallbacks: Map<CallbackId, InsertCallback<T>> = new Map()
  private onUpdateCallbacks: Map<CallbackId, UpdateCallback<T>> = new Map()
  private onDeleteCallbacks: Map<CallbackId, DeleteCallback<T>> = new Map()
  private watcher: ReturnType<Model<T>['watch']>

  private constructor(model: Model<T>) {
    this.watcher = model
      .watch<
        T,
        | ChangeStreamInsertDocument<T & { _id: string }>
        | ChangeStreamUpdateDocument<T & { _id: string }>
        | ChangeStreamDeleteDocument<T & { _id: string }>
      >([], {
        fullDocument: 'updateLookup',
        fullDocumentBeforeChange: 'whenAvailable',
      })
      .on('change', (change) => {
        try {
          switch (change.operationType) {
            case 'insert':
              this.onInsertCallbacks.forEach((callback) => callback(change))
              break
            case 'update':
              this.onUpdateCallbacks.forEach((callback) => callback(change))
              break
            case 'delete':
              this.onDeleteCallbacks.forEach((callback) => callback(change))
              break
            default:
              break
          }
        } catch (err) {
          logger.error('@ MODEL CHANGE LISTENER', {
            err: err instanceof Error ? err.message : String(err),
          })
        }
      })
  }

  /**
   * Get or create an instance of ModelChangeListener for a specific model.
   * @param model - The Mongoose model for which the listener is created.
   * @returns {ModelChangeListener<T>} The singleton instance for the given model.
   */
  static getInstance<T extends Document>(
    model: Model<T>
  ): ModelChangeListener<T> {
    const modelName = model.modelName
    if (!this.instances.has(modelName)) {
      this.instances.set(modelName, new ModelChangeListener(model))
    }

    logger.info(`Returning model change listener for: ${modelName}`)
    return this.instances.get(modelName) as ModelChangeListener<T>
  }

  // --------------------------------------------------------------------------
  // INSERT

  addOnInsertCallback(callback: InsertCallback<T>): CallbackId {
    const id = this.generateCallbackId()
    this.onInsertCallbacks.set(id, callback)
    return id
  }

  removeOnInsertCallback(id: CallbackId) {
    this.onInsertCallbacks.delete(id)
  }

  // --------------------------------------------------------------------------
  // UPDATE

  addOnUpdateCallback(callback: UpdateCallback<T>): CallbackId {
    const id = this.generateCallbackId()
    this.onUpdateCallbacks.set(id, callback)
    return id
  }

  removeOnUpdateCallback(id: CallbackId) {
    this.onUpdateCallbacks.delete(id)
  }

  // --------------------------------------------------------------------------
  // DELETE

  addOnDeleteCallback(callback: DeleteCallback<T>): CallbackId {
    const id = this.generateCallbackId()
    this.onDeleteCallbacks.set(id, callback)
    return id
  }

  removeOnDeleteCallback(id: CallbackId) {
    this.onDeleteCallbacks.delete(id)
  }

  closeStream() {
    this.watcher.close()
    this.onInsertCallbacks.clear()
    this.onUpdateCallbacks.clear()
    this.onDeleteCallbacks.clear()
  }

  private generateCallbackId(): CallbackId {
    return crypto.randomUUID()
  }
}
