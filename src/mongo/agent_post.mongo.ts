import { model, models, Schema } from 'mongoose'

// ------------------------------------------------------------
// TYPE

export enum EAgentPostType {
  TWEET = 'TWEET',
}

export type AgentPostType = (typeof EAgentPostType)[keyof typeof EAgentPostType]

export type AgentPostBase = {
  agentId: string
  createdAt: Date
  updatedAt: Date
}

// ------------------------------------------------------------
// TWEET

export enum EAgentTweetStatus {
  PROCESSED = 'PROCESSED',
  SKIPPED = 'SKIPPED',
}

export type AgentTweetStatus = keyof typeof EAgentTweetStatus

export type AgentTweet = {
  tweetId?: string
  text?: string

  inReplyToUsername: string
  inReplyToTweetId: string
  inReplyToTweetTimestamp: number

  status: AgentTweetStatus
  statusMessage?: string | null
}

export type AgentPostTweet = AgentPostBase & AgentTweet

// ------------------------------------------------------------
// SCHEMA

export const AgentPostSchema = new Schema<AgentPostBase>(
  {
    agentId: { type: String, required: true },
  },
  {
    timestamps: true,
  }
)

// ------------------------------------------------------------
// TWEET

export const AgentPostTweetSchema = new Schema<AgentTweet>({
  tweetId: { type: String },
  text: { type: String },

  inReplyToUsername: { type: String, required: true },
  inReplyToTweetId: { type: String, required: true },
  inReplyToTweetTimestamp: { type: Number, required: true },

  status: { type: String, enum: EAgentTweetStatus, required: true },
  statusMessage: { type: String, default: null },
})

// ------------------------------------------------------------
// MODEL

const setModels = () => {
  const Base = model('agent_posts', AgentPostSchema)

  return {
    [EAgentPostType.TWEET]: Base.discriminator<AgentPostTweet>(
      EAgentPostType.TWEET,
      AgentPostTweetSchema
    ),
  }
}

if (!models.agent_posts) setModels()

export const AgentPostModel = {
  [EAgentPostType.TWEET]:
    models.agent_posts.discriminators![EAgentPostType.TWEET],
} as ReturnType<typeof setModels>
