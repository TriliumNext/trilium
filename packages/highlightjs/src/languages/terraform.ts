/*
 * highlight.js terraform syntax highlighting definition
 *
 * @see https://github.com/highlightjs/highlight.js
 *
 * :TODO:
 *
 * @package: highlightjs-terraform
 * @author:  Nikos Tsirmirakis <nikos.tsirmirakis@winopsdba.com>
 * @since:   2019-03-20
 *
 * Description: Terraform (HCL) language definition
 * Category: scripting
 */

import type { HLJSApi, Language, Mode } from "highlight.js";

export default function hljsDefineTerraform(hljs: HLJSApi): Language {
    const NUMBERS: Mode = {
        className: 'number',
        begin: '\\b\\d+(\\.\\d+)?',
        relevance: 0
    };
    const STRINGS: Mode = {
        className: 'string',
        begin: '"',
        end: '"',
        contains: [{
            className: 'variable',
            begin: '\\${',
            end: '\\}',
            relevance: 9,
            contains: [{
                className: 'string',
                begin: '"',
                end: '"'
            }, {
                className: 'meta',
                begin: '[A-Za-z_0-9]*' + '\\(',
                end: '\\)',
                contains: [
                    NUMBERS, {
                        className: 'string',
                        begin: '"',
                        end: '"',
                        contains: [{
                            className: 'variable',
                            begin: '\\${',
                            end: '\\}',
                            contains: [{
                                className: 'string',
                                begin: '"',
                                end: '"',
                                contains: [{
                                    className: 'variable',
                                    begin: '\\${',
                                    end: '\\}'
                                }]
                            }, {
                                className: 'meta',
                                begin: '[A-Za-z_0-9]*' + '\\(',
                                end: '\\)'
                            }]
                        }]
                    },
                    'self' as const]
            }]
        }]
    };

    return {
        aliases: ['tf', 'hcl'],
        keywords: {
            keyword: [
                "resource",
                "variable",
                "provider",
                "output",
                "locals",
                "module",
                "data",
                "terraform|10"
            ],
            literal: [
                "false",
                "true",
                "null"
            ]
        },
        contains: [
            hljs.COMMENT('\\#', '$'),
            NUMBERS,
            STRINGS
        ]
    }
}
