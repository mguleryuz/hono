import { Schema } from 'effect'

export const PaginationResponse = Schema.Struct({
  currentPage: Schema.Number,
  totalPages: Schema.Number,
  totalCount: Schema.Number,
  limit: Schema.Number,
  hasNextPage: Schema.Boolean,
  hasPrevPage: Schema.Boolean,
})

export const AddressSchema = Schema.Union(
  Schema.TemplateLiteral('0x', Schema.String),
  Schema.String
)
