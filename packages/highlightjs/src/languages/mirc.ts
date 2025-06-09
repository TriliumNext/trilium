import type { HLJSApi, Language } from "highlight.js";

/**
  * highlight.js mIRC Scripting Language syntax highlighting definition
  *
  * Source: https://github.com/highlightjs/highlightjs-mirc/blob/master/mirc.js
  *
  * @see https://github.com/isagalaev/highlight.js
  *
  * @package: highlightjs-mirc
  * @author:  Kedyn Macedonio <mkedyn@gmail.com>
  * @author: Sven Roelse <acvxqs@icloud.com>
  */

export default function hljsDefineMIRC(hljs: HLJSApi): Language {
    const COMMENT_DOC = {
        className: 'comment',
        begin: /^\x20*\/\*\*\s+/,
        end: /^\x20*\*\//,
        contains: [
            {
                className: 'doctag',
                begin: /@\w+/
            }
        ]
    };

    const COMMENT_BLOCK = {
        className: 'comment',
        begin: /^\x20*\/\*/,
        end: /^\x20*\*\//
    };

    const COMMENT_LINE = {
        className: 'comment',
        begin: /(^\x20*|}\x20+|\x20+\|\x20+);/,
        end: /(\x20+\|\x20+.+|$)/,
        excludeEnd: true
    };

    const VARIABLES = {
        className: 'variable',
        begin: /%[^\s,\)]+/
    };

    const IDENTIFIERS = [
        {
            className: 'literal',
            begin: /\$\$?(true|false|null)\b/,
        },
        {
            className: 'built_in',
            begin: /\$\$?(\!|0|(?:[1-9](?:\d+)?-?(?:\d+)?|\?\d+)|\+|\?|(?:abook|abs|acos|active(cid|wid)?|adate|address|addtok(cs)?|agent(name|stat|ver)?|alias|and|anick|ansi2mirc|aop|appactive|appstate|asc(time)?|asin|atan2?|auto|avoice|away(msg|time)?|banmask|banlist|base|beta|bfind|bindip|bitoff|biton|bits|bnick|bvar|bytes|calc|caller|cancel|cb|cd|ceil|chan(modes|nel|types)?|chat|chr|cid|clevel|click|cmdbox|cmdline|cnick|color|com(call|chan|char|err|pact|press|val)?|cosh?|count(cs)?|crc?|creq|crlf|ctimer?|ctrlenter|date|day(light)?|dbuh|dbuw|dcc(ignore|port)|dde(name)?|debug|decode|decompress|deltok|devent|dialog|did(reg|tok|wm)?|dir=|disk|dlevel|dll(call)?|dname|dns|dqwindow|duration|ebeeps|editbox|email(addr)?|encode|envvar|error|eval(next)?|event(id|params)?|exist(s|ing)|feof|ferr|fgetc|file(=|name)?|filtered|finddirn?|findfilen?|findtok(cs)?|fline|floor|font|fopen|fread|fromeditbox|fserve|full(address|date|name|screen)|get(dir|dot|tok)?|gmt|group|halted|hash|height|hfile=?|hfind|hget|highlight|hmac|hmatch|hnick|host|hotline(pos)?|hotlink|hotp|hregex|hypot|iaddress|ial(chan)?|ibl|idle|iel|ifmatch2?|ignore|iif|iil|inellipse|ini(topic)?|in(midi|mode|mp3|paste|poly|put|(round)rect|song|stok|t(ersect)?|wave|who)|ip(type)?|iql|is(alias|bit|dde|dir|file|id|lower|tok(cs)?|upper|utf)|key(char|rpt|val)|knick|lactive(cid|wid)?|left(win|wincid|winwid)?|len|level|lf|lines?|link|lock(ed)?|lof|log(10|dir|stamp(fmt)?)?|long(fn|ip)|lower|ltimer|maddress|mask|match(key|tok(cs)?)|maxlen(s|m|l)|md5|menu(bar|context|type)?|me|mid(idir)?|mircdir|mircexe|mircini|mk(log)?fn|mknickfn|mnick|mode(first|last|spl)?|mouse|mp3|msfile|msgstamp|msgtags|naddress|network|newnick|nhnick|nick(mode)?|no(file|path|pnick|qt|tags|tify|t)?|numeric|numtok|nvnick|ok|online(server|total)?|onpoly|opnick|ord?|os|parms|parse(line|type|utf)|passivedcc|pic?|play|pnick|portable|portfree|pos(cs)?|prefix|prop|protect|puttok|qt|query|r(address|ands?)?|raw(bytes|msg)|read(ini|n)?|reg(br|errstr|ex|ml(ex)?|sub(ex)?)|rem(ote|move(cs)?|tok(cs)?)|replace(cs|xcs|x)?|reptok(cs)?|result|rgb|right|rnick|round|samepath|scid|scon|script(dir([^\s\(),><:"|?*]+)?|line)?|sdir|send|server(ip|target)?|sfile|sha1|sha(256|384|512)|shortfn|show|signal|sinh?|site|sline|snick(s)?|snotify|sock(br|err|name)?|sorttok(cs)?|sound|speak|sqrt|sreq|ssl(certsha1|certsha256)?|ssl((lib)?dll)?|ssl(ready|version)|starting|status|str(ipped|ip)?|style|submenu|switchbar|sysdir|tanh?|target|tempfn|ticks|time(out|stamp(fmt)?r|zone)?|tips?|titlebar|token|toolbar|topic|totp|treebar|trust|ulevel|ulist|unsafe|upper|uptime|url|usermode|utf(de|en)code|v1|v2|var|vc|vcmd(stat|ver)?|version|vnick|vol|wavdir|wid(th)?|wild(site|tok(cs)?)|window|wrap|xor|yes|zip)\b)/
        }
    ];

    const COMMANDS = {
        className: 'built_in',
        begin: /\b(\/)?([!.]{1,2})?(abook|ajinvite|alias|aline|ame|amsg|anick|aop|auser|autojoin|avoice|away|background|ban|bcopy|beep|bindip|bread|breplace|bset|btrunc|bunset|bwrite|channel|clear(all)?|cline|clipboard|close|cnick|color|colour|com(close|list|open|reg)|copy|creq|ctcp(reply|s)?|dcc(server)?|dde(server)?|debug|dec|describe|dialog|did(tok)?|disable|disconnect|dlevel|dline|dll|dns|dqwindow|draw(copy|dot|fill|line|pic|rect|replace|rot|save|scroll|size|text)|ebeeps|echo|editbox|emailaddr|enable|events|exit|fclose|filter|findtext|finger|firewall|flash|flist|flood|flush|flushini|fnord|font|fopen|fseek|fsend|fserve|fullname|fupdate|fwrite|ghide|gload|gmove|gopts|gplay|gpoint|gqreq|groups|gshow|gsize|gstop|gtalk|gunload|guser|hadd|hdec|hdel|help|hfree|hinc|hload|hmake|hop|hotlink|hsave|ial(clear|mark)?|identd|ignore|iline|inc|iuser|join|leave|linesep|links|list|load(buf)?|localinfo|log|logview|mdi|me|menubar|mkdir|mnick|mode|msg|noop|notice|notify|omsg|onotice|parseline|part|partall|pdcc|perform|play|playctrl|pop|privmsg|protect|proxy|pvoice|qme|qmsg|query|queryrn|quit|raw|registration|reload|remini|remote|remove|rename|renwin|reseterror|resetidle|rlevel|rline|rmdir|run|ruser|save(buf|ini)?|say|scid|scon|server|set(layer)?|showmirc|signal|sline|sock(accept|close|list|listen|mark|open|pause|read|rename|udp|write)|sound|speak|splay|sreq|strip|switchbar|timer([^\x20]+)?|timestamp|tips?|titlebar|tnick|tokenize|toolbar|tray|treebar|ulist|unload|unset(all)?|updatenl|url|uwho|var|vc(add|md|rem)|vmsg|vnotice|vol|wall(chops|voices)|window|winhelp|write(ini)?|xyzzy)\b/,
    }

    const ALIAS_DECLARATION = {
        className: 'function',
        begin: /^alias(\x20+-l)?\x20+[^\s]+/,
        returnBegin: true,
        contains: [
            {
                className: 'type',
                begin: /^alias/
            },
            {
                className: 'symbol',
                begin: /\x20+-l/
            },
            {
                className: 'title',
                begin: /\x20+[^\s]+/,
                endsParent: true
            }
        ]
    };

    const DIALOG = {
        className: 'code',
        begin: /^dialog(\x20+-l)?\x20+[^\x20]+\x20+{$/,
        end: /^}$/,
        returnBegin: true,
        contains: [
            {
                className: 'built_in',
                begin: /^dialog(\x20+-l)?\x20+[^\x20]+\x20+/,
                end: /{$/,
                excludeEnd: true,
                returnBegin: true,
                contains: [
                    {
                        className: 'symbol',
                        begin: /\x20+-l/,
                    },
                    {
                        className: 'title',
                        begin: /\x20+[^\x20]+\x20+/,
                        end: /{$/,
                        excludeEnd: true,
                        endsParent: true,
                    }
                ]
            },
            {
                className: 'keyword',
                begin: /^\x20+(title|icon|size|option|text|edit|button|check|radio|box|scroll|list|combo|link|tab|menu|item)\x20+/
            },
            hljs.QUOTE_STRING_MODE,
            hljs.NUMBER_MODE,
            COMMENT_BLOCK,
            COMMENT_LINE,
            VARIABLES,
            IDENTIFIERS[0],
            IDENTIFIERS[1]
        ]
    };

    const MENU = {
        className: 'code',
        begin: /^menu\x20+[^\x20]+\x20*/,
        end: /{/,
        returnBegin: true,
        excludeEnd: true,
        contains: [
            {
                className: 'built_in',
                begin: /^menu\b/,
                end: /\x20+/,
                excludeEnd: true
            },
            {
                className: 'title',
                begin: /[^\s]+\x20*/,
                endsParent: true
            }
        ]
    };

    const GROUPS = {
        className: 'symbol',
        begin: /^#[^\s]+\x20+(on|off|end)$/
    }

    const EVENTS1 = {
        className: 'built_in',
        begin: /^on\x20+(me:)?[^:\x20]+:(action|notice|text):[^:]+:(\?|#[^:]*|\*):/
    };

    const EVENTS2 = {
        className: 'built_in',
        begin: /^on\x20+(me:)?[^:\x20]+:(active|input|tabcomp):(\*|#[^:]*|\?|=|!|@[^:]*):/
    };


    const EVENTS3 = {
        className: 'built_in',
        begin: /^on\x20+(me:)?[^:\x20]+:(agent|appactive|(dis)?connect(fail)?|dns|exit|(un)?load|(midi|mp3|play|wave)end|nick|nosound|u?notify|ping|pong|quit|start|usermode):/
    };

    const EVENTS4 = {
        className: 'built_in',
        begin: /^on\x20+(me:)?[^:\x20]+:((un)?ban|(de)?help|(de|server)?op|(de)?owner|(de)?voice|invite|join|kick|(server)?mode|part|rawmode|topic):(?:\*|#[^:]*):/
    };

    const EVENTS5 = {
        className: 'built_in',
        begin: /^on\x20+(me:)?[^:\x20]+:(chat|ctcpreply|error|file(rcvd|sent)|(get|send)fail|logon|serv|signal|snotice|sock(close|listen|open|read|write)|udpread|vcmd|wallops):[^:]+:/
    };

    const EVENTS6 = {
        className: 'built_in',
        begin: /^on\x20+(me:)?[^:\x20]+:close:(\*|\?|=|!|@[^:]*):/
    };

    const EVENTS7 = {
        className: 'built_in',
        begin: /^on\x20+(me:)?[^:\x20]+:dccserver:(chat|send|fserve):/
    };

    const EVENTS8 = {
        className: 'built_in',
        begin: /^on\x20+(me:)?[^:\x20]+:dialog:[^:]+:(init|close|edit|sclick|dclick|menu|scroll|mouse|rclick|drop|\*):[\d\-,\*]+:/
    };

    const EVENTS9 = {
        className: 'built_in',
        begin: /^on\x20+(me:)?[^:\x20]+:hotlink:[^:]+:(?:\*|#[^:]*|\?|=|!|@[^:]*):/
    };

    const EVENTS10 = {
        className: 'built_in',
        begin: /^on\x20+(me:)?[^:\x20]+:key(down|up):(\*|@[^:]*):(\*|\d+(,\d+)*):/
    };

    const EVENTS11 = {
        className: 'built_in',
        begin: /^on\x20+(me:)?[^:\x20]+:open:(\*|\?|=|!|@[^:]*):[^:]+:/
    };

    const EVENTS12 = {
        className: 'built_in',
        begin: /^on\x20+(me:)?[^:\x20]+:parseline:(\*|in|out):[^:]+:/
    };

    const EVENTS13 = {
        className: 'built_in',
        begin: /^raw\x20+(me:)?[^:\x20]+:[^:]+:/
    };

    const EVENTS14 = {
        className: 'built_in',
        begin: /^ctcp\x20+(me:)?[^:\x20]+:[^:]+:(\*|#.*|\?):/
    };

    return {
        aliases: ['mrc'],
        keywords: 'if elseif else while break continue halt haltdef goto return returnex',
        case_insensitive: true,
        contains: [
            COMMENT_DOC,
            COMMENT_BLOCK,
            COMMENT_LINE,
            hljs.NUMBER_MODE,
            ALIAS_DECLARATION,
            DIALOG,
            MENU,
            GROUPS,
            EVENTS1,
            EVENTS2,
            EVENTS3,
            EVENTS4,
            EVENTS5,
            EVENTS6,
            EVENTS7,
            EVENTS8,
            EVENTS9,
            EVENTS10,
            EVENTS11,
            EVENTS12,
            EVENTS13,
            EVENTS14,
            VARIABLES,
            IDENTIFIERS[0],
            IDENTIFIERS[1],
            COMMANDS
        ]
    };
}
