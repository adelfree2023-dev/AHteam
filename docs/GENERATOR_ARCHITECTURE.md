# 🏭 المرحلة E — هندسة الماكينة (Generator Architecture)
## Flow Diagram + Pseudo-code - V1.0.0

**📅 التاريخ:** 2025-12-28
**📌 الحالة:** DESIGN PHASE (لا كود)

---

## 🎯 هدف المرحلة E

الإجابة على سؤال واحد فقط:

```
كيف يتحول project.config.json + Template
إلى 3 Artifacts مستقلة؟
```

---

## 🧠 Generator Flow (الرسم العقلي)

```
┌─────────────────────────────────────────────────────────────────┐
│                         INPUT                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    project.config.json          templates/                      │
│           │                          │                          │
│           │                          │                          │
│           ▼                          ▼                          │
│    ┌─────────────┐           ┌─────────────┐                   │
│    │   Config    │           │  Template   │                   │
│    │    Data     │           │   Files     │                   │
│    └──────┬──────┘           └──────┬──────┘                   │
│           │                          │                          │
│           └──────────┬───────────────┘                          │
│                      │                                          │
│                      ▼                                          │
└─────────────────────────────────────────────────────────────────┘
                       │
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                    STEP 1                                       │
│              Contract Validator                                 │
├─────────────────────────────────────────────────────────────────┤
│  • config matches schema?                                       │
│  • template.schema.json satisfied?                              │
│  • all required keys present?                                   │
│  • FAIL FAST if not valid                                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼ ✅ VALID
┌──────────────────────────────────────────────────────────────────┐
│                    STEP 2                                        │
│               Template Resolver                                  │
├──────────────────────────────────────────────────────────────────┤
│  • Read features.website.enabled                                 │
│  • Read features.admin.enabled                                   │
│  • Read features.mobile.enabled                                  │
│  • Select matching templates                                     │
│  • Validate template manifest                                    │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    STEP 3                                        │
│                Binding Engine                                    │
├──────────────────────────────────────────────────────────────────┤
│  • Read all {{tokens}} from templates                            │
│  • Map tokens to config values                                   │
│  • Replace tokens with actual values                             │
│  • NO LOGIC - direct substitution only                           │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    STEP 4                                        │
│              Artifact Generator                                  │
├──────────────────────────────────────────────────────────────────┤
│  • Create /generated/website/                                    │
│  • Create /generated/admin/                                      │
│  • Create /generated/android/                                    │
│  • Copy processed files                                          │
│  • Copy assets                                                   │
│  • Each artifact = STANDALONE                                    │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    STEP 5                                        │
│             Export Preparation                                   │
├──────────────────────────────────────────────────────────────────┤
│  • Generate README for each artifact                             │
│  • Generate .env.example                                         │
│  • Generate deployment docs                                      │
│  • Prepare for packaging (لا ZIP لسه)                           │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                        OUTPUT                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│    /generated/                                                   │
│    ├── website/          ← Standalone Website                    │
│    │   ├── index.html                                            │
│    │   ├── products.html                                         │
│    │   ├── assets/                                               │
│    │   └── README.md                                             │
│    │                                                             │
│    ├── admin/            ← Standalone Admin Panel                │
│    │   ├── index.html                                            │
│    │   ├── dashboard.html                                        │
│    │   ├── assets/                                               │
│    │   └── README.md                                             │
│    │                                                             │
│    └── android/          ← Standalone Android App                │
│        ├── app/                                                  │
│        ├── gradle/                                               │
│        └── README.md                                             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🧱 مكونات الماكينة (Pseudo-code)

### 1️⃣ Contract Validator

```pseudo
FUNCTION validateContract(config, templateSchema):
    
    // Step 1: Validate config against project.config.schema.json
    IF NOT jsonSchemaValidate(config, PROJECT_SCHEMA):
        THROW ValidationError("Config does not match schema")
    
    // Step 2: Check template required fields
    FOR EACH key IN templateSchema.required:
        IF NOT exists(config, key):
            THROW ValidationError("Missing required key: " + key)
    
    // Step 3: Validate data types
    FOR EACH validation IN templateSchema.validation:
        IF NOT matches(config[validation.key], validation.pattern):
            THROW ValidationError("Invalid format: " + validation.key)
    
    RETURN true  // ✅ Valid
```

### 2️⃣ Template Resolver

```pseudo
FUNCTION resolveTemplates(config):
    
    templates = []
    
    // Check Website
    IF config.features.website.enabled:
        websiteTemplate = findTemplate(
            type: "website",
            category: determineCategory(config),
            rtl: config.localization.direction == "rtl"
        )
        templates.ADD(websiteTemplate)
    
    // Check Admin
    IF config.features.admin.enabled:
        adminTemplate = findTemplate(
            type: "admin",
            modules: config.features.admin.modules
        )
        templates.ADD(adminTemplate)
    
    // Check Mobile
    IF config.features.mobile.enabled:
        mobileTemplate = findTemplate(
            type: "android",
            platform: config.features.mobile.platform
        )
        templates.ADD(mobileTemplate)
    
    // Validate each template
    FOR EACH template IN templates:
        IF NOT validateTemplateManifest(template):
            THROW TemplateError("Invalid template: " + template.id)
    
    RETURN templates
```

### 3️⃣ Binding Engine

```pseudo
FUNCTION bindData(templateFiles, config):
    
    processedFiles = []
    
    FOR EACH file IN templateFiles:
        content = readFile(file)
        
        // Find all tokens {{path.to.value}}
        tokens = findAllTokens(content)
        
        FOR EACH token IN tokens:
            // Get value from config using path
            path = extractPath(token)  // "branding.colors.primary"
            value = getValueByPath(config, path)
            
            IF value IS NULL:
                THROW BindingError("Token not found in config: " + token)
            
            // Replace token with value
            content = replaceToken(content, token, value)
        
        processedFiles.ADD({
            path: file.path,
            content: content
        })
    
    RETURN processedFiles
```

### 4️⃣ Artifact Generator

```pseudo
FUNCTION generateArtifacts(processedFiles, outputDir):
    
    // Create output directories
    createDir(outputDir + "/website")
    createDir(outputDir + "/admin")
    createDir(outputDir + "/android")
    
    FOR EACH file IN processedFiles:
        
        // Determine artifact type from path
        artifactType = determineArtifactType(file.path)
        
        // Calculate output path
        outputPath = outputDir + "/" + artifactType + "/" + file.relativePath
        
        // Ensure directory exists
        ensureDir(parentDir(outputPath))
        
        // Write file
        writeFile(outputPath, file.content)
    
    // Copy assets (images, fonts, etc.)
    FOR EACH template IN templates:
        copyDir(
            template.path + "/assets",
            outputDir + "/" + template.type + "/assets"
        )
    
    RETURN success
```

### 5️⃣ Export Preparation

```pseudo
FUNCTION prepareExport(outputDir, config):
    
    FOR EACH artifactType IN ["website", "admin", "android"]:
        
        artifactPath = outputDir + "/" + artifactType
        
        IF NOT exists(artifactPath):
            CONTINUE
        
        // Generate README
        readme = generateReadme(config, artifactType)
        writeFile(artifactPath + "/README.md", readme)
        
        // Generate .env.example
        envExample = generateEnvExample(config, artifactType)
        writeFile(artifactPath + "/.env.example", envExample)
        
        // Generate deployment docs
        deployDocs = generateDeploymentDocs(config, artifactType)
        writeFile(artifactPath + "/DEPLOYMENT.md", deployDocs)
    
    RETURN success
```

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   config    │────────┐
│   .json     │        │
└─────────────┘        │
                       ▼
                ┌──────────────┐
                │   VALIDATE   │──── ❌ FAIL → Stop
                └──────┬───────┘
                       │ ✅
                       ▼
                ┌──────────────┐
                │   RESOLVE    │──── Select Templates
                └──────┬───────┘
                       │
┌─────────────┐        │
│  template/  │────────┤
│   files     │        │
└─────────────┘        ▼
                ┌──────────────┐
                │    BIND      │──── Replace {{tokens}}
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │   GENERATE   │──── Create Files
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │   PREPARE    │──── Add Docs
                └──────┬───────┘
                       │
                       ▼
              ┌─────────────────┐
              │    /generated/  │
              │    ├── website  │
              │    ├── admin    │
              │    └── android  │
              └─────────────────┘
```

---

## 🚫 ما يُمنع في المرحلة E

```
❌ كتابة كود Generator
❌ بناء Templates
❌ أي UI
❌ أي Trial Logic
❌ أي Implementation
```

**هذه المرحلة توثيقية فقط**

---

## ✅ Deliverables

| البند | الحالة |
|-------|--------|
| Flow Diagram | ✅ |
| Pseudo-code | ✅ |
| Component Definitions | ✅ |
| Data Flow | ✅ |

---

## 🔒 قرار رسمي

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   📜 GENERATOR ARCHITECTURE V1.0.0                                        ║
║                                                                           ║
║   هذا هو شكل الماكينة النهائي                                              ║
║                                                                           ║
║   Components:                                                             ║
║   1. Contract Validator                                                   ║
║   2. Template Resolver                                                    ║
║   3. Binding Engine                                                       ║
║   4. Artifact Generator                                                   ║
║   5. Export Preparation                                                   ║
║                                                                           ║
║   أي تغيير = إصدار جديد                                                   ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

**📅 تاريخ القفل:** 2025-12-28
**🔒 الحالة:** LOCKED

---

> *الماكينة واضحة. التنفيذ يبدأ في المرحلة F.*
