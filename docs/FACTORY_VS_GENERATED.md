# 🏭 الفصل بين Factory و Generated

## تعريفات أساسية - إلزامية

---

## 🔑 المصطلحات الرسمية

### 1️⃣ Factory Runtime (وقت التشغيل المصنعي)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  Factory Runtime = كل ما يعمل داخل المصنع فقط                              ║
║                                                                           ║
║  ✅ يعيش على سيرفر المصنع                                                  ║
║  ✅ يُستخدم لتوليد المنتجات                                                ║
║  ❌ لا يُصدَّر مع المنتج                                                   ║
║  ❌ لا يراه العميل                                                        ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

**أمثلة:**
- Generator Engine
- Template Compiler
- Validation System
- packages/core-domain
- packages/tenant
- packages/auth
- packages/shared

---

### 2️⃣ Generated Artifact (المنتج المُولَّد)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  Generated Artifact = ما يستلمه العميل                                     ║
║                                                                           ║
║  ✅ مستقل تمامًا                                                          ║
║  ✅ يعمل بدون المصنع                                                      ║
║  ✅ ملكية كاملة للعميل                                                    ║
║  ❌ لا يحتاج اتصال بنا                                                    ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

**أمثلة:**
- Website Files (HTML/CSS/JS)
- Admin Panel Files
- Mobile App Files
- Database Schema
- Documentation
- Export Package

---

## 📊 الفرق الجوهري

| الجانب | Factory Runtime | Generated Artifact |
|--------|-----------------|-------------------|
| **الموقع** | سيرفر المصنع | جهاز العميل |
| **الغرض** | توليد المنتجات | تشغيل المتجر |
| **الملكية** | نحن | العميل |
| **الاعتمادية** | على الـ Packages | مستقل تمامًا |
| **التحديث** | نحدثه نحن | العميل مسؤول |
| **الكود** | TypeScript + Packages | HTML/CSS/JS نقي |

---

## 🧱 هيكل الفصل

```
AHteam/
│
├── 🏭 FACTORY RUNTIME (لا يُصدَّر)
│   ├── packages/
│   │   ├── core-domain/     ← Factory-side ONLY
│   │   ├── tenant/          ← Factory-side ONLY
│   │   ├── auth/            ← Factory-side ONLY
│   │   └── shared/          ← Factory-side ONLY
│   │
│   ├── apps/
│   │   └── api/             ← Factory-side ONLY
│   │
│   └── generator/           ← Factory-side ONLY (قادم)
│
├── 📦 TEMPLATES (مصدر التوليد)
│   └── templates/
│       ├── website/
│       ├── admin/
│       └── android/
│
└── 📤 GENERATED (ما يُصدَّر للعميل)
    └── output/              ← يُولَّد عند الطلب
        ├── website/
        ├── admin/
        ├── mobile/
        └── docs/
```

---

## 🚫 القواعد الصارمة

### ❌ ممنوع منعًا باتًا:

```
1. Template يستدعي أي Package
   ❌ import { Tenant } from '@ahteam/core-domain'
   
2. Generated Code يعتمد على Factory
   ❌ أي reference للـ packages
   
3. Factory Code داخل Export
   ❌ أي ملف من packages/ في الـ output
   
4. Runtime dependency بعد التصدير
   ❌ العميل يحتاج سيرفرنا
```

### ✅ مسموح فقط:

```
1. Templates تقرأ project.config.json
   ✅ {{branding.colors.primary}}
   
2. Generated Code مستقل
   ✅ HTML/CSS/JS نقي
   
3. Factory يولد ثم يختفي
   ✅ العميل لا يعرفنا
```

---

## 📌 Packages Clarification

### ⚠️ تحذير مهم:

الـ Packages الموجودة:
- `@ahteam/core-domain`
- `@ahteam/tenant`
- `@ahteam/auth`
- `@ahteam/shared`

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   هذه Packages هي Factory-side ONLY                                      ║
║                                                                           ║
║   ❌ ليست Runtime بعد التصدير                                             ║
║   ❌ لا يُسمح لأي Template باستدعائها                                      ║
║   ❌ لا تظهر في Generated Artifact                                        ║
║                                                                           ║
║   ✅ تُستخدم فقط داخل Generator                                           ║
║   ✅ للتحقق والمعالجة قبل التوليد                                         ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 🎯 لماذا هذا الفصل؟

### بدون الفصل:
- المنتج يعتمد علينا
- العميل لا يملك شيئًا فعليًا
- نتحول لـ SaaS تقليدي
- نموذج العمل ينهار

### مع الفصل:
- المنتج مستقل 100%
- العميل يملك كل شيء
- نبيع ونختفي
- نموذج العمل ناجح

---

## 📌 إعلان رسمي

```
من هذه اللحظة:

Factory Runtime ≠ Generated Artifact

الاثنان عالمان منفصلان
لا يختلطان أبدًا

Factory: يعمل، يولد، يختفي
Generated: يُسلَّم، يعمل، مستقل
```

---

**📅 تاريخ الإعلان:** 2025-12-28
**🔒 الحالة:** LOCKED

---

> *المصنع يولد ويختفي. المنتج يعيش مستقلاً.*
