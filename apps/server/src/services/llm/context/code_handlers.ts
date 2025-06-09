/**
 * Helper functions for processing code notes, including language detection and structure extraction
 */

// Import highlight.js dynamically when needed
let hljs: object | null = null;

/**
 * Attempt to detect the programming language from code content or note attributes
 */
export function detectLanguage(content: string, mime: string): string {
    // First check MIME type for hints
    if (mime) {
        const mimeLower = mime.toLowerCase();

        // Map of mime types to language names
        const mimeMap: {[key: string]: string} = {
            'text/javascript': 'javascript',
            'application/javascript': 'javascript',
            'text/typescript': 'typescript',
            'application/typescript': 'typescript',
            'text/x-python': 'python',
            'text/x-java': 'java',
            'text/x-c': 'c',
            'text/x-c++': 'cpp',
            'text/x-csharp': 'csharp',
            'text/x-go': 'go',
            'text/x-ruby': 'ruby',
            'text/x-php': 'php',
            'text/x-rust': 'rust',
            'text/x-swift': 'swift',
            'text/x-kotlin': 'kotlin',
            'text/x-scala': 'scala',
            'text/x-perl': 'perl',
            'text/x-lua': 'lua',
            'text/x-r': 'r',
            'text/x-dart': 'dart',
            'text/html': 'html',
            'text/css': 'css',
            'application/json': 'json',
            'application/xml': 'xml',
            'text/markdown': 'markdown',
            'text/yaml': 'yaml',
            'text/x-sql': 'sql'
        };

        if (mimeMap[mimeLower]) {
            return mimeMap[mimeLower];
        }
    }

    // Fallback to regex-based detection if highlight.js is not available or fails
    // Check for common language patterns in the first few lines
    const firstLines = content.split('\n').slice(0, 10).join('\n');

    // Simple heuristics for common languages
    if (firstLines.includes('<?php')) return 'php';
    if (firstLines.includes('#!/usr/bin/python') || firstLines.includes('import ') && firstLines.includes('def ')) return 'python';
    if (firstLines.includes('#!/bin/bash') || firstLines.includes('#!/usr/bin/bash')) return 'bash';
    if (firstLines.includes('#!/usr/bin/perl')) return 'perl';
    if (firstLines.includes('#!/usr/bin/ruby')) return 'ruby';
    if (firstLines.includes('package ') && firstLines.includes('import ') && firstLines.includes('public class ')) return 'java';
    if (firstLines.includes('using System;') && firstLines.includes('namespace ')) return 'csharp';
    if (firstLines.includes('package main') && firstLines.includes('import (') && firstLines.includes('func ')) return 'go';
    if (firstLines.includes('#include <') && (firstLines.includes('int main(') || firstLines.includes('void main('))) {
        if (firstLines.includes('std::')) return 'cpp';
        return 'c';
    }
    if (firstLines.includes('fn main()') && firstLines.includes('let ') && firstLines.includes('impl ')) return 'rust';
    if (firstLines.includes('<!DOCTYPE html>') || firstLines.includes('<html>')) return 'html';
    if (firstLines.includes('function ') && firstLines.includes('var ') && firstLines.includes('const ')) return 'javascript';
    if (firstLines.includes('interface ') && firstLines.includes('export class ')) return 'typescript';
    if (firstLines.includes('@Component') || firstLines.includes('import { Component }')) return 'typescript';

    // Default to 'text' if language can't be determined
    return 'text';
}

/**
 * Extract structure from code to create a summary
 */
export function extractCodeStructure(content: string, language: string): string {
    // Avoid processing very large code files
    if (content.length > 100000) {
        return "Code content too large for structure extraction";
    }

    let structure = "";

    try {
        switch (language.toLowerCase()) {
            case 'javascript':
            case 'typescript':
                structure = extractJsStructure(content);
                break;

            case 'python':
                structure = extractPythonStructure(content);
                break;

            case 'java':
            case 'csharp':
            case 'cpp':
                structure = extractClassBasedStructure(content);
                break;

            case 'go':
                structure = extractGoStructure(content);
                break;

            case 'rust':
                structure = extractRustStructure(content);
                break;

            case 'html':
                structure = extractHtmlStructure(content);
                break;

            default:
                // For other languages, just return a summary of the file size and a few lines
                const lines = content.split('\n');
                structure = `Code file with ${lines.length} lines.\n`;

                // Add first few non-empty lines that aren't comments
                const firstCodeLines = lines.filter(line =>
                    line.trim() !== '' &&
                    !line.trim().startsWith('//') &&
                    !line.trim().startsWith('#') &&
                    !line.trim().startsWith('*') &&
                    !line.trim().startsWith('<!--')
                ).slice(0, 5);

                if (firstCodeLines.length > 0) {
                    structure += "First few code lines:\n" + firstCodeLines.join('\n');
                }
        }
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        return `Error extracting code structure: ${errorMessage}`;
    }

    return structure;
}

/**
 * Extract structure from JavaScript/TypeScript code
 */
function extractJsStructure(content: string): string {
    const lines = content.split('\n');
    let structure = "";

    // Look for imports/requires
    const imports = lines.filter(line =>
        line.trim().startsWith('import ') ||
        line.includes('require(')
    ).slice(0, 10);

    if (imports.length > 0) {
        structure += "Imports:\n" + imports.join('\n') + '\n\n';
    }

    // Look for class declarations
    const classes: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('class ') || line.includes(' class ')) {
            classes.push(line);
        }
    }

    if (classes.length > 0) {
        structure += "Classes:\n" + classes.join('\n') + '\n\n';
    }

    // Look for function declarations
    const functions: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('function ') ||
            line.match(/^(const|let|var)\s+\w+\s*=\s*function/) ||
            line.match(/^(const|let|var)\s+\w+\s*=\s*\(/)) {
            functions.push(line);
        }
    }

    if (functions.length > 0) {
        structure += "Functions:\n" + functions.slice(0, 15).join('\n');
        if (functions.length > 15) {
            structure += `\n... and ${functions.length - 15} more functions`;
        }
        structure += '\n\n';
    }

    return structure;
}

/**
 * Extract structure from Python code
 */
function extractPythonStructure(content: string): string {
    const lines = content.split('\n');
    let structure = "";

    // Look for imports
    const imports = lines.filter(line =>
        line.trim().startsWith('import ') ||
        line.trim().startsWith('from ')
    ).slice(0, 10);

    if (imports.length > 0) {
        structure += "Imports:\n" + imports.join('\n') + '\n\n';
    }

    // Look for class declarations
    const classes: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('class ')) {
            classes.push(line);
        }
    }

    if (classes.length > 0) {
        structure += "Classes:\n" + classes.join('\n') + '\n\n';
    }

    // Look for function declarations
    const functions: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('def ')) {
            functions.push(line);
        }
    }

    if (functions.length > 0) {
        structure += "Functions:\n" + functions.slice(0, 15).join('\n');
        if (functions.length > 15) {
            structure += `\n... and ${functions.length - 15} more functions`;
        }
        structure += '\n\n';
    }

    return structure;
}

/**
 * Extract structure from class-based languages like Java, C#, C++
 */
function extractClassBasedStructure(content: string): string {
    const lines = content.split('\n');
    let structure = "";

    // Look for package/namespace declarations
    const packageLines = lines.filter(line =>
        line.trim().startsWith('package ') ||
        line.trim().startsWith('namespace ') ||
        line.trim().startsWith('using ')
    ).slice(0, 5);

    if (packageLines.length > 0) {
        structure += "Package/Imports:\n" + packageLines.join('\n') + '\n\n';
    }

    // Look for class declarations
    const classes: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.match(/^(public|private|protected)?\s*(class|interface|enum)\s+\w+/)) {
            classes.push(line);
        }
    }

    if (classes.length > 0) {
        structure += "Classes/Interfaces:\n" + classes.join('\n') + '\n\n';
    }

    // Look for method declarations
    const methods: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.match(/^(public|private|protected)?\s*(static)?\s*[\w<>[\]]+\s+\w+\s*\(/)) {
            methods.push(line);
        }
    }

    if (methods.length > 0) {
        structure += "Methods:\n" + methods.slice(0, 15).join('\n');
        if (methods.length > 15) {
            structure += `\n... and ${methods.length - 15} more methods`;
        }
        structure += '\n\n';
    }

    return structure;
}

/**
 * Extract structure from Go code
 */
function extractGoStructure(content: string): string {
    const lines = content.split('\n');
    let structure = "";

    // Look for package declarations
    const packageLines = lines.filter(line => line.trim().startsWith('package ')).slice(0, 1);

    if (packageLines.length > 0) {
        structure += "Package:\n" + packageLines.join('\n') + '\n\n';
    }

    // Look for imports
    const importStart = lines.findIndex(line => line.trim() === 'import (');
    if (importStart !== -1) {
        let importEnd = lines.findIndex((line, i) => i > importStart && line.trim() === ')');
        if (importEnd !== -1) {
            structure += "Imports:\n" + lines.slice(importStart, importEnd + 1).join('\n') + '\n\n';
        }
    }

    // Look for type declarations (structs, interfaces)
    const types: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('type ') && (line.includes(' struct ') || line.includes(' interface '))) {
            types.push(line);
        }
    }

    if (types.length > 0) {
        structure += "Types:\n" + types.join('\n') + '\n\n';
    }

    // Look for function declarations
    const functions: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('func ')) {
            functions.push(line);
        }
    }

    if (functions.length > 0) {
        structure += "Functions:\n" + functions.slice(0, 15).join('\n');
        if (functions.length > 15) {
            structure += `\n... and ${functions.length - 15} more functions`;
        }
        structure += '\n\n';
    }

    return structure;
}

/**
 * Extract structure from Rust code
 */
function extractRustStructure(content: string): string {
    const lines = content.split('\n');
    let structure = "";

    // Look for module declarations
    const moduleLines = lines.filter(line => line.trim().startsWith('mod ') || line.trim().startsWith('use ')).slice(0, 10);

    if (moduleLines.length > 0) {
        structure += "Modules/Imports:\n" + moduleLines.join('\n') + '\n\n';
    }

    // Look for struct/enum/trait declarations
    const types: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('struct ') || line.startsWith('enum ') || line.startsWith('trait ')) {
            types.push(line);
        }
    }

    if (types.length > 0) {
        structure += "Types:\n" + types.join('\n') + '\n\n';
    }

    // Look for function/impl declarations
    const functions: string[] = [];
    const impls: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('fn ')) {
            functions.push(line);
        }
        if (line.startsWith('impl ')) {
            impls.push(line);
        }
    }

    if (impls.length > 0) {
        structure += "Implementations:\n" + impls.join('\n') + '\n\n';
    }

    if (functions.length > 0) {
        structure += "Functions:\n" + functions.slice(0, 15).join('\n');
        if (functions.length > 15) {
            structure += `\n... and ${functions.length - 15} more functions`;
        }
        structure += '\n\n';
    }

    return structure;
}

/**
 * Extract structure from HTML
 */
function extractHtmlStructure(content: string): string {
    const lines = content.split('\n');

    // Extract title
    const titleMatch = content.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "No title";

    // Count main elements
    const headings = content.match(/<h[1-6].*?>.*?<\/h[1-6]>/gi) || [];
    const divs = content.match(/<div.*?>/gi) || [];
    const scripts = content.match(/<script.*?>.*?<\/script>/gis) || [];
    const links = content.match(/<a.*?>.*?<\/a>/gi) || [];
    const images = content.match(/<img.*?>/gi) || [];

    // Extract some key elements
    const structure = `HTML Document: "${title}"
Document structure:
- Contains ${headings.length} headings
- Contains ${divs.length} div elements
- Contains ${scripts.length} script blocks
- Contains ${links.length} links
- Contains ${images.length} images
`;

    return structure;
}
