# QuickNotes Data Model

This is the relational database design for the online QuickNotes service. It has four tables: `users`, `notes`, `tags` and `note_tags`.

## 1. Entities

**users**: one row per person with an account.

| Column | Type | Key |
|---|---|---|
| id | INTEGER | Primary key |
| name | TEXT | |
| email | TEXT | Unique |
| password_hash | TEXT | |
| created_at | TIMESTAMP | |

**notes**: one row per note.

| Column | Type | Key |
|---|---|---|
| id | INTEGER | Primary key |
| user_id | INTEGER | Foreign key to users(id) |
| title | TEXT | |
| body | TEXT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**tags**: one row per label a user has created.

| Column | Type | Key |
|---|---|---|
| id | INTEGER | Primary key |
| user_id | INTEGER | Foreign key to users(id) |
| name | TEXT | Unique for each user |

**note_tags**: the join table. One row means "this note has this tag".

| Column | Type | Key |
|---|---|---|
| note_id | INTEGER | Foreign key to notes(id), part of the primary key |
| tag_id | INTEGER | Foreign key to tags(id), part of the primary key |

## 2. Relationships

- **One-to-many: users to notes.** One user can write many notes, but each note belongs to exactly one user.
- **One-to-many: users to tags.** One user can create many tags, but each tag belongs to one user.
- **Many-to-many: notes to tags.** One note can have many tags (for example "work" and "urgent"), and one tag can be on many notes.
- **Why a join table is needed.** A table cell can hold only one value, so a note row cannot hold a list of tags, and a tag row cannot hold a list of notes. A comma-separated list would make searching hard and break the one-value-per-cell rule. The `note_tags` table solves this with one row for each note and tag pair, linked by foreign keys. Its primary key (note_id, tag_id) also stops the same tag being added to the same note twice.

## 3. CREATE TABLE statements

    CREATE TABLE users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE notes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      title      TEXT NOT NULL CHECK (length(title) <= 100),
      body       TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE tags (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name    TEXT NOT NULL,
      UNIQUE (user_id, name),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE note_tags (
      note_id INTEGER NOT NULL,
      tag_id  INTEGER NOT NULL,
      PRIMARY KEY (note_id, tag_id),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
    );

## 4. Example queries

All notes for one user, newest first (uses a JOIN):

    SELECT notes.id, notes.title, notes.created_at
    FROM users
    JOIN notes ON notes.user_id = users.id
    WHERE users.email = 'wanjiku@example.com'
    ORDER BY notes.created_at DESC;

All notes that have the tag "study" for user 7 (joins three tables):

    SELECT notes.title
    FROM notes
    JOIN note_tags ON note_tags.note_id = notes.id
    JOIN tags      ON tags.id = note_tags.tag_id
    WHERE tags.name = 'study' AND notes.user_id = 7;

The number of notes for each tag (uses LEFT JOIN and GROUP BY):

    SELECT tags.name, COUNT(note_tags.note_id) AS number_of_notes
    FROM tags
    LEFT JOIN note_tags ON note_tags.tag_id = tags.id
    GROUP BY tags.id, tags.name;

Delete one note, with its tag links removed automatically by the cascade:

    DELETE FROM notes WHERE id = 42 AND user_id = 7;

## 5. Index

    CREATE INDEX idx_notes_user_created ON notes(user_id, created_at);

The most common request is "list this user's notes, newest first". Without an index, the database has to read every row in `notes` to find one user's notes. With an index on `user_id` and `created_at`, it jumps straight to that user's notes, already in date order, like using the index at the back of a book. This matters when the table holds millions of notes.

## 6. SQL or NoSQL?

I would choose SQL. QuickNotes data is structured and full of relationships: users own notes, and notes link to tags. SQL enforces these links with foreign keys, enforces rules such as unique emails and title length, and answers questions across tables with joins. It also protects data with transactions, so a change is either saved completely or not at all. A NoSQL database would be a better fit if the notes had no fixed shape or the data grew beyond what one primary database with read replicas can hold, but neither is true for QuickNotes.