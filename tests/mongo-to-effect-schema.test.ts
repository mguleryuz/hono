import { describe, expect, it } from 'bun:test'
import { Schema } from 'mongoose'

import { mongooseToEffectSchema } from '../src/utils/mongo-to-effect-schema'

describe('mongooseToEffectSchema', () => {
  it('should include _id field when _id is true', () => {
    const TestSchema = new Schema(
      {
        title: { type: String, required: true },
        secret: { type: String, required: true },
      },
      {
        _id: true,
        timestamps: true,
      }
    )

    const effectSchema = mongooseToEffectSchema(TestSchema)

    // Check that the fields exist in the schema
    expect(effectSchema.fields).toHaveProperty('title')
    expect(effectSchema.fields).toHaveProperty('secret')
    expect(effectSchema.fields).toHaveProperty('_id')
    expect(effectSchema.fields).toHaveProperty('createdAt')
    expect(effectSchema.fields).toHaveProperty('updatedAt')
  })

  it('should exclude _id field when _id is false', () => {
    const TestSchema = new Schema(
      {
        title: { type: String, required: true },
        secret: { type: String, required: true },
      },
      {
        _id: false,
        timestamps: true,
      }
    )

    const effectSchema = mongooseToEffectSchema(TestSchema)

    // Check that the fields exist in the schema
    expect(effectSchema.fields).toHaveProperty('title')
    expect(effectSchema.fields).toHaveProperty('secret')
    expect(effectSchema.fields).not.toHaveProperty('_id')
    expect(effectSchema.fields).toHaveProperty('createdAt')
    expect(effectSchema.fields).toHaveProperty('updatedAt')
  })

  it('should exclude timestamp fields when timestamps is false', () => {
    const TestSchema = new Schema(
      {
        title: { type: String, required: true },
        secret: { type: String, required: true },
      },
      {
        timestamps: false,
      }
    )

    const effectSchema = mongooseToEffectSchema(TestSchema)

    // Check that the fields exist in the schema
    expect(effectSchema.fields).toHaveProperty('title')
    expect(effectSchema.fields).toHaveProperty('secret')
    expect(effectSchema.fields).toHaveProperty('_id') // _id is true by default
    expect(effectSchema.fields).not.toHaveProperty('createdAt')
    expect(effectSchema.fields).not.toHaveProperty('updatedAt')
  })
})
