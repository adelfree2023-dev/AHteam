/**
 * ============================================
 * AHteam - web-ecommerce-001
 * Configuration Bridge
 * ============================================
 * 
 * This file is GENERATED from project.config.json
 * DO NOT EDIT MANUALLY
 * ============================================
 */

const CONFIG = {
    // Project
    project: {
        name: "{{project.name}}",
        slug: "{{project.slug}}",
        version: "{{project.version}}"
    },

    // Branding
    branding: {
        logo: {
            primary: "{{branding.logo.primary}}",
            favicon: "{{branding.logo.favicon}}"
        },
        colors: {
            primary: "{{branding.colors.primary}}",
            secondary: "{{branding.colors.secondary}}",
            accent: "{{branding.colors.accent}}",
            background: "{{branding.colors.background}}",
            text: "{{branding.colors.text}}"
        }
    },

    // Business
    business: {
        name: "{{business.name}}",
        email: "{{business.email}}",
        phone: "{{business.phone}}",
        whatsapp: "{{business.whatsapp}}",
        currency: {
            code: "{{business.currency.code}}",
            symbol: "{{business.currency.symbol}}",
            position: "{{business.currency.position}}"
        }
    },

    // Localization
    localization: {
        defaultLanguage: "{{localization.defaultLanguage}}",
        direction: "rtl"
    }
};

// Make available globally
window.CONFIG = CONFIG;

// Format price helper
window.formatPrice = function (amount) {
    const symbol = CONFIG.business.currency.symbol;
    const position = CONFIG.business.currency.position;

    if (position === 'before') {
        return symbol + ' ' + amount.toFixed(2);
    } else {
        return amount.toFixed(2) + ' ' + symbol;
    }
};
