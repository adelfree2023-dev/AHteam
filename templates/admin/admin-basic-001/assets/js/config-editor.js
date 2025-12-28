/**
 * ============================================
 * AHteam Admin - Config Editor
 * ============================================
 * 
 * Edits project.config.json locally
 * Saves to localStorage
 * Exports to file on demand
 * ============================================
 */

const ConfigEditor = {
    // Storage key
    STORAGE_KEY: 'project_config',

    // Load config from localStorage
    load: function () {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        return null;
    },

    // Save config to localStorage
    save: function (config) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
        console.log('Config saved to localStorage');
        return true;
    },

    // Set value by path (e.g., "business.name")
    setValueByPath: function (obj, path, value) {
        const keys = path.split('.');
        let current = obj;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key]) {
                current[key] = {};
            }
            current = current[key];
        }

        current[keys[keys.length - 1]] = value;
    },

    // Get value by path
    getValueByPath: function (obj, path) {
        const keys = path.split('.');
        let current = obj;

        for (const key of keys) {
            if (current === undefined || current === null) {
                return undefined;
            }
            current = current[key];
        }

        return current;
    },

    // Save form data
    saveForm: function (form) {
        let config = this.load() || {};

        const formData = new FormData(form);
        for (const [path, value] of formData.entries()) {
            this.setValueByPath(config, path, value);
        }

        this.save(config);
        return true;
    },

    // Export config as JSON file
    export: function () {
        const config = this.load();
        if (!config) {
            alert('لا توجد إعدادات للتصدير');
            return;
        }

        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project.config.json';
        a.click();
        URL.revokeObjectURL(url);
    },

    // Import config from file
    import: function (file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);
                    this.save(config);
                    resolve(config);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    },

    // Reset to defaults
    reset: function () {
        localStorage.removeItem(this.STORAGE_KEY);
        location.reload();
    }
};

// Make available globally
window.ConfigEditor = ConfigEditor;
