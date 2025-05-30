import { model, Schema } from 'mongoose'

// ----------------------------------------------------------------------------
// TYPES

export enum EAgentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export type AgentStatus = keyof typeof EAgentStatus

export enum EAgentType {
  TWITTER = 'TWITTER',
}

export type AgentType = keyof typeof EAgentType

export interface IAgent {
  status: AgentStatus
  name: string
  adminId: string
  type: AgentType

  twitterUsernamesToMonitor: string[]

  bio: string[]
  lore: string[]
  knowledge: string[]
  postExamples: string[]
  topics: string[]
  adjectives: string[]
  style: string[]
}

// ----------------------------------------------------------------------------
// SCHEMAS

export const AgentSchema = new Schema<IAgent>(
  {
    status: {
      type: String,
      enum: EAgentStatus,
      required: true,
      default: EAgentStatus.ACTIVE,
    },
    name: { type: String, required: true },
    adminId: { type: String, required: true },
    type: { type: String, enum: EAgentType, required: true },

    twitterUsernamesToMonitor: { type: [String], default: [] },

    bio: { type: [String], default: [] },
    lore: { type: [String], default: [] },
    knowledge: { type: [String], default: [] },
    postExamples: { type: [String], default: [] },
    topics: { type: [String], default: [] },
    adjectives: { type: [String], default: [] },
    style: { type: [String], default: [] },
  },
  {
    timestamps: true,
    collectionOptions: {
      changeStreamPreAndPostImages: {
        enabled: true,
      },
    },
  }
)

// ----------------------------------------------------------------------------
// MODELS

export const AgentModel = model('agents', AgentSchema)
