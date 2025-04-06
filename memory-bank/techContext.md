# Technical Context

## Technology Stack

- **MongoDB Atlas**: Cloud-based MongoDB service with vector search capabilities
- **Mongoose**: Object Data Modeling (ODM) library for MongoDB
- **TypeScript**: For type-safe code development
- **OpenAI API**: For generating text embeddings
- **Bun**: JavaScript runtime and test runner

## Core Dependencies

- **mongoose**: For MongoDB schema management and querying
- **openai**: Official OpenAI API client
- **bun:test**: For writing and running tests

## MongoDB Atlas Setup

- Requires a MongoDB Atlas account with vector search capabilities
- Vector search indexes must be created with appropriate dimensions
- Environment variables needed:
  - `MONGO_URI`: Connection string for MongoDB Atlas
  - `OPENAI_API_KEY`: API key for OpenAI

## Vector Search Configuration

- Uses `mongo_rag_vector_index` as the default index name
- Employs cosine similarity for vector comparisons
- Default dimensionality of 1536 for OpenAI text-embedding-3-small
- Configurable dimensions to support different embedding models

## Embedding Generation

- Uses OpenAI's `text-embedding-3-small` model by default
- Each document stores the full content and its vector embedding
- Additional metadata can be stored for filtering purposes

## Schema Design

- Main schema: `EmbeddingSchema` with the following fields:
  - `content`: The text content of the memory
  - `embedding`: Vector representation (array of numbers)
  - `user_id`, `agent_id`, `run_id`, `app_id`: IDs for filtering
  - `metadata`: Flexible object for additional data
  - `categories`: Array of string categories
  - `expiration_date`: Optional date for auto-expiry
  - `created_at`, `updated_at`: Timestamps

## MongoDB Indexes

- Regular indexes for scalar fields (`user_id`, `agent_id`, etc.)
- Compound indexes for common query patterns
- Vector search index for semantic similarity search
- TTL index for automatic expiration based on `expiration_date`

## Key Technical Challenges

1. **Index Creation Timing**: Ensuring indexes are properly created before use
2. **Vector Search Pipeline**: Organizing aggregation pipelines correctly for MongoDB
3. **Type Safety**: Ensuring proper TypeScript typing throughout the system
4. **Expiration Management**: Handling automatic document expiration

## Development Environment

- Requires MongoDB connection string in environment variables
- OpenAI API key for embedding generation
- Test environment with `NODE_ENV=test` for database cleanup
