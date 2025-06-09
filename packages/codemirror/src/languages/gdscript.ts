/**
 * @module
 *
 * Ported to CodeMirror 6 from https://github.com/RobTheFiveNine/obsidian-gdscript/blob/main/src/main.js
 */

import { simpleMode } from "@codemirror/legacy-modes/mode/simple-mode";

export const gdscript = simpleMode({
    start: [
        { regex: /\b0x[0-9a-f]+\b/i, token: "number" },
        { regex: /\b-?\d+\b/, token: "number" },
        { regex: /#.+/, token: 'comment' },
        { regex: /\s*(@onready|@export)\b/, token: 'keyword' },
        { regex: /\b(?:and|as|assert|await|break|breakpoint|const|continue|elif|else|enum|for|if|in|is|master|mastersync|match|not|null|or|pass|preload|puppet|puppetsync|remote|remotesync|return|self|setget|static|tool|var|while|yield)\b/, token: 'keyword' },
        { regex: /[()\[\]{},]/, token: "meta" },

        // The words following func, class_name and class should be highlighted as attributes,
        // so push onto the definition stack
        { regex: /\b(func|class_name|class|extends|signal)\b/, token: "keyword", push: "definition" },

        { regex: /@?(?:("|')(?:(?!\1)[^\n\\]|\\[\s\S])*\1(?!"|')|"""(?:[^\\]|\\[\s\S])*?""")/, token: "string" },
        { regex: /\$[\w\/]+\b/, token: 'variable' },
        { regex: /\:[\s]*$/, token: 'operator' },
        { regex: /\:[ ]*/, token: 'meta', push: 'var_type' },
        { regex: /\->[ ]*/, token: 'operator', push: 'definition' },
        { regex: /\+|\*|-|\/|:=|>|<|\^|&|\||%|~|=/, token: "operator" },
        { regex: /\b(?:false|true)\b/, token: 'number' },
        { regex: /\b[A-Z][A-Z_\d]*\b/, token: 'operator' },
    ],
    var_type: [
        { regex: /(\w+)/, token: 'attribute', pop: true },
    ],
    definition: [
        { regex: /(\w+)/, token: "attribute", pop: true }
    ]
});
