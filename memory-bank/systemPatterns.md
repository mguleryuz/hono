# System Patterns

## Architecture Overview

The MongoDB RAG system follows a layered architecture pattern:

1. **Data Layer**:

   - MongoDB Atlas for vector storage
   - Mongoose for schema and model management

2. **Service Layer**:

   - `MongoRagClient` as the main interface
   - OpenAI for embedding generation

3. **Interface Layer**:
   - Type-safe methods for memory operations
   - Search and retrieval with filtering

## Core Components

### Embedding Model

- Provides the schema and document structure
- Implements vector search functionality
- Handles MongoDB aggregation pipelines

```
EmbeddingSchema
  ↓
EmbeddingModel
  ↓
IEmbeddingDocument (interface)
```

### Client Interface

- Manages connections to MongoDB and OpenAI
- Provides vector search capabilities
- Handles memory operations (add, get, search, update, delete)

```
MongoRagClient
  ↓
OpenAI API ←→ MongoDB Connection
```

## Key Design Patterns

### Repository Pattern

The client acts as a repository for memory operations, abstracting database details.

### Adapter Pattern

Converts between internal document format and external API responses.

### Strategy Pattern

Uses different strategies for searching, filtering, and processing based on input parameters.

### Factory Method

Creates appropriate MongoDB query structures based on provided filters.

## Operational Flows

### Memory Creation Flow

1. Extract content from messages or use provided string
2. Generate embedding using OpenAI
3. Create document with content, embedding, and metadata
4. Store in MongoDB with appropriate indexes

### Memory Retrieval Flow

1. Process query parameters
2. Build MongoDB query with appropriate filters
3. Execute query with pagination
4. Format and return results

### Vector Search Flow

1. Generate embedding for search query
2. Build vector search pipeline with MongoDB's $vectorSearch
3. Apply post-search filtering
4. Order by similarity score
5. Return formatted results

## Type Hierarchy

```
IEmbedding (base interface)
  ↓
IEmbeddingDocument (Mongoose document)
  ↓
IEmbeddingModel (Mongoose model with static methods)
```

## Error Handling Strategy

- Explicit error handling for database operations
- Specific error messages for different failure modes
- Error propagation to API consumers

## Best Practices

- Always use type-safe interfaces
- Provide meaningful error messages
- Use proper indexing for performance
- Handle vector search constraints properly
- Validate inputs before database operations
- Include proper cleanup in test environments
