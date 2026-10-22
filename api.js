// ---------- Settings ----------
const API_URL = "https://jsonplaceholder.typicode.com/posts";

// ---------- Select elements ----------
const loadBtn = document.querySelector("#load-btn");
const statusMessage = document.querySelector("#status");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitBtn = document.querySelector("#submit-btn");
const notesList = document.querySelector("#notes-list");

// ---------- Helpers ----------

// Shows a message. type is "loading", "success" or "error" (it picks the colour)
function setStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = type ? "status-" + type : "";
}

// Turns the buttons on or off while a request is running
function setBusy(isBusy) {
  loadBtn.disabled = isBusy;
  submitBtn.disabled = isBusy;
  for (const button of document.querySelectorAll(".delete-btn")) {
    button.disabled = isBusy;
  }
}

// ---------- The reusable request function ----------
async function request(url, options) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error("Server responded with status " + response.status);
  }

  // Some replies have no body, so read the text first and parse it only if there is some
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  return { status: response.status, data: data };
}

// ---------- GET: load 10 notes ----------
async function getNotes() {
  const result = await request(API_URL + "?_limit=10");
  return result.data;
}

// ---------- Drawing the list ----------
function createNoteItem(note) {
  const item = document.createElement("li");
  item.classList.add("note-card");

  const title = document.createElement("h3");
  title.classList.add("note-title");
  title.textContent = note.title;

  const body = document.createElement("p");
  body.classList.add("note-body");
  body.textContent = note.body;

  item.append(title, body);
  return item;
}

function showEmptyMessage() {
  const message = document.createElement("li");
  message.classList.add("empty-message");
  message.textContent = "No notes to show.";
  notesList.append(message);
}

function renderNotes(notes) {
  notesList.textContent = "";

  if (notes.length === 0) {
    showEmptyMessage();
    return;
  }

  for (const note of notes) {
    notesList.append(createNoteItem(note));
  }
}

// ---------- Load button ----------
async function loadNotes() {
  setStatus("Loading notes...", "loading");
  setBusy(true);

  try {
    const notes = await getNotes();
    renderNotes(notes);
    setStatus("Loaded " + notes.length + " notes from the server.", "success");
  } catch (error) {
    setStatus("Could not load notes. Please try again.", "error");
    console.error("Load failed:", error.message);
  } finally {
    setBusy(false);
  }
}

loadBtn.addEventListener("click", loadNotes);