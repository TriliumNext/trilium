import type { HLJSApi, Language } from "highlight.js";

/*
 * highlight.js Dylan syntax highlighting definition
 *
 * Source: https://github.com/highlightjs/highlightjs-dylan/blob/master/src/dylan.js
 *
 * @see https://github.com/highlightjs/highlight.js
 * @see https://opendylan.org/
 *
 * :TODO:
 *
 * @package: highlightjs-dylan
 * @author:  Peter Hull <peterhull90@gmail.com>
 * @since:   2019-04-08
 *
 * Description: Dylan language definition
 * Category: functional
 */

export default function(hljs: HLJSApi): Language {
  const DYLAN_CORE_WORDS = ["define", "end", "handler", "let", "local", "macro", "otherwise"];
  const DYLAN_BEGIN_WORDS = ["begin", "block", "case", "for", "if", "method",
    "select", "unless", "until", "while"
  ];
  const DYLAN_FUNCTION_WORDS: string[] = [];
  const DYLAN_DEFINE_BODY_WORDS = ["class", "library", "method", "module"];
  const DYLAN_DEFINE_LIST_WORDS = ["constant", "variable", "domain"];
  const DYLAN_RESERVED_WORDS = ([] as string[]).concat(DYLAN_CORE_WORDS,
    DYLAN_BEGIN_WORDS,
    DYLAN_FUNCTION_WORDS,
    DYLAN_DEFINE_BODY_WORDS.map(function(word) {
      return word + '|2';
    }),
    DYLAN_DEFINE_LIST_WORDS
  );
  const DYLAN_HASH_WORDS = ["#t", "#f", "#next", "#rest", "#key", "#all-keys", "#include"];
  const DYLAN_WORD = '[a-z\-+\*/^=#!%$_><@\?~][a-z0-9\-+\*/^=#!%$_><@\?~]*';
  const KEYWORDS = {
    $pattern: DYLAN_WORD,
    literal: DYLAN_HASH_WORDS.join(" "),
    keyword: DYLAN_RESERVED_WORDS.join(" ")
  };
  const DYLAN_CODE = {
    case_insensitive: true,
    className: 'dylan',
    keywords: KEYWORDS,
    contains: [{
      className: 'class',
      begin: '<' + DYLAN_WORD + '>',
      relevance: 0
    },
    {
      className: 'symbol',
      begin: '#' + DYLAN_WORD
    },
    {
      className: 'symbol',
      begin: DYLAN_WORD + ':',
      relevance: 0
    },
    {
      className: 'string',
      begin: '\'\\\\?.',
      end: '\'',
      illegal: '.'
    },
    hljs.C_NUMBER_MODE,
    hljs.QUOTE_STRING_MODE,
    hljs.C_LINE_COMMENT_MODE,
    hljs.C_BLOCK_COMMENT_MODE
    ]
  };

  return DYLAN_CODE;
};
