# -*- coding: utf-8 -*-
"""پیوست‌ها، منابع و مراجع، چکیده و صفحهٔ عنوان انگلیسی، جلد چپ"""
from build import fa, en, code, p, ul, ol, h2, h3, table, fig, fn
from front import TITLE_EN, LOGO

def appendix_head(letter, title):
    return f'<section class="chapter-start"><div class="chapter-head" id="app{letter}" data-toc="1" data-title="پیوست {letter}: {title}" data-appendix="1"><div class="chapter-num">پیوست {letter}</div><div class="chapter-title">{title}</div></div>'

API_ROWS = [
    ("احراز هویت", [
        ("POST", "/api/auth/register", "ثبت‌نام با نقش"), ("POST", "/api/auth/login", "ورود، صدور کوکی نشست"), ("POST", "/api/auth/logout", "خروج و ابطال نشست"),
        ("GET", "/api/auth/me", "اطلاعات کاربر جاری"), ("POST", "/api/auth/forgot-password", "درخواست توکن بازنشانی"), ("POST", "/api/auth/reset-password", "بازنشانی با توکن"),
        ("POST", "/api/auth/change-password", "تغییر گذرواژه"), ("POST", "/api/auth/verify-email", "تأیید ایمیل"), ("GET/DELETE", "/api/auth/sessions[/id]", "فهرست و ابطال نشست‌ها")]),
    ("مدیر باشگاه", [
        ("GET/POST", "/api/admin/gyms", "فهرست و ساخت باشگاه"), ("GET/PATCH", "/api/admin/gyms/[gymId]", "جزئیات و تنظیمات باشگاه"),
        ("GET/POST", "…/members", "اعضا و افزودن عضو"), ("PATCH", "…/members/[membershipId]", "تأیید/رد/تعلیق عضویت"), ("POST", "…/members/bulk", "عملیات گروهی اعضا"),
        ("GET/POST", "…/trainers", "مربیان و دعوت"), ("PATCH", "…/trainers/[gymTrainerId]", "تأیید/رد همکاری"), ("POST", "…/trainers/bulk", "عملیات گروهی مربیان"),
        ("GET/POST", "…/plans", "طرح‌های اشتراک"), ("PATCH/DELETE", "…/plans/[planId]", "ویرایش/حذف طرح"),
        ("GET/POST", "…/subscriptions", "اشتراک‌ها و ثبت دستی"), ("PATCH", "…/subscriptions/[subscriptionId]", "فعال/تمدید/لغو"), ("POST", "…/subscriptions/bulk", "عملیات گروهی"),
        ("POST", "…/payments/[paymentId]/refund", "بازپرداخت"), ("GET", "…/reports", "گزارش مالی به تفکیک ارز"), ("GET", "…/export?type=", "خروجی CSV")]),
    ("مربی", [
        ("GET/PATCH", "/api/trainer/profile", "پروفایل حرفه‌ای"), ("GET/POST", "/api/trainer/gyms", "باشگاه‌ها و درخواست همکاری"), ("DELETE", "/api/trainer/gyms/[gymTrainerId]", "پایان همکاری"),
        ("GET/POST", "/api/trainer/clients", "شاگردان و دعوت"), ("PATCH", "/api/trainer/clients/[clientId]", "پذیرش/توقف/پایان"), ("POST", "/api/trainer/clients/[clientId]/nudge", "ارسال یادآور"),
        ("GET/POST", "/api/trainer/workouts", "برنامه‌های تمرینی"), ("GET/PATCH/DELETE", "/api/trainer/workouts/[planId]", "جزئیات/ویرایش/حذف"), ("POST", "…/workouts/[planId]/clone", "کپی برنامه"),
        ("POST", "…/workouts/[planId]/assignments", "تخصیص به شاگرد"), ("PATCH", "/api/trainer/workout-assignments/[id]", "تغییر وضعیت تخصیص"),
        ("GET/POST", "/api/trainer/nutrition", "برنامه‌های غذایی"), ("GET/PATCH/DELETE", "/api/trainer/nutrition/[planId]", "جزئیات/ویرایش/حذف"), ("POST", "…/nutrition/[planId]/clone | assignments", "کپی / تخصیص"),
        ("GET/PUT", "/api/trainer/availability", "بازه‌های در دسترس"), ("GET/POST", "/api/trainer/sessions", "جلسات و رزرو با بررسی تداخل"), ("PATCH/DELETE", "/api/trainer/sessions/[sessionId]", "تغییر وضعیت/لغو"),
        ("POST", "/api/trainer/feedback", "بازخورد روی لاگ شاگرد")]),
    ("عضو", [
        ("GET/PATCH", "/api/user/profile", "پروفایل"), ("POST", "/api/user/gyms/[gymId]/membership", "درخواست عضویت"), ("POST", "/api/user/trainers/[trainerId]/request", "درخواست مربی‌گری"),
        ("POST", "/api/user/checkout", "شروع خرید اشتراک"), ("POST", "/api/user/payments/[paymentId]/confirm", "تأیید پرداخت نمایشی"),
        ("POST", "…/subscriptions/[id]/pause | resume | cancel", "توقف/ازسرگیری/لغو"), ("GET", "…/subscriptions/[id]/receipt", "رسید چاپی"),
        ("GET/POST", "/api/user/workout-logs", "لاگ تمرین"), ("PATCH/DELETE", "/api/user/workout-logs/[logId]", "ویرایش/حذف"), ("GET/POST", "/api/user/nutrition-logs", "لاگ تغذیه"),
        ("GET/POST", "/api/user/measurements", "اندازه‌های بدنی"), ("POST", "/api/user/progress-photos/upload", "آپلود عکس"), ("GET/DELETE", "/api/user/progress-photos/[photoId]", "دریافت/حذف عکس"),
        ("GET/POST", "/api/user/goals", "اهداف"), ("PATCH/DELETE", "/api/user/goals/[goalId]", "به‌روزرسانی/حذف هدف"),
        ("GET/PATCH", "/api/user/notifications", "اعلان‌ها و خوانده‌شدن"), ("GET/PUT", "/api/user/notifications/settings", "تنظیم یادآوری‌ها"),
        ("POST", "/api/user/feedback | …/[id]/reply", "بازخورد و پاسخ"), ("POST", "/api/user/reviews/gyms/[gymId] | trainers/[id]", "امتیازدهی")]),
    ("سیستمی", [
        ("POST/GET", "/api/cron/subscriptions", "زمان‌بند روزانه (CRON_SECRET)"), ("POST", "/api/webhooks/payments/[provider]", "فراخوان برگشتی درگاه (امضای HMAC)"), ("GET", "/api/health", "سلامت‌سنجی و خطاهای اخیر")]),
]

def appendices(N):
    o = []
    # ---- پیوست الف: API
    N.chapter(5); N.ch = "الف"
    o.append(appendix_head("الف", "فهرست مسیرهای API"))
    o.append(p("جدول‌های الف-۱ تا الف-۵ همهٔ ۷۶ مسیر API سامانه را به تفکیک نقش فهرست می‌کنند. همهٔ مسیرها به‌جز ثبت‌نام، ورود، فراموشی/بازنشانی گذرواژه، فراخوان برگشتی و سلامت‌سنجی به نشست معتبر نیاز دارند و پاسخ‌ها با قالب JSON و کدهای وضعیت جدول ۲-۱ برگردانده می‌شوند. علامت «…» به معنی پیشوند " + code("/api/admin/gyms/[gymId]") + " یا مسیر والد بلافاصله قبل است.", "first"))
    for group, rows in API_ROWS:
        o.append(table(f"مسیرهای API – {group}", ["فعل", "مسیر", "شرح"], [[en(m), code(pth), d] for m, pth, d in rows], widths=["16%", "44%", "40%"]))

    # ---- پیوست ب: جدول‌های پایگاه داده
    N.ch = "ب"; N.tab = 0; N.fig = 0
    o.append(appendix_head("ب", "جدول‌های پایگاه داده"))
    o.append(p("طرحوارهٔ کامل در فایل " + code("prisma/schema.prisma") + " (۸۷۳ خط) تعریف شده و از طریق شش مهاجرت SQL اعمال می‌شود. جدول ب-۱ مدل‌ها را با نقش و کلیدهای مهم خلاصه می‌کند. چهار جدول کمکی (" + en("UserSession, EmailVerification, FitnessGoal, NotificationPreference") + ") در نخستین استفاده با " + code("CREATE TABLE IF NOT EXISTS") + " ساخته می‌شوند تا پایگاه‌های موجود بدون مهاجرت جدید کار کنند.", "first"))
    o.append(table("مدل‌های پایگاه داده", ["مدل", "خوشه", "کلیدها و شاخص‌های مهم", "شرح"], [
        [en("User"), "هویت", en("email UK; (role,status)"), "کاربر با نقش سراسری"],
        [en("TrainerProfile"), "هویت", en("userId UK"), "پروفایل حرفه‌ای مربی"],
        [en("Gym"), "باشگاه", en("slug UK; status"), "باشگاه"],
        [en("GymStaff"), "باشگاه", en("(gymId,userId) UK"), "مدیران باشگاه"],
        [en("GymTrainer"), "باشگاه", en("(gymId,trainerId) UK; status"), "همکاری مربی با باشگاه"],
        [en("GymMembership"), "باشگاه", en("(gymId,userId) UK; status"), "عضویت عضو در باشگاه"],
        [en("TrainerClient"), "باشگاه", en("(trainerId,clientId) UK"), "رابطهٔ مربی–شاگرد (مستقل از باشگاه)"],
        [en("SubscriptionPlan"), "اشتراک", en("gymId; audience"), "طرح اشتراک"],
        [en("Subscription"), "اشتراک", en("(subscriberId,status); (endDate,status)"), "اشتراک خریداری‌شده"],
        [en("Payment"), "اشتراک", en("idempotencyKey UK; providerReference UK"), "پرداخت"],
        [en("PaymentEvent"), "اشتراک", en("paymentId"), "رخدادهای درگاه"],
        [en("WorkoutPlan / WorkoutDay / WorkoutExercise"), "برنامه", en("trainerId; (planId,dayIndex)"), "برنامهٔ تمرینی سه‌سطحی"],
        [en("WorkoutAssignment"), "برنامه", en("(planId,clientId); status"), "تخصیص برنامهٔ تمرینی"],
        [en("DietPlan / DietDay / Meal / FoodItem"), "برنامه", en("trainerId"), "برنامهٔ غذایی چهارسطحی"],
        [en("DietAssignment"), "برنامه", en("(planId,clientId)"), "تخصیص برنامهٔ غذایی"],
        [en("TrainerAvailability"), "زمان‌بندی", en("(trainerId,weekday)"), "بازه‌های در دسترس"],
        [en("TrainingSession"), "زمان‌بندی", en("(trainerId,startsAt); status"), "جلسهٔ حضوری"],
        [en("WorkoutLog / ExerciseLog"), "اجرا", en("(userId,performedAt)"), "ثبت اجرای تمرین و ست‌ها"],
        [en("NutritionLog / MealLog"), "اجرا", en("(userId,date)"), "ثبت تغذیه"],
        [en("BodyMeasurement"), "پیشرفت", en("(userId,measuredAt)"), "اندازه‌های بدنی"],
        [en("ProgressPhoto"), "پیشرفت", en("userId"), "عکس پیشرفت (فایل خارج از وب‌روت)"],
        [en("Notification"), "ارتباط", en("(userId,readAt)"), "اعلان‌ها"],
        [en("Feedback"), "ارتباط", en("(recipientId,createdAt)"), "بازخورد مربی/شاگرد"],
        [en("GymReview / TrainerReview"), "ارتباط", en("(gymId|trainerId,userId) UK"), "امتیاز و نظر"],
        [en("AuditLog"), "حسابرسی", en("(gymId,createdAt); actorId"), "ثبت اعمال اداری"],
        [en("UserSession"), "امنیت", en("userId; revokedAt"), "نشست‌های قابل ابطال"],
        [en("EmailVerification, FitnessGoal, NotificationPreference"), "کمکی", en("userId"), "تأیید ایمیل، اهداف، تنظیم یادآوری"],
    ], widths=["28%", "11%", "31%", "30%"]))

    # ---- پیوست ج: استقرار
    N.ch = "ج"; N.tab = 0; N.fig = 0
    o.append(appendix_head("ج", "راهنمای نصب و استقرار"))
    o.append(h3("ج-1", "اجرای محلی"))
    o.append(p("پیش‌نیازها: Node.js نسخهٔ ۲۰ یا بالاتر و npm. مراحل زیر سامانه را با پایگاه دادهٔ SQLite محلی و داده‌های نمونه (جدول ج-۲) راه‌اندازی می‌کند؛ متغیرهای محیطی لازم در جدول ج-۱ آمده‌اند:", "first"))
    o.append('<pre>git clone https://github.com/aghrabooti/KooGYMaa.git &amp;&amp; cd KooGYMaa\nnpm install                     <span class="cm"># نصب وابستگی‌ها و تولید کلاینت Prisma</span>\ncp .env.example .env            <span class="cm"># سپس JWT_SECRET را مقداردهی کنید</span>\nnpx prisma migrate dev          <span class="cm"># ساخت پایگاه داده از مهاجرت‌ها</span>\nnpm run db:seed                 <span class="cm"># دادهٔ نمونه: admin@ / trainer@ / member@koogymaa.test</span>\nnpm run dev                     <span class="cm"># http://localhost:3000</span></pre>')
    o.append(h3("ج-2", "متغیرهای محیطی"))
    o.append(table("متغیرهای محیطی", ["متغیر", "الزامی", "شرح"], [
        [code("DATABASE_URL"), "بله (توسعه)", "مسیر فایل SQLite، مانند " + code("file:./dev.db")],
        [code("LIBSQL_DATABASE_URL"), "بله (عملیاتی)", "نشانی پایگاه دادهٔ میزبانی‌شدهٔ Turso؛ بر DATABASE_URL اولویت دارد"],
        [code("LIBSQL_DATABASE_AUTH_TOKEN"), "بله (عملیاتی)", "توکن دسترسی Turso"],
        [code("JWT_SECRET"), "بله", "رشتهٔ تصادفی حداقل ۳۲ کاراکتر برای امضای نشست"],
        [code("PAYMENT_PROVIDER"), "خیر", "شناسهٔ درگاه؛ پیش‌فرض " + code("demo")],
        [code("PAYMENT_WEBHOOK_SECRET"), "بله", "کلید HMAC برای امضای فراخوان برگشتی"],
        [code("CRON_SECRET"), "بله (عملیاتی)", "توکن محافظ مسیر کرون"],
        [code("APP_URL"), "بله", "نشانی عمومی برنامه برای ساخت پیوندها"],
        [code("SEED_PASSWORD"), "خیر", "گذرواژهٔ حساب‌های نمونه"],
    ], widths=["34%", "16%", "50%"]))
    o.append(h3("ج-3", "استقرار عملیاتی"))
    o.append(p("استقرار توصیه‌شده روی Vercel با پایگاه دادهٔ Turso است: مخزن را به Vercel متصل کنید، متغیرهای جدول بالا را تعریف کنید، با " + code("npm run db:turso:setup") + " مهاجرت‌ها را روی پایگاه میزبانی‌شده اجرا کنید و یک Vercel Cron با زمان‌بندی " + code("0 2 * * *") + " به مسیر " + code("/api/cron/subscriptions") + " اضافه کنید. سلامت سامانه از " + code("/api/health") + " قابل پایش است و " + code("npm run db:backup") + " نسخهٔ پشتیبان می‌گیرد. دستور " + code("npm run check") + " پیش از هر استقرار، تحلیل ایستا، آزمون‌ها، بررسی نوع و ساخت را یک‌جا اجرا می‌کند.", "first"))
    o.append(h3("ج-4", "حساب‌های نمونه"))
    o.append(table("حساب‌های دادهٔ نمونه", ["نقش", "ایمیل", "توضیح"], [
        ["مدیر باشگاه", en("admin@koogymaa.test"), "مدیر دو باشگاه نمونه (Atlas Fitness North، KooGYMaa Central)"],
        ["مربی", en("trainer@koogymaa.test"), "مربی با یک شاگرد فعال و برنامه‌های نمونه"],
        ["عضو", en("member@koogymaa.test"), "عضو با اشتراک فعال و برنامهٔ تمرینی تخصیص‌یافته"],
    ], widths=["20%", "35%", "45%"]))
    o.append("</section>")
    return "\n".join(o)

REFS_FA = [
    ("سمیعی-ک۸۰", "سمیعی (گیلانی)، احمد؛ <i>نگارش و ویرایش</i>؛ چاپ سوم، انتشارات سمت، تهران؛ ۱۳۸۰."),
    ("دانشگاه سمنان-گ۸۷", "دانشکدهٔ برق و کامپیوتر دانشگاه سمنان؛ <i>شیوه‌نامهٔ تدوین و ارائهٔ پایان‌نامه</i>؛ ویرایش دوم؛ شهریور ۱۳۸۷."),
    ("روحانی-ک۹۴", "روحانی رانکوهی، سید محمدتقی؛ <i>مفاهیم بنیادی پایگاه داده‌ها</i>؛ ویرایش سوم، انتشارات جلوه، تهران؛ ۱۳۹۴."),
]
REFS_EN = [
    ("Borkowski-P96", "Borkowski, K. M.; “The Persian Calendar for 3000 Years;” <i>Earth, Moon, and Planets</i>; vol. 74, 1996; pp. 223–230."),
    ("Burke-P11", "Burke, L. E.; Wang, J.; Sevick, M. A.; “Self-Monitoring in Weight Loss: A Systematic Review of the Literature;” <i>Journal of the American Dietetic Association</i>; vol. 111, no. 1, 2011; pp. 92–102."),
    ("Codd-P70", "Codd, E. F.; “A Relational Model of Data for Large Shared Data Banks;” <i>Communications of the ACM</i>; vol. 13, no. 6, 1970; pp. 377–387."),
    ("Cohn-B09", "Cohn, M.; <i>Succeeding with Agile: Software Development Using Scrum</i>; Addison-Wesley; 2009."),
    ("CSSWG-W25", "W3C CSS Working Group; <i>CSS Logical Properties and Values Level 1</i>; Available at https://www.w3.org/TR/css-logical-1/; Accessed Aug. 2026."),
    ("Fielding-T00", "Fielding, R. T.; <i>Architectural Styles and the Design of Network-based Software Architectures</i>; Ph.D. Dissertation, University of California, Irvine; 2000."),
    ("IHRSA-R20", "International Health, Racquet &amp; Sportsclub Association; <i>The 2020 IHRSA Global Report</i>; IHRSA, Boston; 2020."),
    ("Jones-R15", "Jones, M.; Bradley, J.; Sakimura, N.; <i>JSON Web Token (JWT)</i>; RFC 7519, IETF; May 2015."),
    ("Marcotte-W10", "Marcotte, E.; “Responsive Web Design;” <i>A List Apart</i>; no. 306, 2010; Available at https://alistapart.com/article/responsive-web-design/; Accessed Aug. 2026."),
    ("Mindbody-W25", "Mindbody Inc.; <i>Mindbody Business Software</i>; Available at https://www.mindbodyonline.com/; Accessed Aug. 2026."),
    ("Next-W25", "Vercel Inc.; <i>Next.js Documentation: App Router</i>; Available at https://nextjs.org/docs; Accessed Aug. 2026."),
    ("OWASP-W25", "OWASP Foundation; <i>Session Management Cheat Sheet</i>; Available at https://cheatsheetseries.owasp.org/; Accessed Aug. 2026."),
    ("Prisma-W25", "Prisma Data Inc.; <i>Prisma ORM Documentation</i>; Available at https://www.prisma.io/docs; Accessed Aug. 2026."),
    ("Provos-P99", "Provos, N.; Mazières, D.; “A Future-Adaptable Password Scheme;” <i>Proceedings of the USENIX Annual Technical Conference</i>; 1999; pp. 81–92."),
    ("React-W25", "Meta Open Source; <i>React Documentation: Server Components</i>; Available at https://react.dev/reference/rsc/server-components; Accessed Aug. 2026."),
    ("Sandhu-P96", "Sandhu, R. S.; Coyne, E. J.; Feinstein, H. L.; Youman, C. E.; “Role-Based Access Control Models;” <i>IEEE Computer</i>; vol. 29, no. 2, 1996; pp. 38–47."),
    ("SQLite-W25", "Hipp, D. R.; <i>SQLite Documentation</i>; Available at https://www.sqlite.org/docs.html; Accessed Aug. 2026."),
    ("Stripe-W25", "Stripe Inc.; <i>Idempotent Requests – Stripe API Reference</i>; Available at https://stripe.com/docs/api/idempotent_requests; Accessed Aug. 2026."),
    ("Trainerize-W25", "ABC Fitness Solutions; <i>ABC Trainerize</i>; Available at https://www.trainerize.com/; Accessed Aug. 2026."),
    ("WCAG-W23", "W3C Web Accessibility Initiative; <i>Web Content Accessibility Guidelines (WCAG) 2.2</i>; W3C Recommendation; Oct. 2023."),
]

def references(N):
    o = ['<section class="chapter-start refs"><div class="chapter-head" id="refs" data-toc="1" data-title="منابع و مراجع" data-appendix="1"><div class="chapter-title">منابع و مراجع</div></div>']
    o.append(p("منابع به ترتیب حروف الفبای نام نویسندهٔ اول، جداگانه برای منابع فارسی و غیرفارسی، فهرست شده‌اند. حرف پس از خط تیره نوع منبع را نشان می‌دهد: م = مقاله، ک = کتاب، و = صفحهٔ وب، گ = گزارش، پ = پایگاه اطلاعاتی (به ترتیب P، B، W، R، D و T = رساله برای منابع انگلیسی).", "first"))
    for k, t in REFS_FA: o.append(f'<p><span class="key">[{k}]</span> {t}</p>')
    o.append('<div class="spacer"></div>')
    for k, t in REFS_EN: o.append(f'<p class="en"><span class="key">[{k}]</span> {t}</p>')
    o.append("</section>")
    return "\n".join(o)

ABSTRACT_EN = '''<div class="page abstract-en" id="abstract-en">
  <h2>Abstract</h2>
  <p>The rapid growth of the fitness industry has not been matched by its management tooling. Gym owners, trainers and athletes typically rely on disconnected instruments—cash-register software, spreadsheets, paper programs and messaging apps—so training history is fragmented, subscription renewals are tracked by hand, and the choice of a coach is effectively limited to whoever happens to work at the nearest gym. When an athlete changes gyms, the relationship with the coach and the entire training record are usually lost.</p>
  <p>This thesis presents the design and implementation of <b>KooGYMaa</b>, an integrated web platform that brings the three roles—gym administrator, trainer and member—into a single shared workspace. Administrators approve members and trainers, define subscription plans, monitor payments with per-currency financial reports and export CSV data. Trainers author structured workout and nutrition programs, assign them to clients, schedule in-person sessions with conflict detection and give feedback. Members execute and log their programs, track body measurements, streaks and goals, purchase subscriptions and may work with any gym or trainer on the platform, while their history remains attached to their own account. The system is built with Next.js 16, React 19, TypeScript and Prisma 7 on SQLite/libSQL; it is fully bilingual (right-to-left Persian with the Jalali calendar, and English), responsive with a dark mode, and includes JWT authentication with revocable sessions, rate limiting, audit logging and automated subscription life-cycle management. Domain logic is verified by 76 unit tests and the responsive layout by 198 automated page/viewport checks.</p>
  <p>The result is a deployable product that removes tool fragmentation, lowers gym operating overhead, extends the coach–athlete relationship beyond the walls of a single facility and preserves the athlete's training record independently of any gym.</p>
  <p><b><i>Keywords:</i></b> Gym management system; Integrated web platform; Workout and nutrition programs; Subscription and payment management; Next.js; Prisma; Persian localization.</p>
</div>'''

def english_title_page():
    return f'''<div class="page tp tp-en">
  <img class="logo" src="{LOGO}" alt="">
  <div class="faculty">Semnan University<br>Faculty of Electrical &amp; Computer Engineering</div>
  <div class="degree">B.Sc. Thesis in Computer Engineering – Software</div>
  <div class="title">{TITLE_EN}</div>
  <div class="label">By:</div>
  <div class="name"><span class="blank-line"></span></div>
  <div class="label">Supervisor:</div>
  <div class="name"><span class="blank-line"></span></div>
  <div class="date"><span class="blank-line"></span></div>
</div>'''

def english_back(N):
    tp = english_title_page().replace('class="page tp tp-en"', 'class="page tp tp-en" data-nonum="1"')
    return "\n".join([ABSTRACT_EN, tp, '<div class="page blank" data-nonum="1"></div>', tp])
