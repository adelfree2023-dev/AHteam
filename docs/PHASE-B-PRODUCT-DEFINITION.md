# 📦 Phase B - Product Definition

## ماذا نبيع بالضبط؟

Factory تُنتج 3 منتجات مستقلة للعميل:

---

## 1. Website Package
```
website/
├── index.html          ← Landing page
├── products.html       ← Product listing
├── product-*.html      ← Product pages
├── category-*.html     ← Category pages
├── about.html          ← About page
├── contact.html        ← Contact page
├── assets/
│   ├── css/           ← Styles
│   ├── js/            ← Commerce engine
│   └── images/        ← Assets
├── data/
│   └── products.json  ← Product data
└── README.md          ← Setup guide
```

**Type:** Static HTML
**Hosting:** Any static host (Netlify, Vercel, shared hosting)
**Dependencies:** None

---

## 2. Admin Package
```
admin/
├── index.html          ← Dashboard
├── login.html          ← Auth page
├── products.html       ← Products CRUD
├── orders.html         ← Orders list
├── settings.html       ← Config
├── assets/
│   ├── css/
│   └── js/
│       ├── auth.js     ← Local auth
│       └── storage.js  ← LocalStorage CRUD
└── README.md
```

**Type:** Static HTML + LocalStorage
**Hosting:** Same as Website or separate
**Dependencies:** None (no backend)

---

## 3. Android Package
```
android/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   ├── java/.../MainActivity.java
│   │   └── res/
│   │       ├── layout/
│   │       ├── values/
│   │       └── drawable/
│   └── build.gradle
├── build.gradle
└── README.md           ← Build instructions
```

**Type:** WebView App
**Build:** Android Studio
**Dependencies:** Website URL

---

## 4. Export Package (مجمع)
```
export-{project-name}-{date}.zip
├── website/
├── admin/
├── android/
├── docs/
│   ├── DEPLOYMENT.md
│   ├── CUSTOMIZATION.md
│   └── API.md
└── README.md
```

---

## Product Scope - مغلق ✅

| Product | Type | Backend | Hosting |
|---------|------|---------|---------|
| Website | Static | ❌ | Any |
| Admin | Static + LocalStorage | ❌ | Any |
| Android | WebView | ❌ | Play Store |
| Export | Zip | ❌ | Client |

**No SaaS. No subscription. Ownership only.**
