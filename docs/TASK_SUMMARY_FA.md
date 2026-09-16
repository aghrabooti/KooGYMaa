# خلاصه کار انجام شده — مربی سارا و ممبر نیما

## درخواست کاربر (فارسی)

> برای مربی سارا چندتا برنامه ورزشی بساز به شاگردهاش برنامه بده
> برنامه غذایی بساز
> برای ممبر نیما هم یه مسیر بساز که هانگار چند ماهه شاگرد هست

## کارهای انجام شده

### ۱. برنامه‌های ورزشی برای سارا (۵ برنامه)

برای مربی **سارا** (trainer@koogymaa.test - تخصص Strength & Mobility) ۵ برنامه ورزشی ساخته شد:

1. **حجم عضلانی - هایپرتروفی ۴ روزه** (`sara-wp-hypertrophy`)
   - ۴ روز، هر روز ۳-۴ حرکت
   - مناسب نیما، رضا، آرمان
   - شامل پرس سینه، اسکوات، بارفیکس، پرس سرشانه

2. **چربی سوزی و کاندیشننگ - HIIT** (`sara-wp-fatloss-hiit`)
   - ۳ روزه، ترکیبی HIIT + قدرتی
   - مناسب سحر، پریسا، نیما
   - شامل برپی، اسکوات پرشی، طناب زنی

3. **قدرت پایه پیشرفته - سطح ۲** (`sara-wp-strength-l2`)
   - ادامه Foundation Strength
   - ۳ روز (پایین تنه، بالا تنه، قدرت کامل)
   - مناسب نیما و رضا

4. **موبیلیتی و ریکاوری** (`sara-wp-mobility`)
   - تخصص اصلی سارا
   - ۲ روز (پایین تنه، بالا تنه)
   - برای تمام ۵ شاگرد

5. **فول بادی بانوان - تناسب اندام** (`sara-wp-women-fullbody`)
   - ۳ روزه مخصوص بانوان
   - تمرکز پا، باسن، شکم
   - مناسب سحر و پریسا

**فایل‌ها:**
- `prisma/seed.mjs` — اضافه شدن ۵ برنامه به سید اصلی
- `prisma/seed-sara-nima.mjs` — اسکریپت مستقل برای ساخت برنامه‌ها
- `prisma/turso-demo-setup.sql` — SQL برای دیتابیس هاست شده (Turso)
- `prisma/sara-nima-extension.sql` — SQL الحاقی

### ۲. برنامه‌های غذایی برای سارا (۴ برنامه)

1. **رژیم افزایش وزن سالم - ۳۰۰۰ کالری** (`sara-dp-bulk-3000`)
   - ۱۸۰g پروتئین، ۳۸۰g کربو، ۸۵g چربی
   - مناسب رضا و آرمان (فاز حجم)

2. **رژیم کات و چربی سوزی - ۲۰۰۰ کالری** (`sara-dp-cut-2000`)
   - ۱۷۰g پروتئین، ۱۸۰g کربو، ۶۵g چربی
   - مناسب نیما ماه ۳-۶ (فاز کات)

3. **رژیم متعادل بانوان - ۱۸۰۰ کالری** (`sara-dp-women-1800`)
   - ۱۱۰g پروتئین، ۲۰۰g کربو، ۶۰g چربی
   - مناسب سحر و پریسا (آهن و کلسیم بالا)

4. **رژیم نگهدارنده - ۲۴۰۰ کالری** (`sara-dp-maintain-2400`)
   - ۱۴۰g پروتئین، ۳۰۰g کربو، ۷۰g چربی
   - برای تمام شاگردان در فاز تثبیت

هر رژیم شامل روزهای غذایی با وعده‌ها (صبحانه، ناهار، شام) و آیتم‌های غذایی با کالری و ماکرو دقیق است.

### ۳. اختصاص برنامه‌ها به شاگردان

**شاگردان سارا (۵ نفر):**

| شاگرد | ایمیل | مدت شاگردی | برنامه ورزشی | برنامه غذایی |
|-------|-------|------------|--------------|--------------|
| نیما | member@koogymaa.test | ۶ ماه | قدرت سطح ۲، هایپرتروفی، HIIT، موبیلیتی | کات ۲۰۰۰، نگهدارنده |
| سحر | sahar.student@koogymaa.test | ۴ ماه | HIIT، بانوان، موبیلیتی | بانوان ۱۸۰۰، نگهدارنده |
| رضا | reza.student@koogymaa.test | ۳ ماه | قدرت سطح ۲، هایپرتروفی، موبیلیتی | حجم ۳۰۰۰، نگهدارنده |
| آرمان | pending.member@koogymaa.test | ۲ ماه | هایپرتروفی، موبیلیتی | حجم ۳۰۰۰، نگهدارنده |
| پریسا | parisa.student@koogymaa.test | ۱ ماه | HIIT، بانوان، موبیلیتی | بانوان ۱۸۰۰، نگهدارنده |

- **۱۵** WorkoutAssignment
- **۱۰** DietAssignment
- همه در `seed.mjs` و `turso-demo-setup.sql`

### ۴. مسیر ۶ ماهه نیما — چند ماهه شاگرد هست؟

برای ممبر **نیما** یک مسیر کامل ۶ ماهه ساخته شد:

**محاسبه ماه‌ها:**
```ts
// TrainerClient.startedAt = 6 ماه قبل
// الان = 6 ماه شاگردی
function calculateMonthsAsStudent(startedAt: Date) {
  return (now.getFullYear() - startedAt.getFullYear()) * 12 + (now.getMonth() - startedAt.getMonth());
}
```

**تایم‌لاین:**

- ماه ۱: ۸۵.۲ کیلو، ۲۲.۵٪ چربی — شروع Foundation Strength
- ماه ۲: ۸۴ کیلو — کاهش ۱.۲ کیلو، قدرت +۱۵٪
- ماه ۳: ۸۲.۸ کیلو — پایان قدرت پایه، شروع سطح ۲
- ماه ۴: ۸۱.۵ کیلو — شروع هایپرتروفی، رژیم ۳۰۰۰
- ماه ۵: ۸۰.۸ کیلو — شروع کات، رژیم ۲۰۰۰، HIIT
- ماه ۶ (الان): ۸۰ کیلو — ۵.۲ کیلو کاهش، ۶.۵٪ چربی کمتر، ۲.۵ سانت بازو بیشتر

**داده‌های ثبت شده:**
- ۶ رکورد `BodyMeasurement` (nima-m-1 تا nima-m-6)
- ۳ عکس پیشرفت `ProgressPhoto`
- ۶ بازخورد `Feedback` از سارا (هر ماه یکی)
- ۴ نوتیفیکیشن `Notification`
- `TrainerClient` با `startedAt = 6 ماه قبل`

**فایل‌های جدید:**
- `lib/journey.ts` — توابع محاسبه ماه‌ها، ساخت تایم‌لاین نیما
- `app/api/user/journey/route.ts` — API برای گرفتن مسیر
  - `GET /api/user/journey` → `monthsAsStudent: 6`, `durationFa: "۶ ماه"`, `detailedJourney: [...]`
- `app/user/journey/page.tsx` — صفحه UI زیبا با تایم‌لاین ۶ ماهه
- `components/user/user-nav.tsx` — اضافه شدن لینک "مسیر من" به منو
- `lib/i18n/translations.ts` — ترجمه `nav.journey`
- `docs/nima-journey.md` — مستند کامل مسیر نیما
- `docs/sara-programs.md` — مستند کامل برنامه‌های سارا

### ۵. فایل‌های تولید شده

```
prisma/seed.mjs (ویرایش - اضافه شدن برنامه‌های سارا و مسیر نیما)
prisma/seed-sara-nima.mjs (جدید - اسکریپت مستقل)
prisma/sara-nima-extension.sql (جدید - SQL الحاقی)
prisma/turso-demo-setup.sql (ویرایش - اضافه شدن داده‌های جدید)
lib/journey.ts (جدید)
app/api/user/journey/route.ts (جدید)
app/user/journey/page.tsx (جدید)
components/user/user-nav.tsx (ویرایش)
lib/i18n/translations.ts (ویرایش)
docs/sara-programs.md (جدید)
docs/nima-journey.md (جدید)
docs/TASK_SUMMARY_FA.md (این فایل)
scripts/generate-sara-sql.mjs (جدید - برای تولید SQL)
```

### ۶. چطور تست کنیم؟

**محلی (با Turso):**
```bash
npm run db:turso:fresh  # پاک کردن و ساخت دوباره دیتابیس با داده‌های جدید
npm run dev
# ورود با:
# trainer@koogymaa.test / KooGYMaa123! → بخش workouts و nutrition → ۵+۴ برنامه جدید
# member@koogymaa.test / KooGYMaa123! → /user/journey → مسیر ۶ ماهه
# API: /api/user/journey
```

**محلی (SQLite):**
```bash
# اگر شبکه به Turso وصل نیست، از dev.db محلی استفاده کنید
DATABASE_URL=file:./dev.db npm run db:migrate
npm run db:seed
node prisma/seed-sara-nima.mjs
```

### ۷. نتیجه

- ✅ ۵ برنامه ورزشی برای سارا ساخته شد
- ✅ ۴ برنامه غذایی برای سارا ساخته شد
- ✅ به ۵ شاگرد (نیما، سحر، رضا، آرمان، پریسا) اختصاص داده شد
- ✅ مسیر ۶ ماهه نیما با محاسبه دقیق ماه‌ها ساخته شد
- ✅ API و UI برای نمایش مسیر
- ✅ مستندات فارسی کامل

**نیما الان ۶ ماهه شاگرد سارا است** — از ۸۵.۲ کیلو به ۸۰ کیلو، از ۲۲.۵٪ چربی به ۱۶٪، با ۸ سانت کاهش کمر و ۲.۵ سانت افزایش بازو.

---

ساخته شده: 2026-09-16
توسط: Agent برای KooGYMaa
