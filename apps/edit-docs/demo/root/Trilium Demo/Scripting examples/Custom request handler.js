return api.res.send(404);

/**
 * To activate this demo, comment (or remove) the very first line of this code note. 
 * This is deactivated because custom request handler like this one can be a security risk.
 * To test this, execute the following curl request: curl -X POST http://localhost:37740/custom/create-note -H "Content-Type: application/json" -d "{ \"secret\": \"secret-password\", \"title\": \"hello\", \"content\": \"world\" }"
 * (host and port might have to be adjusted based on your setup)
 *
 * See https://github.com/zadam/trilium/wiki/Custom-request-handler for details.
 */

const {req, res} = api;
const {secret, title, content} = req.body;

if (req.method == 'POST' && secret === 'secret-password') {
    // notes must be saved somewhere in the tree hierarchy specified by a parent note. 
    // This is defined by a relation from this code note to the "target" parent note
    // alternetively you can just use constant noteId for simplicity (get that from "Note Info" dialog of the desired parent note)
    const targetParentNoteId = api.currentNote.getRelationValue('targetNote');
    
    const {note} = api.createTextNote(targetParentNoteId, title, content);
    const notePojo = note.getPojo();

    res.status(201).json(notePojo);
}
else {
    res.send(400);
}