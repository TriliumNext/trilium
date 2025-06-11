# TODOs

This doc contains a list of TODOs taken from the code and organized. This _does not_ includes things like upcoming features or fixes.

## Scripts

- Create a logger
- Modify esbuild to allow for a development build to contain debug logs
- Modify custom highlight.js plugin to include highlighting for jQuery global functions
- Either move highlight.js inclusion to template or use a mapping of note IDs to files
- Adjust search to use separate function (clean code)
- Consider never removing the search results from the page and update container instead
- Consolidate theme initialization (DRY)

## Styles

- 

## Templates

- Consider adding highlight.js into the templates instead of scripts
- Find a better way to integrate ts/js to templates (maybe via includes?)

## Other

- Create a logical set of attributes for setting open-graph/twitter metadata
- Consider making book type notes explicitly required for full-link category
    - This lets text type notes still have content but require clicking arrow to expand
- Find a way to better map template to notes and allow for automatically creating new ones