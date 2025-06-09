// will add a launcher to the left sidebar
api.createOrUpdateLauncher({
    id: 'taskmanager',
    type: 'script',
    title: 'New task',
    icon: 'bx-task',
    keyboardShortcut: 'alt+n',
    scriptNoteId: api.currentNote.getRelationValue('createNewTask'),
    isVisible: true
});