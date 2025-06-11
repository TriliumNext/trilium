/* eslint-disable no-console */

// const data = `<figure class="image"><img src="api/images/rU1cVNuH33Qg/image.png"></figure><p><a href="https://github.com/zadam/trilium">Trilium&nbsp;</a> really does rock! Don't believe me? Well this entire website was made using the shared notes feature inside Trilium with a little bit of extra CSS and JS also contained in Trilium.</p><figure class="image"><img src="api/images/hqhAFecLJzEK/image.png"></figure><p>It turns Trilium into an insanely powerful WYSIWYG website creator. But that's just a side feature of Trilium, it's so much more powerful with endless possibilities.</p><h2>Why It Rocks</h2><p>If somehow you aren't already convinced, take a look below for even more reasons why Trilium rocks!</p><h3>Built-in Features</h3><p>This section is shamelessly borrowed from Trilium's README.</p><ul style="list-style-type:disc;"><li>Notes can be arranged into arbitrarily deep tree. Single note can be placed into multiple places in the tree (see <a href="https://github.com/zadam/trilium/wiki/Cloning-notes">cloning</a>)</li><li>Rich WYSIWYG note editing including e.g. tables, images and <a href="https://github.com/zadam/trilium/wiki/Text-notes#math-support">math</a> with markdown <a href="https://github.com/zadam/trilium/wiki/Text-notes#autoformat">autoformat</a></li><li>Support for editing <a href="https://github.com/zadam/trilium/wiki/Code-notes">notes with source code</a>, including syntax highlighting</li><li>Fast and easy <a href="https://github.com/zadam/trilium/wiki/Note-navigation">navigation between notes</a>, full text search and <a href="https://github.com/zadam/trilium/wiki/Note-hoisting">note hoisting</a></li><li>Seamless <a href="https://github.com/zadam/trilium/wiki/Note-revisions">note versioning</a></li><li>Note <a href="https://github.com/zadam/trilium/wiki/Attributes">attributes</a> can be used for note organization, querying and advanced <a href="https://github.com/zadam/trilium/wiki/Scripts">scripting</a></li><li><a href="https://github.com/zadam/trilium/wiki/Synchronization">Synchronization</a> with self-hosted sync server<ul><li>there's a <a href="https://trilium.cc/paid-hosting">3rd party service for hosting synchronisation server</a></li></ul></li><li><a href="https://github.com/zadam/trilium/wiki/Sharing">Sharing</a> (publishing) notes to public internet</li><li>Strong <a href="https://github.com/zadam/trilium/wiki/Protected-notes">note encryption</a> with per-note granularity</li><li>Sketching diagrams with built-in Excalidraw (note type "canvas")</li><li><a href="https://github.com/zadam/trilium/wiki/Relation-map">Relation maps</a> and <a href="https://github.com/zadam/trilium/wiki/Link-map">link maps</a> for visualizing notes and their relations</li><li><a href="https://github.com/zadam/trilium/wiki/Scripts">Scripting</a> - see <a href="https://github.com/zadam/trilium/wiki/Advanced-showcases">Advanced showcases</a></li><li><a href="https://github.com/zadam/trilium/wiki/ETAPI">REST API</a> for automation</li><li>Scales well in both usability and performance upwards of 100 000 notes</li><li>Touch optimized <a href="https://github.com/zadam/trilium/wiki/Mobile-frontend">mobile frontend</a> for smartphones and tablets</li><li><a href="https://github.com/zadam/trilium/wiki/Themes">Night theme</a></li><li><a href="https://github.com/zadam/trilium/wiki/Evernote-import">Evernote</a> and <a href="https://github.com/zadam/trilium/wiki/Markdown">Markdown import &amp; export</a></li><li><a href="https://github.com/zadam/trilium/wiki/Web-clipper">Web Clipper</a> for easy saving of web content</li></ul><h3>Community Addons</h3><p><a href="https://github.com/Nriver">Nriver </a>maintains an awesome list of addons for Trilium made by the community. Check out the <a href="https://github.com/Nriver/awesome-trilium">official list on GitHub</a>. We do mirror the list here on the <a href="#root/WqBnya4Ye8rS/lMLmqcrPVHvE">Showcase</a> page if you just want a quick look.</p><h3>Custom Scripts</h3><p>In addition to using community made scripts, widgets, themes, and everything in between, Trilium leaves things open-ended for you the end-user. You can script as much or as little as you like inside Trilium. You can automate all kinds of workflows, do data analysis, or even simple things like set a keybind to open a specific note. The world is your oyster as they say, and Trilium is your world. Pretend that made sense.</p><p>&nbsp;</p><h2>About This Site</h2><p>This website is not at all affiliated with Trilium Notes or its creator(s). The site is broken up into a few main sections that you can see in the navigation bar at the top of the page. At a high level, there's two sections targeting end-users, two sections targeting developers, and one meant for everyone.</p><h3>Status</h3><p>This site is still a work-in-progress! Writing documentation isn't the most fun thing in the world so this will just be something I work on when I have free time. You'll usually find me working on one of my Trilium-related addons, Trilium itself, or my other open-source project: <a href="https://betterdiscord.app">BetterDiscord</a>.</p><h3>Goals</h3><p>Rather than saying some specific goals of what this site strives to be, I'll say what it strives <i>not </i>to be; This site is not meant to be a complete recreation of the Wiki with every detail and page included. It <i>is</i> meant to be a (mostly) one-stop shop for users and developers alike looking to supplement their knowledge. It may at some point expand and include everything from the wiki because users tend to prefer a fancier UI like this, but it is not the end-goal.</p><h3>Contributing</h3><p>Since this entire site is just a share from my personal Trilium instance, there is no easy way to contribute new pages or fixes for typos. At some point I will create a GitHub repository for this site's supplementary CSS and JS, and that repository can also act as a home for issues and discussion. But who knows, maybe within that time frame I'll think of some clever way to introduce contributions.</p><p>&nbsp;</p>`;
const data = `<h2>Frontend API</h2><p>The frontend api supports two styles, regular scripts that are run with the current app and note context, and widgets that export an object to Trilium to be used in the UI. In both cases, the frontend api of Trilium is available to scripts running in the frontend context as global variable <code>api</code>. The members and methods of the api can be seen on the <a href="https://zadam.github.io/trilium/frontend_api/FrontendScriptApi.html">FrontendScriptApi </a>page.</p><h3>Scripts</h3><p>Scripts don't have any special requirements. They can be run at will using the execute button in the UI or they can be configured to run at certain times using <a href="https://github.com/zadam/trilium/wiki/Attributes">Attributes</a> on the note containing the script.</p><h4>Global Events</h4><p>This attribute is called <code>#run</code> and it can have any of the following values:</p><ul><li><code>frontendStartup</code> - executes on frontend upon startup.</li><li><code>mobileStartup</code> - executes on mobile frontend upon startup.</li><li><code>backendStartup</code> - executes on backend upon startup.</li><li><code>hourly</code> - executes once an hour on backend.</li><li><code>daily</code> - executes once a day on backend.</li></ul><h4>Entity Events</h4><p>These events are triggered by certain <a href="https://github.com/zadam/trilium/wiki/Attributes#relations">relations</a> to other notes. Meaning that the script is triggered only if the note has this script attached to it through relations (or it can inherit it).</p><ul><li><code>runOnNoteCreation</code> - executes when note is created on backend.</li><li><code>runOnNoteTitleChange</code> - executes when note title is changed (includes note creation as well).</li><li><code>runOnNoteContentChange</code> - executes when note content is changed (includes note creation as well).</li><li><code>runOnNoteChange</code> - executes when note is changed (includes note creation as well).</li><li><code>runOnNoteDeletion</code> - executes when note is being deleted.</li><li><code>runOnBranchCreation</code> - executes when a branch is created. Branch is a link between parent note and child note and is created e.g. when cloning or moving note.</li><li><code>runOnBranchDeletion</code> - executes when a branch is delete. Branch is a link between parent note and child note and is deleted e.g. when moving note (old branch/link is deleted).</li><li><code>runOnChildNoteCreation</code> - executes when new note is created under this note.</li><li><code>runOnAttributeCreation</code> - executes when new attribute is created under this note.</li><li><code>runOnAttributeChange</code> - executes when attribute is changed under this note.</li></ul><h3>Widgets</h3><p>Conversely to scripts, widgets do have some specific requirements in order to work. A widget must:</p><ul><li>Extend <a href="https://zadam.github.io/trilium/frontend_api/BasicWidget.html">BasicWidget </a>or one of it's subclasses.</li><li>Create a new instance and assign it to <code>module.exports</code>.</li><li>Define a <code>parentWidget</code> member to determine where it should be displayed.</li><li>Define a <code>position</code> (integer) that determines the location via sort order.</li><li>Have a <code>#widget</code> attribute on the containing note.</li><li>Create, render, and return your element in the render function.<ul><li>For <a href="https://zadam.github.io/trilium/frontend_api/BasicWidget.html">BasicWidget </a>and <a href="https://zadam.github.io/trilium/frontend_api/NoteContextAwareWidget.html">NoteContextAwareWidget</a> you should create <code>this.$widget</code> and render it in <code>doRender()</code>.</li><li>For <a href="https://zadam.github.io/trilium/frontend_api/RightPanelWidget.html">RightPanelWidget </a>the <code>this.$widget</code> and <code>doRender()</code> are already handled and you should instead return the value in <code>doRenderBody()</code>.</li></ul></li></ul><h4>parentWidget</h4><ul><li><code>left-pane</code> - This renders the widget on the left side of the screen where the note tree lives.</li><li><code>center-pane</code> - This renders the widget in the center of the layout in the same location that notes and splits appear.</li><li><code>note-detail-pane</code> - This renders the widget <i>with</i> the note in the center pane. This means it can appear multiple times with splits.</li><li><code>right-pane</code> - This renders the widget to the right of any opened notes.</li></ul><h4>Tutorial</h4><p>For more information on building widgets, take a look at <a href="#root/WqBnya4Ye8rS/wmgYY4gYKq69/MLpHDpX0NhDg/X7pxYpiu0lgU">Widget Basics</a>.</p>`;
const headingRe = /(<h[1-6]>)(.+?)(<\/h[1-6]>)/g;


// const slugify = (text: string) => text.toLowerCase().replace(/[^\w]/g, "-");
// const modified = data2.replaceAll(headingRe, (...match: RegExpMatchArray) => {
//     match[0] = match[0].replace(match[3], `<a id="${slugify(match[2])}" class="toc-anchor" name="${slugify(match[2])}" href="#${slugify(match[2])}">#</a>${match[3]}`);
//     return match[0];
// });

// console.log(modified);


const headingMatches = [...data.matchAll(headingRe)];

interface ToCEntry {
    level: number;
    name: string;
    children: ToCEntry[];
}

const level = (m: RegExpMatchArray) => parseInt(m[1].replace(/[<h>]+/g, ""));

const toc: ToCEntry[] = [
    {
        level: level(headingMatches[0]),
        name: headingMatches[0][2],
        children: []
    }
];
const last = (arr = toc) => arr[arr.length - 1];
const makeEntry = (m: RegExpMatchArray): ToCEntry => ({level: level(m), name: m[2], children: []});

const getLevelArr = (lvl: number, arr = toc): ToCEntry[] => {
    if (arr[0].level === lvl) return arr;
    const top = last(arr);
    return top.children.length ? getLevelArr(lvl, top.children) : top.children;
};


for (let m = 1; m < headingMatches.length; m++) {
    const target = getLevelArr(level(headingMatches[m]));
    target.push(makeEntry(headingMatches[m]));
}

console.log(JSON.stringify(toc, null, 4));

// const end = (arr = toc): ToCEntry => {
//     const top = last(arr);
//     return top.children.length ? end(top.children) : top;
// };
// console.log(end());

// const previousEntry = last();
// if (previousEntry.level === cLvl) {
//     toc.push(makeEntry(current));
// }
// else if (previousEntry.level === cLvl - 1) {
//     previousEntry.children.push(makeEntry(current));
// }
// else if (previousEntry.level < cLvl) {
//     const target = findParentEntry(previous[2]) ?? end();
//     // console.log(previous[2], target, current[2]);
//     const plvl = level(previous);
//     if (plvl === cLvl) {
//         target.children.push(makeEntry(current));
//     }
//     else if (plvl === cLvl - 1) {
//         const subitem = target.children.find(e => e.name === previous[2])!;
//         subitem.children.push(makeEntry(current));
//     }
// }
// else if (previousEntry.level > cLvl) {
//     toc.push(makeEntry(current));
// }