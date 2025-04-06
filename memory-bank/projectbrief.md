# MongoDB RAG Project Brief

## Project Overview

This project implements a Retrieval Augmented Generation (RAG) system using MongoDB as the vector database. It provides a robust API for storing, retrieving, and searching semantic embeddings that can be used to enhance LLM responses with relevant context.

## Core Objectives

- Create a type-safe MongoDB implementation for vector embeddings
- Provide efficient semantic search using MongoDB's vector search capabilities
- Support categorization, metadata, and expiration for memory management
- Enable user, agent, and session-based memory contexts

## Key Features

- Vector embeddings storage and retrieval using MongoDB Atlas
- Semantic similarity search with customizable filters
- Support for message-based and string-based memory storage
- Automatic creation and management of vector indexes
- Rich filtering options including metadata, categories, and time-based filters
- Expiration dates for temporary memories
- Comprehensive type definitions and interfaces
- Support for batch operations (update, delete)

## Technical Requirements

- MongoDB Atlas with vector search capabilities
- OpenAI API for generating embeddings
- TypeScript for type safety
- Mongoose for MongoDB schema management
- Testing support with proper isolation and cleanup

## Target Use Cases

- Long-term memory for AI agents and applications
- Short-term context storage for chat sessions
- Semantic search across knowledge bases
- Memory management with categorization and metadata
- Hierarchical memory structures with user/agent/session contexts

## Success Criteria

- Type-safe implementation with proper error handling
- Efficient vector search with MongoDB
- Comprehensive test coverage
- Reliable index creation and management
- Clean API that follows the Mem0 API patterns
