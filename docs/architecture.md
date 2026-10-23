# QuickNotes Architecture

This document plans how QuickNotes can serve 1 million users as an online service.

## 1. Requirements

**Functional requirements** (what the system does):
- Users can register and log in.
- Users can create, view, edit and delete notes.
- Users can add tags to notes and filter or search by tag and text.
- Notes are saved online, so they appear on any device.

**Non-functional requirements** (how well it does it):
- **Availability:** the service should be up 99.9% of the time.
- **Speed:** listing notes should take under 200 ms.
- **Scalability:** it must grow from 1 million users by adding servers.
- **Durability:** a saved note must never be lost.
- **Security:** all traffic uses HTTPS, users log in with tokens, and passwords are stored as hashes.

## 2. Assumptions and load estimate

- 1,000,000 registered users, and 20% are active each day, so **200,000 daily active users**.
- Each active user lists their notes 20 times a day and creates 5 notes a day.
- One note is about 1 KB. One day is about 100,000 seconds. Peak traffic is 5 times the average.

**Reads per second:** 200,000 x 20 = 4,000,000 a day, divided by 100,000 = **40 average, 200 peak**.

**Writes per second:** 200,000 x 5 = 1,000,000 a day, divided by 100,000 = **10 average, 50 peak**.

**Storage per year:** 1,000,000 notes x 1 KB = 1 GB a day, x 365 = about **365 GB a year** (roughly double with indexes).

The system is **read-heavy** (4 reads for every write), so we use a cache and a read replica to take the reading load off the primary database.

## 3. Architecture diagram

    Client (browser or phone)
     |
     |-- DNS lookup: api.quicknotes.com --> address of the service
     |
     |-- static files (HTML, CSS, JS) --> CDN
     |
     '-- API requests --> Load balancer
                            |
                            +--> App server 1 --+
                            +--> App server 2 --+--> Cache (Redis)
                            '--> App server 3 --+--> Database primary --> Read replica
                                                '--> Queue --> Worker

Reads go to the cache first, then the read replica. Writes go to the primary database. The worker does background jobs such as updating the search index and sending reminder emails.

## 4. Components

- **DNS:** turns the name api.quicknotes.com into the server's address, so users never need to remember numbers.
- **CDN:** serves the app's static files from servers near the user, so pages load fast and our servers carry less traffic.
- **Load balancer:** spreads requests across the app servers, so no single server is overloaded.
- **App servers:** run the API code and keep no user data in memory (stateless), so we can add more when traffic grows.
- **Cache (Redis):** keeps recently read note lists in fast memory, so the database is not asked the same question again and again.
- **Database (primary):** stores users, notes and tags, and handles every write so the data stays correct.
- **Read replica:** a copy of the primary that answers read queries, so heavy reading does not slow down writes.
- **Queue:** holds background jobs until a worker is free, so slow work does not make the user wait.
- **Worker:** takes jobs from the queue and runs them, such as updating the search index.

## 5. Request flows

**GET /notes (list notes):**
1. The client finds the server through DNS and sends the request over HTTPS with its token.
2. The load balancer passes it to one of the app servers.
3. The app server checks the token to find the user.
4. It looks for that user's note list in the cache. If it is there (a cache hit), it returns it at once.
5. If not (a cache miss), it reads the notes from the read replica.
6. It saves the result in the cache for a short time.
7. It replies with 200 OK and the notes as JSON.

**POST /notes (create a note):**
1. Steps 1 to 3 are the same as above.
2. The app server checks the data: a title is required, with a maximum of 100 characters.
3. It writes the note to the primary database, which gives it an id.
4. It deletes that user's cached note list, so the next read is fresh.
5. It adds a job to the queue to update the search index.
6. It replies at once with 201 Created and the new note.
7. A worker takes the job from the queue and runs it in the background. If it fails, the job is tried again.

## 6. Trade-offs

- **Cache: speed vs fresh data.** Reads are much faster, but cached data can be out of date, so we must delete it whenever a note changes.
- **Read replica: scalability vs consistency.** The replica copies the primary with a small delay (replication lag), so a note just created may not show up on the next read. For a user's own recent writes we can read from the primary.
- **Queue: fast replies vs delayed work.** Users get a reply quickly, but background jobs such as search indexing finish a few seconds later.
- **One primary database: simplicity vs write limit.** One primary keeps data simple and consistent, but all writes go through it. At 50 writes per second at peak this is fine, and we can revisit it if writes grow far beyond that.

## 7. Single points of failure

- **Load balancer:** run two, so if one fails the other takes over.
- **App servers:** we run three, and they are stateless, so if one fails the load balancer stops sending it requests.
- **Database:** if the primary fails, the read replica is promoted to become the new primary, and backups are taken regularly.
- **Cache:** if Redis fails, requests go straight to the database, which is slower but still works, and a standby cache can take over.
- **Queue and worker:** jobs are stored until done, and we run more than one worker.
- **CDN and DNS:** both are run by providers across many locations, so they are not single points of failure.