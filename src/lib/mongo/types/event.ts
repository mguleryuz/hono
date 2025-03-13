export enum EEventType {
  USER_CHANGE = 'USER_CHANGE',
}

export type EventType = keyof typeof EEventType

export type EventData = {
  operationType: EventType
  uid: string
}
