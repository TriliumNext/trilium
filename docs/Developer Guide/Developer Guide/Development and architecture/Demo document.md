# Demo document
The demo document is an exported .zip that resides in `db/demo.zip`.

During on-boarding, if the user selects that they are a new user then the `demo.zip` is imported into the root note.

## Modifying the document

On a dev server, remove all your existing notes in order to ensure a clean setup. Right click → Import to note and select the .zip file in `db/demo.zip`. Make sure to disable “Safe import”.

After making the necessary modifications, simply export the “Trilium Demo” note as “HTML in ZIP archive” and replace `db/demo.zip` with the newly exported one.

## Testing the changes

```
rm -r data
npm run start-server
```

And then do the on-boarding again.