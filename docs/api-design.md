# QuickNotes API Design

This is the API the backend team should build for the online QuickNotes service. It is a REST API that sends and receives JSON over HTTPS.

## 1. Conventions

- Base URL: `https://api.quicknotes.com`
- Resources are plural nouns (`/notes`, `/tags`). The method says what to do and the URL says what to do it to.
- Every request except login sends the header `Authorization: Bearer <token>`. The server uses the token to find the user and returns only that user's data.
- Request and response bodies are JSON, with the header `Content-Type: application/json`.
- Dates use the ISO 8601 format, for example `2026-10-23T09:15:00Z`.

## 2. Endpoints

| Method | Path | Description | Success status |
|---|---|---|---|
| POST | `/auth/login` | Log in with an email and password and receive a token | 200 OK |
| GET | `/notes` | List the logged-in user's notes. Optional query parameters: `tag`, `search`, `limit` | 200 OK |
| GET | `/notes/{id}` | Get one note | 200 OK |
| POST | `/notes` | Create a new note | 201 Created |
| PATCH | `/notes/{id}` | Change only the fields that are sent | 200 OK |
| DELETE | `/notes/{id}` | Delete a note | 204 No Content |
| GET | `/tags` | List the logged-in user's tags | 200 OK |

Filtering example: `GET /notes?tag=study&search=report` lists only notes tagged "study" whose text contains "report".

## 3. Create a note

Request: `POST /notes` with the header `Authorization: Bearer abc123`

    {
      "title": "Buy milk",
      "body": "2 litres, low fat",
      "tags": ["personal"]
    }

Response: `201 Created`

    {
      "id": 42,
      "title": "Buy milk",
      "body": "2 litres, low fat",
      "tags": ["personal"],
      "createdAt": "2026-10-23T09:15:00Z"
    }

## 4. List notes

Request: `GET /notes?limit=2` with the header `Authorization: Bearer abc123` (no body)

Response: `200 OK`

    {
      "notes": [
        { "id": 42, "title": "Buy milk", "body": "2 litres, low fat", "tags": ["personal"], "createdAt": "2026-10-23T09:15:00Z" },
        { "id": 41, "title": "Revise HTTP", "body": "", "tags": ["study"], "createdAt": "2026-10-22T18:02:00Z" }
      ],
      "total": 2
    }

## 5. Error codes

| Status | Meaning | Example of when it happens |
|---|---|---|
| 400 Bad Request | The request is invalid | `POST /notes` with no title, or a title over 100 characters |
| 401 Unauthorized | The user is not logged in or the token is invalid | A request with no `Authorization` header, or an expired token |
| 403 Forbidden | The user is logged in but not allowed | Trying to delete another user's note |
| 404 Not Found | The item or URL does not exist | `GET /notes/9999` when no note has that id |
| 500 Internal Server Error | Something broke on the server | The database is down while a note is being saved |

Example error body for a 404:

    {
      "error": {
        "code": "NOT_FOUND",
        "message": "Note 9999 does not exist."
      }
    }

Every error uses the same shape, so the client can always read `error.message` and show it to the user.