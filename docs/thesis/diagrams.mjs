// Render Mermaid diagrams to SVG + PNG using headless Chromium.
import path from "node:path";
import { fileURLToPath } from "node:url";
const TOOLS = process.env.THESIS_TOOLS || "/tmp/tools";          // dir containing node_modules with playwright, @sparticuz/chromium, pagedjs, mermaid
const HERE = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = await import(path.join(TOOLS, "node_modules/playwright/index.mjs"));
const c = (await import(path.join(TOOLS, "node_modules/@sparticuz/chromium/build/index.js"))).default;
import fs from "node:fs";
const C = c.default || c;
fs.mkdirSync(path.join(HERE, "diag"), { recursive: true });

const D = {};

D["arch"] = `flowchart TB
  subgraph Client["مرورگر کاربر"]
    UI["رابط کاربری React 19<br/>(Server + Client Components)"]
  end
  subgraph Next["Next.js 16 · App Router"]
    RSC["صفحات سرور<br/>(app/**/page.tsx)"]
    API["مسیرهای API<br/>(app/api/**/route.ts)"]
    MW["لایهٔ احراز هویت<br/>(session cookie · JWT)"]
    I18N["i18n · تم<br/>(کوکی locale/theme)"]
  end
  subgraph Domain["لایهٔ دامنه (lib/)"]
    AUTH["auth · session"]
    PAY["payments/service"]
    SUBS["subscriptions-ops"]
    FIN["finance"]
    SCHED["scheduling"]
    VAL["*-validation"]
  end
  subgraph Data["دادهٔ ماندگار"]
    PRISMA["Prisma ORM 7"]
    DB[("SQLite / libSQL<br/>(Turso)")]
    FILES[("data/uploads<br/>عکس‌های پیشرفت")]
  end
  EXT["درگاه پرداخت<br/>(Demo Provider / Webhook)"]
  CRON["زمان‌بند روزانه<br/>/api/cron/subscriptions"]
  UI -->|HTTP / fetch| RSC
  UI -->|JSON| API
  RSC --> MW
  API --> MW
  RSC --> I18N
  MW --> Domain
  Domain --> PRISMA --> DB
  API --> FILES
  PAY <--> EXT
  CRON --> SUBS`;

D["layers"] = `flowchart TB
  A["مؤلفهٔ سرور / مسیر API<br/>(TypeScript)"] --> B["Prisma Client<br/>(کلاینت نوع‌دار تولیدشده)"]
  B --> C["Prisma Query Engine<br/>(ترجمه به SQL)"]
  C --> D["@prisma/adapter-libsql"]
  D --> E[("SQLite file · dev.db")]
  D --> F[("Turso libSQL · https")]
  S["schema.prisma<br/>(طرحوارهٔ اعلانی)"] -.->|prisma generate| B
  S -.->|prisma migrate| M["migrations/*.sql"]
  M --> E
  M --> F`;

D["roles"] = `flowchart LR
  A["مدیر باشگاه<br/>ADMIN"] -->|"مدیریت"| G(("باشگاه"))
  T["مربی<br/>TRAINER"] -->|"همکاری"| G
  M["عضو<br/>USER"] -->|"عضویت و اشتراک"| G
  T -->|"برنامهٔ تمرینی و غذایی"| M
  M -->|"ثبت اجرا و بازخورد"| T
  A -->|"تأیید مربی و عضو"| T
  A -->|"طرح‌های اشتراک"| M
  M -->|"پرداخت"| A`;

D["erd"] = `flowchart TB
  U(["User<br/>(ADMIN · TRAINER · USER)"]):::hub
  TP(["TrainerProfile"]):::hub
  G(["Gym"]):::hub
  U -. "1 : 0..1" .- TP
  U --> GS["GymStaff"] --> G
  TP --> GT["GymTrainer"] --> G
  U --> GM["GymMembership"] --> G
  U --> TC["TrainerClient"] --> TP
  G --> SP["SubscriptionPlan"] --> SB["Subscription"] --> PM["Payment"] --> PE["PaymentEvent"]
  U --> SB
  TP --> WP["WorkoutPlan<br/>› WorkoutDay › WorkoutExercise"] --> WA["WorkoutAssignment"] --> WL["WorkoutLog › ExerciseLog"]
  TP --> DP["DietPlan<br/>› DietDay › Meal › FoodItem"] --> DA["DietAssignment"] --> NL["NutritionLog › MealLog"]
  U --> WA
  U --> DA
  TP --> TA["TrainerAvailability"]
  TP --> TS["TrainingSession"] --> TC
  U --> BM["BodyMeasurement"] --> PP["ProgressPhoto"]
  U --> NT["Notification"]
  U --> FB["Feedback"]
  U --> AL["AuditLog"] --> G
  U --> GR["GymReview"] --> G
  U --> TR["TrainerReview"] --> TP
  classDef hub fill:#dfe8cf,stroke:#3a4a2a,stroke-width:2px,font-weight:bold`;

D["erd-core"] = `erDiagram
  User {
    string id PK
    string name
    string email UK
    string password
    Role role
    UserStatus status
    datetime lastLoginAt
  }
  Gym {
    string id PK
    string name
    string slug UK
    string city
    GymStatus status
  }
  GymStaff {
    string id PK
    string gymId FK
    string userId FK
    GymStaffRole role
  }
  GymMembership {
    string id PK
    string gymId FK
    string userId FK
    MembershipStatus status
    datetime joinedAt
  }
  GymTrainer {
    string id PK
    string gymId FK
    string trainerId FK
    MembershipStatus status
  }
  SubscriptionPlan {
    string id PK
    string gymId FK
    string name
    int priceMinor
    string currency
    int durationDays
    SubscriptionAudience audience
  }
  Subscription {
    string id PK
    string subscriberId FK
    string gymId FK
    string planId FK
    SubscriptionStatus status
    int pricePaid
    datetime startDate
    datetime endDate
    boolean autoRenew
  }
  Payment {
    string id PK
    string subscriptionId FK
    PaymentType type
    PaymentStatus status
    int amount
    string provider
    string idempotencyKey UK
    datetime paidAt
  }
  User ||--o{ GymStaff : ""
  Gym ||--o{ GymStaff : ""
  Gym ||--o{ GymMembership : ""
  User ||--o{ GymMembership : ""
  Gym ||--o{ GymTrainer : ""
  Gym ||--o{ SubscriptionPlan : ""
  SubscriptionPlan ||--o{ Subscription : ""
  User ||--o{ Subscription : ""
  Subscription ||--o{ Payment : ""`;

D["erd-training"] = `erDiagram
  TrainerProfile {
    string id PK
    string userId FK
    string bio
    string specialties
    int experienceYears
  }
  WorkoutPlan {
    string id PK
    string trainerId FK
    string title
    PlanStatus status
    int version
    boolean isTemplate
  }
  WorkoutDay {
    string id PK
    string planId FK
    int dayIndex
    string title
  }
  WorkoutExercise {
    string id PK
    string dayId FK
    string name
    int sets
    string reps
    int restSeconds
  }
  WorkoutAssignment {
    string id PK
    string planId FK
    string clientId FK
    AssignmentStatus status
    datetime startsOn
  }
  WorkoutLog {
    string id PK
    string userId FK
    string assignmentId FK
    WorkoutLogStatus status
    int rpe
    datetime performedAt
  }
  ExerciseLog {
    string id PK
    string logId FK
    string exerciseName
    int setsDone
    string repsDone
    float weightKg
  }
  DietPlan {
    string id PK
    string trainerId FK
    string title
    int caloriesTarget
  }
  DietDay ||--o{ Meal : ""
  Meal ||--o{ FoodItem : ""
  DietPlan ||--o{ DietDay : ""
  TrainerProfile ||--o{ WorkoutPlan : ""
  TrainerProfile ||--o{ DietPlan : ""
  WorkoutPlan ||--o{ WorkoutDay : ""
  WorkoutDay ||--o{ WorkoutExercise : ""
  WorkoutPlan ||--o{ WorkoutAssignment : ""
  WorkoutAssignment ||--o{ WorkoutLog : ""
  WorkoutLog ||--o{ ExerciseLog : ""`;

D["flow-register"] = `flowchart TD
  S(["شروع"]) --> F["نمایش فرم ثبت‌نام<br/>نام، ایمیل، گذرواژه، نقش"]
  F --> V{"اعتبارسنجی<br/>سمت کلاینت"}
  V -- خطا --> F
  V -- معتبر --> P["POST /api/auth/register"]
  P --> R{"محدودیت نرخ<br/>رعایت شده؟"}
  R -- خیر --> E1["پاسخ ۴۲۹"] --> F
  R -- بله --> Z{"اعتبارسنجی<br/>سمت سرور"}
  Z -- خطا --> E2["پاسخ ۴۰۰ با پیام فارسی"] --> F
  Z -- معتبر --> U{"ایمیل تکراری؟"}
  U -- بله --> E3["پاسخ ۴۰۹"] --> F
  U -- خیر --> H["هش گذرواژه (bcrypt, cost 12)"]
  H --> C["ایجاد User<br/>(+ TrainerProfile اگر مربی)"]
  C --> T["صدور JWT و ثبت UserSession"]
  T --> K["تنظیم کوکی HttpOnly"]
  K --> D{"نقش؟"}
  D -- ADMIN --> A["/admin/gyms"]
  D -- TRAINER --> B["/trainer"]
  D -- USER --> M["/user"]`;

D["flow-login"] = `flowchart TD
  S(["شروع"]) --> F["فرم ورود"]
  F --> P["POST /api/auth/login"]
  P --> R{"محدودیت نرخ؟"}
  R -- عبور از حد --> E0["۴۲۹ · تلاش بعدی بعداً"] --> F
  R -- مجاز --> L["یافتن کاربر با ایمیل"]
  L --> X{"کاربر وجود دارد؟"}
  X -- خیر --> DM["مقایسه با هش ساختگی<br/>(جلوگیری از timing attack)"] --> E1
  X -- بله --> V{"bcrypt.compare"}
  V -- نادرست --> E1["۴۰۱ · اطلاعات نادرست"] --> F
  V -- درست --> ST{"وضعیت کاربر فعال؟"}
  ST -- خیر --> E2["۴۰۳ · حساب غیرفعال"] --> F
  ST -- بله --> SE["ایجاد UserSession<br/>+ به‌روزرسانی lastLoginAt"]
  SE --> J["امضای JWT<br/>(iss=koogymaa, aud=koogymaa-web)"]
  J --> CK["کوکی HttpOnly · SameSite=Lax<br/>۲۴ ساعت یا ۷ روز (مرا به خاطر بسپار)"]
  CK --> RD["هدایت به پنل نقش"]`;

D["seq-auth"] = `sequenceDiagram
  autonumber
  participant B as مرورگر
  participant M as Route Handler
  participant A as lib/auth
  participant DB as Prisma / DB
  B->>M: POST /api/auth/login {email, password}
  M->>M: checkRateLimit(ip, email)
  M->>DB: findUnique(User by email)
  DB-->>M: user | null
  M->>A: verifyPassword(password, hash)
  A-->>M: true / false
  M->>DB: create UserSession
  M->>A: signSession({userId, role, sessionId})
  A-->>M: JWT
  M-->>B: 200 + Set-Cookie koogymaa_session
  B->>M: GET /user (صفحهٔ محافظت‌شده)
  M->>A: readSession(cookie)
  A->>DB: session revoked?
  DB-->>A: active
  A-->>M: claims {userId, role}
  M-->>B: HTML پنل عضو`;

D["flow-subscription"] = `flowchart TD
  S(["عضو طرح را انتخاب می‌کند"]) --> C["POST /api/user/checkout {planId}"]
  C --> V{"طرح فعال و<br/>مخاطب مناسب؟"}
  V -- خیر --> E["۴۰۰ / ۴۰۳"]
  V -- بله --> I["ساخت Subscription (PENDING)<br/>+ Payment (PENDING)<br/>با idempotencyKey"]
  I --> PR["PaymentProvider.createCheckout()"]
  PR --> URL["بازگشت checkoutUrl امضاشده"]
  URL --> PG["صفحهٔ پرداخت /user/checkout/[id]"]
  PG --> W{"نتیجهٔ پرداخت"}
  W -- موفق --> WH["Webhook / confirm<br/>(بررسی امضای HMAC)"]
  W -- ناموفق --> FL["Payment.FAILED<br/>Subscription.PENDING باقی می‌ماند"]
  WH --> OK["Payment.SUCCEEDED · paidAt<br/>Subscription.ACTIVE · start/end"]
  OK --> N["اعلان به عضو و مدیر"]
  OK --> AL["ثبت AuditLog + PaymentEvent"]
  N --> R(["پایان"])`;

D["state-subscription"] = `stateDiagram-v2
  [*] --> PENDING : ایجاد هنگام checkout
  PENDING --> ACTIVE : پرداخت موفق
  PENDING --> CANCELLED : انصراف / پرداخت ناموفق
  ACTIVE --> PAUSED : توقف موقت توسط عضو
  PAUSED --> ACTIVE : ازسرگیری
  ACTIVE --> EXPIRED : گذشتن endDate (کرون)
  ACTIVE --> ACTIVE : تمدید خودکار (autoRenew)
  ACTIVE --> CANCELLED : لغو توسط عضو / مدیر
  EXPIRED --> [*]
  CANCELLED --> [*]`;

D["state-payment"] = `stateDiagram-v2
  [*] --> PENDING
  PENDING --> SUCCEEDED : تأیید درگاه
  PENDING --> FAILED : خطا / انقضای توکن
  SUCCEEDED --> REFUNDED : بازپرداخت توسط مدیر
  FAILED --> [*]
  REFUNDED --> [*]
  SUCCEEDED --> [*]`;

D["flow-cron"] = `flowchart TD
  S(["اجرای روزانه<br/>POST /api/cron/subscriptions"]) --> A{"Authorization: Bearer CRON_SECRET؟"}
  A -- نامعتبر --> X["۴۰۱"]
  A -- معتبر --> Q1["اشتراک‌های ACTIVE با endDate گذشته"]
  Q1 --> R{"autoRenew؟"}
  R -- بله --> RN["ایجاد Payment از نوع RENEWAL<br/>و تمدید endDate"]
  R -- خیر --> EX["تغییر وضعیت به EXPIRED"]
  RN --> N1["اعلان تمدید"]
  EX --> N2["اعلان انقضا"]
  Q1 --> Q2["اشتراک‌های در آستانهٔ انقضا<br/>(طبق expiryReminderDays کاربر)"]
  Q2 --> N3["اعلان یادآوری"]
  N1 & N2 & N3 --> H["به‌روزرسانی شاخص‌های /api/health"]
  H --> E(["پایان"])`;

D["flow-plan"] = `flowchart LR
  T["مربی"] --> C["ایجاد برنامهٔ تمرینی<br/>(روزها ← حرکات)"]
  C --> D{"وضعیت"}
  D -- DRAFT --> C
  D -- PUBLISHED --> AS["تخصیص به شاگرد<br/>WorkoutAssignment"]
  AS --> M["عضو: مشاهدهٔ برنامه"]
  M --> EX["اجرای تمرین<br/>تایمر استراحت · ثبت ست/تکرار/وزن"]
  EX --> LG["WorkoutLog + ExerciseLog"]
  LG --> ST["محاسبهٔ استریک و پیشرفت"]
  LG --> FB["بازخورد مربی (Feedback)"]
  FB --> T
  ST --> M`;

D["seq-session"] = `sequenceDiagram
  autonumber
  participant Tr as مربی
  participant S as سرور
  participant DB as پایگاه داده
  participant Me as عضو
  Tr->>S: POST /api/trainer/availability {weekday, start, end}
  S->>DB: upsert TrainerAvailability
  Me->>S: GET /user/schedule
  S->>DB: بازه‌های آزاد مربی + جلسات موجود
  S-->>Me: تقویم هفتگی
  Me->>S: POST /api/trainer/sessions {slot}
  S->>S: بررسی تداخل (lib/scheduling)
  alt تداخل دارد
    S-->>Me: 409 · بازه اشغال است
  else آزاد است
    S->>DB: create TrainingSession (SCHEDULED)
    S->>DB: Notification برای مربی
    S-->>Me: 201 · جلسه ثبت شد
  end`;

D["flow-request"] = `flowchart TD
  M["عضو: درخواست عضویت در باشگاه<br/>یا درخواست مربی"] --> P["ثبت با وضعیت PENDING"]
  P --> N["اعلان به مدیر / مربی"]
  N --> D{"تصمیم"}
  D -- تأیید --> A["APPROVED · دسترسی فعال"]
  D -- رد --> R["REJECTED · اعلان به عضو"]
  A --> L["AuditLog با actor و entity"]
  R --> L`;

D["i18n"] = `flowchart LR
  CK["کوکی locale = fa | en"] --> SRV["getLocale() در سرور"]
  SRV --> T["createT(locale)<br/>دیکشنری translations.ts"]
  T --> HTML["html lang/dir · کلاس locale-fa"]
  HTML --> CSS["قواعد RTL در globals.css<br/>(logical properties, سایدبار راست)"]
  HTML --> FONT["فونت: fa ← Estedad · en ← Inter"]
  SRV --> FA["lib/fa.ts<br/>تاریخ جلالی · ارقام فارسی · ریال"]
  CK2["کوکی theme = light | dark"] --> TH["کلاس theme-dark روی html"]`;

D["deploy"] = `flowchart LR
  DEV["توسعه‌دهنده"] -->|git push| GH["GitHub"]
  GH -->|CI: tsc · eslint · vitest| CI{"موفق؟"}
  CI -- خیر --> DEV
  CI -- بله --> V["Vercel Build<br/>next build"]
  V --> APP["Next.js Runtime"]
  APP --> DB[("Turso libSQL")]
  APP --> CR["Vercel Cron<br/>0 2 * * *"]
  APP --> HL["/api/health"]
  BK["npm run db:backup"] --> DB`;

const html = `<!doctype html><html><head><meta charset="utf-8">
<style>
@font-face{font-family:"Nazanin";src:url(file://${HERE}/fonts/IRNazanin.ttf)}
@font-face{font-family:"Nazanin";src:url(file://${HERE}/fonts/IRNazanin-Bold.ttf);font-weight:bold}
body{margin:0;background:#fff;font-family:"Nazanin","Tinos",serif}
#out{display:inline-block;padding:8px;width:max-content;min-width:1400px}
</style>
<script src="file://${TOOLS}/node_modules/mermaid/dist/mermaid.min.js"></script>
</head><body><div id="out"></div></body></html>`;
fs.writeFileSync(path.join(HERE, "diag/host.html"), html);

const browser = await chromium.launch({ executablePath: await C.executablePath(), args: ["--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--allow-file-access-from-files"], env: { ...process.env, LD_LIBRARY_PATH: process.env.LD_LIBRARY_PATH || "/tmp/al2023/lib:/tmp" } });
const page = await browser.newPage({ deviceScaleFactor: 2.5, viewport: { width: 2400, height: 1600 } });
await page.goto("file://" + path.join(HERE, "diag/host.html"));
await page.evaluate(() => mermaid.initialize({ startOnLoad: false, theme: "base", securityLevel: "loose", fontFamily: "Nazanin, Tinos, serif", fontSize: 16,
  themeVariables: { primaryColor: "#f1f5ea", primaryBorderColor: "#3a4a2a", primaryTextColor: "#111", lineColor: "#333", secondaryColor: "#eef2f7", tertiaryColor: "#fff7ed", fontFamily: "Nazanin, Tinos, serif", fontSize: "16px", edgeLabelBackground: "#ffffff", clusterBkg: "#fafaf7", clusterBorder: "#8a8f86", actorBkg: "#f1f5ea", actorBorder: "#3a4a2a", signalColor: "#222", noteBkgColor: "#fff7ed", attributeBackgroundColorOdd: "#ffffff", attributeBackgroundColorEven: "#f4f6f1" },
  flowchart: { htmlLabels: true, curve: "basis", nodeSpacing: 34, rankSpacing: 44, padding: 10 }, er: { fontSize: 14, entityPadding: 12, useMaxWidth: false }, sequence: { actorFontSize: 15, messageFontSize: 14, noteFontSize: 13, mirrorActors: false, useMaxWidth: false } }));
const ONLY = process.argv.slice(2);
for (const [name, def] of Object.entries(D)) {
  if (ONLY.length && !ONLY.includes(name)) continue;
  try {
    const { svg, w, h } = await page.evaluate(async ([id, def]) => {
      const { svg } = await mermaid.render("m_" + id.replace(/-/g, "_"), def);
      const out = document.getElementById("out"); out.innerHTML = svg;
      const el = out.querySelector("svg"); el.style.maxWidth = "none"; el.removeAttribute("width");
      const vb = el.viewBox.baseVal; el.style.width = vb.width + "px"; el.style.height = vb.height + "px";
      out.style.minWidth = "0"; out.style.width = vb.width + 16 + "px";
      const bb = el.getBoundingClientRect(); return { svg, w: bb.width, h: bb.height };
    }, [name, def]);
    fs.writeFileSync(path.join(HERE, `diag/${name}.svg`), svg);
    const el = await page.$("#out"); await el.screenshot({ path: path.join(HERE, `diag/${name}.png`), omitBackground: false });
    console.log(name.padEnd(20), Math.round(w), "x", Math.round(h));
  } catch (e) { console.log("FAILED", name, String(e).split("\n")[0]); }
}
await browser.close();
