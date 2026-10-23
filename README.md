# QuickNotes System Design

This project moves QuickNotes from a browser-only app to a plan for a real online service used by 1 million people. It has two parts. First, a small web page that talks to a practice API (JSONPlaceholder) using `fetch`, to load, create and delete notes. Second, three design documents the backend team can build from: the API design, the data model, and the system architecture.

## The API client

The client is made of `index.html`, `api.js` and `style.css`. It can:
- Load 10 notes with GET.
- Create a note with POST, after checking that the title is present and at most 100 characters.
- Delete a note with DELETE.
- Show loading, success, error and empty states, and disable the buttons while a request runs.

Note: JSONPlaceholder is a practice server, so it says "created" and "deleted" but does not really save anything. Notes created here only exist on the page until it is refreshed.

## How to run the API client

1. Clone the repository: `git clone https://github.com/Angela-Paul/quicknotes-system-design.git`
2. Open the `quicknotes-system-design` folder in VS Code.
3. Right-click `index.html` and choose **Open with Live Server** (or click **Go Live**). You can also double-click `index.html` to open it in a browser.
4. Click **Load notes**, then try creating and deleting a note.

## Design documents

- [API design](docs/api-design.md): the REST endpoints, JSON examples and error codes for the real QuickNotes API.
- [Data model](docs/data-model.md): the tables, relationships, SQL, an index, and the choice of SQL.
- [Architecture](docs/architecture.md): requirements, load estimates, the architecture diagram, request flows, trade-offs and single points of failure.

## What I learned

- How a client talks to a server with `fetch`: checking `response.ok` is needed because `fetch` does not throw on a 404 or 500, and one reusable `request()` function keeps the error handling in one place.
- How to design a REST API: use plural nouns and ids in the URL, let the HTTP method say what to do, and return the right status codes (201 for create, 204 for delete, and 400, 401, 403, 404 and 500 for errors).
- Why a many-to-many relationship, such as notes and tags, needs a join table with foreign keys.
- How to estimate load (reads and writes per second, and storage per year) and use it to decide on a cache, a read replica, a queue and a CDN.
- How to work with Git in small steps: one commit for each finished task makes the project history easy to follow.