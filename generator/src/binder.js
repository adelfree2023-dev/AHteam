/**
 * ============================================
 * AHteam Generator - Binding Engine
 * ============================================
 * 
 * Replaces {{tokens}} in files with config values
 * 
 * NO LOGIC - Direct substitution only
 * ============================================
 */

import { getValueByPath } from './validator.js';

/**
 * Find all tokens in content
 * Token format: {{path.to.value}}
 */
export function findTokens(content) {
    const tokenRegex = /\{\{([^}]+)\}\}/g;
    const tokens = [];
    let match;

    while ((match = tokenRegex.exec(content)) !== null) {
        tokens.push({
            full: match[0],      // {{branding.colors.primary}}
            path: match[1].trim() // branding.colors.primary
        });
    }

    return tokens;
}

/**
 * Replace all tokens in content with config values
 */
export function bindData(content, config) {
    const tokens = findTokens(content);
    let result = content;
    const unboundTokens = [];

    for (const token of tokens) {
        const value = getValueByPath(config, token.path);

        if (value !== undefined && value !== null) {
            // Handle arrays and objects
            const stringValue = typeof value === 'object'
                ? JSON.stringify(value)
                : String(value);

            result = result.replace(token.full, stringValue);
        } else {
            unboundTokens.push(token.path);
        }
    }

    return {
        content: result,
        unboundTokens
    };
}

/**
 * Process a single file
 */
export function processFile(content, config, filePath) {
    const result = bindData(content, config);

    if (result.unboundTokens.length > 0) {
        console.log(`⚠️  Unbound tokens in ${filePath}:`);
        result.unboundTokens.forEach(t => console.log(`   - {{${t}}}`));
    }

    return result.content;
}

/**
 * Check if file should be processed (text-based)
 */
export function shouldProcessFile(filePath) {
    const textExtensions = [
        '.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx',
        '.json', '.md', '.txt', '.xml', '.svg',
        '.yaml', '.yml', '.env', '.config'
    ];

    const ext = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
    return textExtensions.includes(ext);
}
