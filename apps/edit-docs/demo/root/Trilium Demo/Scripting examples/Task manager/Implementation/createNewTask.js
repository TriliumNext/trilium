// creating notes is backend (server) responsibility so we need to pass
// the control there
const taskNoteId = await api.runOnBackend(() => {
    const todoRootNote = api.getNoteWithLabel('taskTodoRoot');
    const resp = api.createTextNote(todoRootNote.noteId, 'new task', '');

    return resp.note.noteId;
});

// wait until the frontend is fully synced with the changes made on the backend above
await api.waitUntilSynced();

// we got an ID of newly created note and we want to immediatelly display it
await api.activateNewNote(taskNoteId);