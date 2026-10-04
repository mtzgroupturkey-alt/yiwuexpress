# Auto-Pilot Vector Memory Migration Guide (pgvector)

## Current Status (Local Dev & Initial Deployment)
The PostgreSQL instance does not require the `vector` extension initially.
The `DecisionMemory.embedding` field in the database is currently mapped as `TEXT` storing serialized JSON numerical arrays (e.g. `[0.0123, -0.0456, ...]`).

## Production Migration to Native pgvector

When deploying to a production PostgreSQL environment (e.g. AWS RDS, Supabase, Neon, or self-hosted PostgreSQL with `pgvector` enabled):

### 1. Enable pgvector Extension
Run via `psql` or superuser migration:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Add Native Vector Column
```sql
ALTER TABLE "decision_memory" ADD COLUMN "embedding_vec" vector(1536);
CREATE INDEX "decision_memory_embedding_vec_idx" ON "decision_memory" USING ivfflat (embedding_vec vector_cosine_ops) WITH (lists = 100);
```

### 3. Backfill Data
Run backfill script to convert JSON string arrays to native vector format:
```sql
UPDATE "decision_memory"
SET "embedding_vec" = embedding::vector
WHERE embedding IS NOT NULL;
```

### 4. Prisma Schema Update
Update `schema.prisma`:
```prisma
model DecisionMemory {
  id           String   @id @default(cuid())
  contextText  String   @db.Text
  embedding    Unsupported("vector(1536)")?
  decision     Json
  outcome      String?
  outcomeScore Float?
  createdAt    DateTime @default(now())

  @@map("decision_memory")
}
```
And re-run `npx prisma generate`.
