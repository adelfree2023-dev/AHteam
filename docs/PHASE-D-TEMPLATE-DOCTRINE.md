# 📜 Phase D - Template Doctrine

## قواعد القوالب (Template Rules)

---

## ✅ ALLOWED في Templates

### Structure
- HTML5 semantic markup
- CSS (inline or external)
- JavaScript (vanilla or minimal deps)
- SVG icons and graphics
- Placeholder tokens: `{{key.subkey}}`

### Features
- Responsive design
- RTL support
- Dark/Light modes
- CSS variables
- LocalStorage integration
- Static data (JSON)

### Assets
- CSS files
- JS files
- SVG icons
- Font files (local)
- README documentation

---

## ❌ FORBIDDEN في Templates

### Architecture
- Server-side code (Node, PHP, Python)
- Database connections
- API calls to external services
- Authentication with backend
- Session management

### Dependencies
- npm packages requiring build
- Framework dependencies (React, Vue, Angular)
- CSS preprocessors requiring build (Sass, Less)
- TypeScript (requires compilation)

### Security Risks
- Hardcoded API keys
- External CDN images (can break)
- Third-party tracking scripts
- Iframe embedding from external sources

### Design Anti-patterns
- Hardcoded colors (must use tokens)
- Hardcoded fonts (must use tokens)
- Non-responsive layouts
- LTR-only layouts

---

## 📐 Template Contract

Every template MUST:

```json
{
  "required": {
    "skeleton.html": "Base HTML structure",
    "components/header.html": "Header component",
    "components/footer.html": "Footer component",
    "assets/css/base.css": "Base styles",
    "README.md": "Usage documentation"
  },
  "tokens": {
    "colors": ["primary", "secondary", "background", "text"],
    "fonts": ["heading", "body"],
    "spacing": ["sm", "md", "lg"]
  },
  "placeholders": {
    "project.name": "Required",
    "business.email": "Required",
    "content.hero.title": "Required"
  }
}
```

---

## 🔒 Validation Rules

Generator MUST reject template if:

1. Contains `require()` or `import` statements
2. Contains API URLs
3. Missing required components
4. Hardcoded colors outside `:root`
5. Missing RTL support
6. Non-responsive breakpoints

---

## Template Doctrine - Locked ✅

| Rule | Enforcement |
|------|-------------|
| No server code | Generator validation |
| No external deps | Generator validation |
| Token-based styling | Generator validation |
| RTL required | Manual review |
| Responsive required | Manual review |
