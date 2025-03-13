import type {
  ChangeStreamInsertDocument,
  ChangeStreamUpdateDocument,
  UpdateDescription,
  Document,
} from 'mongodb'
import type { Model } from 'mongoose'

type CallbackId = string

type InsertCallback<T> = (document: T & { _id: string }) => void
type UpdateCallback<T> = (params: {
  document: T & { _id: string }
  updateDescription: UpdateDescription<T & { _id: string }>
}) => void

export class ModelChangeListener<T extends Document> {
  private static instances: Map<string, ModelChangeListener<any>> = new Map()
  private onInsertCallbacks: Map<CallbackId, InsertCallback<T>> = new Map()
  private onUpdateCallbacks: Map<CallbackId, UpdateCallback<T>> = new Map()
  private watcher: ReturnType<Model<T>['watch']>

  private constructor(model: Model<T>) {
    this.watcher = model
      .watch<
        T,
        | ChangeStreamInsertDocument<T & { _id: string }>
        | ChangeStreamUpdateDocument<T & { _id: string }>
      >([], {
        fullDocument: 'updateLookup',
      })
      .on('change', (change) => {
        const { operationType, fullDocument } = change
        try {
          switch (operationType) {
            case 'insert':
              if (fullDocument) {
                this.onInsertCallbacks.forEach((callback) =>
                  callback(fullDocument)
                )
              }
              break
            case 'update':
              if (fullDocument) {
                const { updateDescription } = change
                this.onUpdateCallbacks.forEach((callback) =>
                  callback({ document: fullDocument, updateDescription })
                )
              }
              break
            default:
              break
          }
        } catch (err) {
          console.error('@ MODEL CHANGE LISTENER', err ?? 'No Error Caught')
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
    return this.instances.get(modelName) as ModelChangeListener<T>
  }

  addOnInsertCallback(callback: InsertCallback<T>): CallbackId {
    const id = this.generateCallbackId()
    this.onInsertCallbacks.set(id, callback)
    return id
  }

  addOnUpdateCallback(callback: UpdateCallback<T>): CallbackId {
    const id = this.generateCallbackId()
    this.onUpdateCallbacks.set(id, callback)
    return id
  }

  removeOnInsertCallback(id: CallbackId) {
    this.onInsertCallbacks.delete(id)
  }

  removeOnUpdateCallback(id: CallbackId) {
    this.onUpdateCallbacks.delete(id)
  }

  closeStream() {
    this.watcher.close()
    this.onInsertCallbacks.clear()
    this.onUpdateCallbacks.clear()
  }

  private generateCallbackId(): CallbackId {
    return crypto.randomUUID()
  }
}
