# Chronel AI Context

Use this document as the default project context when asking AI questions about Chronel. It is written to help an AI assistant quickly build the right mental model of the app, its architecture, data flow, and current implementation state.

## One-line Summary

Chronel is a productivity app that combines task management, note/file uploads, PDF preview/processing, Clerk-based identity, an Express/Postgres backend, and a separate FastAPI service intended for PDF extraction and future RAG-style workflows.

## Product Intent

Chronel appears to be designed as a personal productivity workspace with:

- task creation, tracking, and filtering
- file/note uploads backed by S3
- note preview for PDFs and images
- automatic PDF text extraction after upload
- a future direction toward chunking, AI processing, and possibly generated music / stress-based assistance

The app is not yet fully production-hardened. Some features are partially wired, some AI-oriented services are placeholders, and auth enforcement on the backend is still loose.

## Current System Topology

Chronel has 3 runtime parts:

1. Frontend: React + Vite app in `src/`
2. Backend API: Express app in `backend/src/`
3. AI service: FastAPI app in `ai-service/`

There is also Docker configuration for local Postgres + pgAdmin, but Docker does not currently orchestrate the frontend/backend/FastAPI services themselves.

## High-Level Flow

### Tasks flow

1. User signs in through Clerk on the frontend.
2. Frontend syncs the Clerk user to the backend database.
3. Frontend fetches tasks from Express using the Clerk user id.
4. Task filtering and overdue logic are mostly handled on the frontend.

### Notes upload flow

1. User uploads a file from the Notes page.
2. Frontend sends multipart form-data to Express.
3. Express uploads the file to S3.
4. Express stores note metadata in Postgres.
5. Express requests FastAPI PDF processing with the presigned file URL.
6. FastAPI downloads the PDF, extracts text with `pdfminer.six`, and returns a simple success/error payload.

Important: the PDF pipeline is not complete yet. Chunks are not persisted, and there is no full retrieval pipeline wired into the UI.

## Frontend Architecture

### Entry and app shell

- `src/main.tsx`: mounts the app and provides Clerk auth
- `src/App.tsx`: main application shell

The frontend wraps the router with:

- `QueryClientProvider`
- `TooltipProvider`
- `TaskProvider`
- toast systems
- a persistent `MusicPlayer`

The app also triggers user syncing very early with `userSyncUser()`.

### Routes

Defined in `src/App.tsx`:

- `/` -> `Index`
- `/login` -> `Login`
- `/dashboard` -> `Dashboard`
- `/notes` -> `Notes`
- `*` -> `NotFound`

### Main pages

#### `src/pages/Dashboard.tsx`

Primary task dashboard. Shows:

- greeting and date
- task stats
- filter tabs
- search
- list of task cards
- add-task modal

It consumes task state from `TaskProvider`.

#### `src/pages/Notes.tsx`

Notes/files view. Shows:

- uploaded files grid
- search
- upload modal
- file viewer modal
- delete actions

It fetches note metadata from the backend and uses signed file URLs for preview.

#### `src/pages/Login.tsx`

Clerk sign-in / sign-up entry point.

### Shared frontend state

#### `src/providers/tasksProvider.tsx`

This is the main task state manager. It owns:

- `tasks`
- `fetchTasks`
- `addTask`
- `updateTask`
- `toggleComplete`
- `deleteTask`
- `loadingTasks`

It uses `import.meta.env.VITE_API_URL` and fetches data from `/api/tasks`.

Notes:

- task fetching depends on the current Clerk user
- updates are reflected optimistically-ish by replacing local state after server responses
- toggle-complete sends `completedAt`, but backend support for that field is incomplete

### Important frontend components

- `src/components/Sidebar.tsx`: app navigation and auth-related shell
- `src/components/AddTaskModal.tsx`: create task form
- `src/components/TaskCard.tsx`: task list item UI
- `src/components/FileUpload.tsx`: note/file upload form
- `src/components/FileViewer.tsx`: preview PDFs/images
- `src/components/MusicPlayer.tsx`: persistent bottom player; appears experimental

### Frontend helper logic

- `src/lib/tasks.ts`: task filtering, stats, overdue logic
- `src/types`: shared TypeScript shapes for frontend state

Important caveat: the task model shape is not perfectly consistent between frontend and backend.

## Backend Architecture

### Entry point

- `backend/src/server.js`

The Express app:

- loads env via `dotenv`
- enables CORS
- enables JSON parsing
- mounts route modules
- runs DB initialization
- starts listening on `PORT`

Mounted route groups:

- `/api/tasks`
- `/api/users`
- `/api/notes`
- `/api/aws`

### Auth posture

Clerk middleware is imported in `backend/src/server.js` but currently commented out. This means the backend is not strongly verifying user identity at request time. Instead, routes mostly trust `clerk_id` or `clerkId` passed from the client.

This is fine for local development, but important context for any future AI recommendations.

### Database connection

- `backend/src/db/index.js`

Uses `pg.Pool` with `DATABASE_URL`.

The connection is SSL-enabled with relaxed certificate verification, which suggests the app is expected to connect to hosted Postgres environments such as Supabase.

## Database Schema

Initialized by:

- `backend/src/models/initDb.js`

### `users`

- internal numeric `id`
- `clerk_id`
- `public_id`
- `name`
- `email`
- `gender`
- `created_at`

### `tasks`

- `id`
- `user_id`
- `title`
- `description`
- `due_date`
- `status`
- `priority`
- `tags`
- `created_at`

### `tags`

Simple tag lookup table.

### `task_tags`

Join table between tasks and tags.

### `user_preferences`

Currently only stores theme-like preferences.

### `notes`

- `id`
- `user_id`
- `title`
- `file_key`
- `file_url`
- `created_at`

### `notes_chunks`

Prepared for AI/PDF chunking:

- `id`
- `note_id`
- `content`
- `chunk_index`
- `page_number`
- `token_count`
- `created_at`

Indexes exist on:

- `notes_chunks(note_id)`
- `notes_chunks(note_id, chunk_index)`

## Backend Routes

### User sync

- file: `backend/src/routes/users.route.js`
- route: `POST /api/users/sync`

Purpose:

- create or update the local `users` row using Clerk identity info

Input:

- `clerkId`
- `name`
- `email`

Behavior:

- upserts the user by `clerk_id`

### Tasks API

- file: `backend/src/routes/tasks.route.js`

Endpoints:

- `GET /api/tasks?clerk_id=...`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `PATCH /api/tasks/:id/status`

Behavior summary:

- fetches tasks for a DB user resolved from Clerk id
- inserts tasks for the resolved user
- updates/deletes tasks by numeric id
- toggles status with a dedicated patch route

Important caveats:

- response field names do not always exactly match frontend expectations
- there is no strong ownership verification beyond looking up by client-provided clerk id
- `completed_at` logic is not fully implemented in the schema

### Notes API

- file: `backend/src/routes/notes.route.js`

Endpoints:

- `POST /api/notes/upload`
- `GET /api/notes?clerk_id=...`
- `GET /api/notes/:id/url?clerk_id=...`
- `DELETE /api/notes/:id`

Upload behavior:

1. validate multipart fields and file presence
2. resolve DB user from Clerk id
3. upload the raw file to S3
4. generate a presigned read URL
5. insert note metadata into Postgres
6. trigger FastAPI PDF processing

List behavior:

- fetch all notes for the user
- refresh presigned URLs on every fetch

Delete behavior:

- delete S3 object
- delete note row

Important caveats:

- this route currently references `axios.post(...)` for FastAPI triggering; if `axios` is not imported in the file, that call will fail at runtime
- S3 credentials are read from env names prefixed with `VITE_`, which is unusual for server-side code

### AWS route

- file: `backend/src/routes/aws.route.js`

This route appears incomplete or inconsistent relative to the rest of the codebase and should be treated as non-authoritative until reviewed.

## AI / FastAPI Service

### Entry point

- `ai-service/main.py`

Mounts the PDF router at:

- `/api/pdf`

### Main implemented route

- file: `ai-service/api/routes/pdf.py`
- route: `POST /api/pdf/process`

Input:

- `file_url`
- `note_id`

Behavior:

1. download PDF bytes from the presigned URL
2. extract text using `pdfminer.six`
3. normalize whitespace
4. detect likely scanned PDFs by low extracted text length
5. return extraction result metadata

Current limitations:

- no chunk persistence
- no embedding generation
- no retrieval layer
- no link back to `notes_chunks`
- no end-user AI query flow yet

### Placeholder / exploratory files

These files exist but are not meaningfully wired into the request path yet:

- `ai-service/services/pdf_service.py`
- `ai-service/services/chunking_service.py`
- `ai-service/services/rag_service.py`
- `ai-service/db/supabase_client.py`
- `ai-service/utils/s3client.py`

Treat them as work-in-progress rather than active production logic.

## External Integrations

### Clerk

Used on the frontend for:

- authentication
- sign-in/sign-up UI
- current user context

Backend verification is currently minimal because Clerk middleware is commented out.

### Postgres / Supabase-style DB

Main app data is stored in Postgres and accessed from Express via `pg`.

There are also Supabase references in the AI service, but those are not central to the live app flow right now.

### AWS S3

Used for:

- note/file storage
- serving private files through presigned URLs

### FastAPI + pdfminer

Used for:

- post-upload PDF text extraction

## Runtime and Dev Setup

### Root scripts

Defined in `package.json`:

- `npm run frontend`: run Vite frontend
- `npm run backend`: run Express backend with nodemon
- `npm run fastapi:setup`: create local Python venv and install AI service requirements
- `npm run fastapi`: run FastAPI from the local venv
- `npm run dev:all`: run frontend, backend, and FastAPI together

### Ports

Expected local dev ports:

- frontend: `8080`
- backend: `5001`
- FastAPI: `8000`
- Docker Postgres: host `5433`
- pgAdmin: `5050`

Important note:

- backend was moved to `5001` to avoid conflicts with another local macOS service using `5000`

## Environment Variables

Important env names used in the codebase:

- `PORT`
- `DATABASE_URL`
- `VITE_API_URL`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `AWS_REGION`
- `AWS_BUCKET_NAME`
- `VITE_AWS_ACCESS_KEY_ID`
- `VITE_AWS_SECRET`
- `SUPABASE_URL`
- `SUPABASE_KEY`

When giving AI instructions, mention names only. Do not include actual secret values.

## Known Inconsistencies and Risks

These are important for any future AI assistance so the model does not make wrong assumptions:

1. Backend auth is not fully enforced.
   Routes mostly trust client-supplied Clerk identifiers.

2. Task shape is inconsistent.
   Some frontend logic expects `due_date`; some backend responses return `dueDate`.

3. Task completion support is partial.
   Frontend sends `completedAt`, but schema and route behavior do not fully support it.

4. AI pipeline is incomplete.
   `notes_chunks` exists, but extraction results are not chunked or written back yet.

5. Music generation is not fully wired.
   `MusicPlayer` appears to call a route that is not implemented in the FastAPI service.

6. Some server-side code appears unfinished or inconsistent.
   `aws.route.js` and parts of the AI service should be treated carefully before extending.

7. Server env naming is inconsistent.
   Some backend AWS credentials use `VITE_*` env names, which is atypical.

## Best Short Prompt to Reuse

If you want to paste a compact context into another AI chat, use this:

```text
This project is Chronel, a productivity app with a React/Vite frontend (`src/`), an Express/Postgres backend (`backend/src/`), and a FastAPI PDF-processing service (`ai-service/`). Frontend auth uses Clerk, but backend Clerk verification is currently weak because middleware is commented out. Main user features are task management and file/note uploads. Tasks are fetched from `/api/tasks` using the Clerk user id. Notes are uploaded through `/api/notes/upload`, stored in S3, saved in Postgres, and then sent to FastAPI `/api/pdf/process` for PDF text extraction using pdfminer. The DB schema is initialized in `backend/src/models/initDb.js` and includes `users`, `tasks`, `notes`, and `notes_chunks`. Important caveats: the AI pipeline is incomplete, task field naming is inconsistent, some routes/files are partially wired, and local backend dev runs on port 5001 while frontend runs on 8080 and FastAPI on 8000.
```

## Best Files for AI to Read First

If an AI assistant needs to inspect code after reading this context, start with:

- `src/App.tsx`
- `src/providers/tasksProvider.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Notes.tsx`
- `src/components/FileUpload.tsx`
- `backend/src/server.js`
- `backend/src/models/initDb.js`
- `backend/src/routes/tasks.route.js`
- `backend/src/routes/users.route.js`
- `backend/src/routes/notes.route.js`
- `ai-service/main.py`
- `ai-service/api/routes/pdf.py`

## How AI Should Approach Changes

When answering future questions about Chronel, an AI assistant should:

- verify whether a feature is actually wired end-to-end before assuming it exists
- distinguish clearly between current behavior and intended future AI behavior
- be careful with frontend/backend field-name mismatches
- treat auth, ownership checks, and secret handling as active areas to improve
- check whether a request belongs in React, Express, or FastAPI before proposing code

