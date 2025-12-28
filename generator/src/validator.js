/**
 * ============================================
 * AHteam Generator - Contract Validator
 * ============================================
 * 
 * Validates project.config.json against schema
 * and template requirements
 * 
 * FAIL FAST - Stop if invalid
 * ============================================
 */

import fs from 'fs';
import path from 'path';

/**
 * Validate project config against schema
 */
export function validateConfig(config, schema) {
    const errors = [];

    // Check $locked is true
    if (config.$locked !== true) {
        errors.push('Config must be locked ($locked: true)');
    }

    // Check $version exists
    if (!config.$version) {
        errors.push('Config must have $version');
    }

    // Check required sections
    const requiredSections = ['project', 'branding', 'business', 'content', 'features', 'localization', 'delivery', 'meta'];
    for (const section of requiredSections) {
        if (!config[section]) {
            errors.push(`Missing required section: ${section}`);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate template requirements against config
 */
export function validateTemplateRequirements(config, templateSchema) {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (templateSchema.required) {
        for (const keyPath of templateSchema.required) {
            const value = getValueByPath(config, keyPath);
            if (value === undefined || value === null || value === '') {
                errors.push(`Missing required config key: ${keyPath}`);
            }
        }
    }

    // Check optional fields (just warn if missing)
    if (templateSchema.optional) {
        for (const keyPath of templateSchema.optional) {
            const value = getValueByPath(config, keyPath);
            if (value === undefined || value === null || value === '') {
                warnings.push(`Optional config key not set: ${keyPath}`);
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Get value from object by dot-notation path
 */
export function getValueByPath(obj, path) {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
        if (current === undefined || current === null) {
            return undefined;
        }
        current = current[key];
    }

    return current;
}

/**
 * Main validation function
 */
export function validate(configPath, templatePath) {
    console.log('🔍 Validating contract...\n');

    // Load config
    if (!fs.existsSync(configPath)) {
        return { valid: false, errors: [`Config file not found: ${configPath}`] };
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    // Validate config structure
    const configResult = validateConfig(config, null);
    if (!configResult.valid) {
        console.log('❌ Config validation failed:');
        configResult.errors.forEach(e => console.log(`   - ${e}`));
        return configResult;
    }
    console.log('✅ Config structure valid');

    // Load template schema if exists
    const templateSchemaPath = path.join(templatePath, 'schema.json');
    if (fs.existsSync(templateSchemaPath)) {
        const templateSchema = JSON.parse(fs.readFileSync(templateSchemaPath, 'utf-8'));
        const templateResult = validateTemplateRequirements(config, templateSchema);

        if (!templateResult.valid) {
            console.log('❌ Template requirements not met:');
            templateResult.errors.forEach(e => console.log(`   - ${e}`));
            return templateResult;
        }

        if (templateResult.warnings.length > 0) {
            console.log('⚠️  Warnings:');
            templateResult.warnings.forEach(w => console.log(`   - ${w}`));
        }

        console.log('✅ Template requirements satisfied');
    }

    console.log('\n✅ Contract validation passed!\n');
    return { valid: true, errors: [], config };
}
