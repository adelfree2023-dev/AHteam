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
    const tokenRegex = /\{\{([\s\S]+?)\}\}/g;
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
 * Find Design Tokens [[group.key]]
 */
export function findDesignTokens(content) {
    const tokenRegex = /\[\[([\s\S]+?)\]\]/g;
    const tokens = [];
    let match;

    while ((match = tokenRegex.exec(content)) !== null) {
        tokens.push({
            full: match[0],
            path: match[1].trim()
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
 * Bind Design Tokens [[group.key]] from config._tokens
 */
export function bindDesignTokens(content, tokens, config) {
    if (!tokens) return content;
    const dTokens = findDesignTokens(content);
    let result = content;

    for (const token of dTokens) {
        let value;
        const parts = token.path.split('.');

        // 1. Try Design Tokens
        if (parts.length === 2) {
            const [group, key] = parts;
            value = tokens[group]?.[key];
        }

        // 2. Fallback to Config Data (if not found in design tokens)
        if (value === undefined || value === null) {
            value = getValueByPath(config, token.path);
        }

        if (value !== undefined && value !== null) {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            result = result.replace(new RegExp(token.full.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), stringValue);
        }
    }

    return result;
}

/**
 * Process a single file
 */
export function processFile(content, config, filePath) {
    let result = content;

    // 1. Process Loops: {{#each path}} ... {{/each}}
    const loopRegex = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    result = result.replace(loopRegex, (match, path, template) => {
        const list = getValueByPath(config, path.trim());
        if (!Array.isArray(list)) return '';

        return list.map(item => {
            let itemHtml = template;

            // Bind item values: Support both {{item.key}} and {{key}}
            const tokens = findTokens(itemHtml);
            for (const token of tokens) {
                let key = token.path;
                if (key.startsWith('item.')) {
                    key = key.replace('item.', '');
                }

                const value = getValueByPath(item, key);
                if (value !== undefined && value !== null) {
                    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                    itemHtml = itemHtml.replace(token.full, stringValue);
                }
            }
            return itemHtml;
        }).join('');
    });

    // 2. Bind Config Data {{...}}
    const bindResult = bindData(result, config);

    // 3. Bind Design Tokens [[...]]
    let finalContent = bindDesignTokens(bindResult.content, config._tokens, config);

    if (bindResult.unboundTokens.length > 0) {
        // Filter out tokens that might be item.xxx which are handled by loop
        const filteredUnbound = bindResult.unboundTokens.filter(t => !t.startsWith('item.'));
        if (filteredUnbound.length > 0) {
            console.log(`⚠️  Unbound tokens in ${filePath}:`);
            filteredUnbound.forEach(t => console.log(`   - {{${t}}}`));
        }
    }

    return finalContent;
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
