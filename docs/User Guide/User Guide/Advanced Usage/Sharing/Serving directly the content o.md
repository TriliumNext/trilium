# Serving directly the content of a note
When accessing a shared note, Trilium will render it as a web page. Sometimes it's desirable to serve the content directly so that it can be used in a script or downloaded by the user.

<figure class="table"><table><thead><tr><th>A note displayed as a web page (HTML)</th><th>A note displayed as a raw format</th></tr></thead><tbody><tr><td><figure class="image"><img style="aspect-ratio:738/275;" src="1_Serving directly the conte.png" width="738" height="275"></figure></td><td><img src="Serving directly the conte.png"></td></tr></tbody></table></figure>

## By adding an attribute to the note

Simply add the `#shareRaw` attribute and the note will always be rendered _raw_ when accessed from the share URL.

## By altering the URL

Append `?raw` to the URL to display a note in its raw format regardless of whether the `#shareRaw` attribute is added on the note.

![](Serving%20directly%20the%20conte.png)