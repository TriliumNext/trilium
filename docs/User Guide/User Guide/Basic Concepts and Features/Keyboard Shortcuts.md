# Keyboard Shortcuts
This is supposed to be a complete list of keyboard shortcuts. Note that some of these may work only in certain contexts (e.g. in tree pane or note editor).

It is also possible to configure most keyboard shortcuts in Options -> Keyboard shortcuts. Using `global:` prefix, you can assign a shortcut which will work even without Trilium being in focus (requires app restart to take effect).

## Note navigation

*   <kbd><span>↑</span></kbd>, <kbd><span>↓</span></kbd> - go up/down in the list of notes, <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd><span>↑</span></kbd> and <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd><span>↓</span></kbd>  work also from editor
*   <kbd><span>←</span></kbd>, <kbd><span>→</span></kbd> - collapse/expand node
*   <kbd>Alt</kbd> + <kbd><span>←</span></kbd>, <kbd>Alt</kbd> + <kbd><span>→</span></kbd> - go back / forwards in the history
*   <kbd>Ctrl</kbd> + <kbd>J</kbd> - show ["Jump to" dialog](Navigation/Note%20Navigation.md)
*   <kbd>Ctrl</kbd> + <kbd>.</kbd> - scroll to current note (useful when you scroll away from your note or your focus is currently in the editor)
*   <kbd><span>Backspace</span></kbd> - jumps to parent note
*   <kbd>Alt</kbd> + <kbd>C</kbd> - collapse whole note tree
*   <kbd>Alt</kbd> + <kbd>-</kbd> (alt with minus sign) - collapse subtree (if some subtree takes too much space on tree pane you can collapse it)
*   you can define a [label](../Advanced%20Usage/Attributes.md) `#keyboardShortcut` with e.g. value <kbd>Ctrl</kbd> + <kbd>I</kbd> . Pressing this keyboard combination will then bring you to the note on which it is defined. Note that Trilium must be reloaded/restarted (<kbd>Ctrl</kbd> + <kbd>R</kbd> ) for changes to be in effect.

See demo of some of these features in [note navigation](Navigation/Note%20Navigation.md).

## Tabs

*   <kbd>Ctrl</kbd> + <kbd>🖱 Left click</kbd> - (or middle mouse click) on note link opens note in a new tab

Only in desktop (electron build):

*   <kbd>Ctrl</kbd> + <kbd>T</kbd> - opens empty tab
*   <kbd>Ctrl</kbd> + <kbd>W</kbd> - closes active tab
*   <kbd>Ctrl</kbd> + <kbd>Tab</kbd> - activates next tab
*   <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Tab</kbd> - activates previous tab

## Creating notes

*   `CTRL+O` - creates new note after the current note
*   `CTRL+P` - creates new sub-note into current note
*   `F2` - edit [prefix](Navigation/Note%20Navigation.md) of current note clone

## Moving / cloning notes

*   <kbd>Ctrl</kbd> + <kbd><span>↑</span></kbd> , Ctrl + <kbd><span>↓</span></kbd> - move note up/down in the note list
*   <kbd>Ctrl</kbd> + <kbd><span>←</span></kbd> - move note up in the note tree
*   <kbd>Ctrl</kbd>+<kbd><span>→</span></kbd> - move note down in the note tree
*   <kbd>Shift</kbd>+<kbd><span>↑</span></kbd>, <kbd>Shift</kbd>`+`<kbd><span>↓</span></kbd> - multi-select note above/below
*   <kbd>Ctrl</kbd>+<kbd>A</kbd> - select all notes in the current level
*   <kbd>Shift</kbd>+<kbd>🖱 Left click</kbd> - multi select note which you clicked on
*   <kbd>Ctrl</kbd>+<kbd>C</kbd> - copies current note (or current selection) into clipboard (used for [cloning](Notes/Cloning%20Notes.md)
*   <kbd>Ctrl</kbd>+<kbd>X</kbd> - cuts current (or current selection) note into clipboard (used for moving notes)
*   <kbd>Ctrl</kbd>+<kbd>V</kbd> - pastes note(s) as sub-note into current note (which is either move or clone depending on whether it was copied or cut into clipboard)
*   <kbd>Del</kbd> - delete note / sub-tree

## Editing notes

> [!NOTE]
> For keyboard shortcuts specific to <a class="reference-link" href="../Note%20Types/Text.md">Text</a> notes, refer to <a class="reference-link" href="../Note%20Types/Text/Keyboard%20shortcuts.md">Keyboard shortcuts</a> and <a class="reference-link" href="../Note%20Types/Text/Markdown-like%20formatting.md">Markdown-like formatting</a>.

*   <kbd>Enter</kbd> in tree pane switches from tree pane into note title. Enter from note title switches focus to text editor. <kbd>Ctrl</kbd>+<kbd>.</kbd> switches back from editor to tree pane.
*   <kbd>Ctrl</kbd>+<kbd>.</kbd> - jump away from the editor to tree pane and scroll to current note

## Runtime shortcuts

These are hooked in Electron to be similar to native browser keyboard shortcuts.

*   <kbd>F5</kbd>, <kbd>Ctrl</kbd>\-<kbd>R</kbd> - reloads Trilium front-end
*   <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>I</kbd> - show developer tools
*   <kbd>Ctrl</kbd>+<kbd>F</kbd> - show search dialog
*   <kbd>Ctrl</kbd>+<kbd>-</kbd> - zoom out
*   <kbd>Ctrl</kbd>+<kbd>=</kbd> - zoom in

## Other

*   <kbd>Alt</kbd>+<kbd>O</kbd> - show SQL console (use only if you know what you're doing)
*   <kbd>Alt</kbd>+<kbd>M</kbd> - distraction-free mode - display only note editor, everything else is hidden
*   <kbd>F11</kbd> - toggle full screen
*   <kbd>Ctrl</kbd> + <kbd>S</kbd> - toggle [search](Navigation/Search.md) form in tree pane
*   <kbd>Alt</kbd> +<kbd>A</kbd> - show note [attributes](../Advanced%20Usage/Attributes.md) dialog