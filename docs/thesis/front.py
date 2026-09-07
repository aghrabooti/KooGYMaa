# -*- coding: utf-8 -*-
"""Front matter: cover, بسم‌الله, title page, rights, approval, dedication, acknowledgement, abstract, TOC placeholders."""
from build import fa, en, p, table

TITLE_FA = "طراحی و پیاده‌سازی سامانهٔ یکپارچهٔ مدیریت باشگاه، مربی و ورزشکار (کوجیما)"
TITLE_FA_2L = "طراحی و پیاده‌سازی سامانهٔ یکپارچهٔ<br>مدیریت باشگاه، مربی و ورزشکار (کوجیما)"
TITLE_EN = "Design &amp; Implementation of an Integrated<br>Gym, Trainer and Athlete Management Platform (KooGYMaa)"
LOGO = "img/logo_p1_3.png"
DOTS = '<span class="blank-line"></span>'

def title_page(cover=False):
    return f'''<div class="page tp">
  <img class="logo" src="{LOGO}" alt="">
  <div class="faculty">دانشکدهٔ برق و کامپیوتر</div>
  <div class="degree">پایان‌نامهٔ کارشناسی مهندسی کامپیوتر – گرایش نرم‌افزار</div>
  <div class="title">{TITLE_FA_2L}</div>
  <div class="label">نگارش:</div>
  <div class="name">{DOTS}</div>
  <div class="label">استاد راهنما:</div>
  <div class="name">{DOTS}</div>
  <div class="date">{DOTS}</div>
</div>'''

def bismillah():
    return '''<div class="page bism" id="bismillah" data-nonum="1"><div class="bism-inner">بسم الله الرحمن الرحیم</div></div>'''

def rights_page():
    return f'''<div class="page">
  <div class="rights">
    <div>اینجانب(ان) <span class="dot" style="min-width:6cm"></span> بدین‌وسیله اظهار می‌دارم که محتوای علمی این نوشتار با عنوان</div>
    <div class="center" style="font-weight:700">«{TITLE_FA}»</div>
    <div>که به‌عنوان پایان‌نامهٔ کارشناسی مهندسی کامپیوتر – گرایش نرم‌افزار به دانشکدهٔ برق و کامپیوتر دانشگاه سمنان ارائه شده، دارای اصالت پژوهشی بوده و حاصل فعالیت علمی اینجانب(ان) است.</div>
    <div>اینجانب(ان) می‌دانم که اگر خلاف ادعای بالا محرز شود، کلیهٔ حقوق مترتب بر این نوشتار از اینجانب(ان) سلب شده و مراتب قانونی مرتبط با آن نیز از طرف ذی‌ربط قابل پیگیری است.</div>
    <div class="sig"><div>نام و نام خانوادگی – شمارهٔ دانشجویی<br><br>تاریخ و امضا</div><div>نام و نام خانوادگی – شمارهٔ دانشجویی<br><br>تاریخ و امضا</div></div>
    <div class="note">این فرم به‌صورت دست‌نویس تکمیل می‌شود.</div>
  </div>
</div>'''

def approval_page():
    return f'''<div class="page approval">
  <div>به نام خدا</div>
  <img class="logo" src="{LOGO}" alt="">
  <div class="faculty" style="font-family:'Titr';font-size:16pt">دانشکدهٔ برق و کامپیوتر</div>
  <div class="line" style="font-family:'Titr';font-size:15pt;margin-top:0.8cm">تأیید دفاع از پایان‌نامهٔ کارشناسی</div>
  <div class="line">پایان‌نامهٔ <span class="dot" style="min-width:5.5cm"></span></div>
  <div class="line">برای اخذ درجهٔ <b>کارشناسی مهندسی کامپیوتر – گرایش نرم‌افزار</b></div>
  <div class="line">با عنوان:</div>
  <div class="big">{TITLE_FA_2L}</div>
  <div class="line">در تاریخ <span class="dot" style="min-width:3.5cm"></span> دفاع شد و مورد تأیید قرار گرفت.</div>
  <div class="signers">
    <div>تأییدکنندگان:</div>
    <div><span>۱) استاد محترم داور</span><span class="dots"></span><span>امضا</span></div>
    <div><span>۲) استاد محترم راهنما</span><span class="dots"></span><span>امضا</span></div>
    <div><span>۳) مدیر محترم گروه مهندسی کامپیوتر</span><span class="dots"></span><span>امضا</span></div>
  </div>
</div>'''

def dedication():
    return '''<div class="page"><div class="dedication">تقدیم به<br>همهٔ مربیانی که با حوصله راه را نشان می‌دهند<br>و همهٔ ورزشکارانی که هر روز از دیروزِ خود بهتر می‌شوند.</div></div>'''

def acknowledgement():
    return '''<div class="page">
  <div class="front-title" style="text-align:right">سپاس‌گزاری</div>
  <p class="first">از استاد راهنمای گرامی که در تمام مراحل تعریف مسئله، طراحی و پیاده‌سازی این سامانه با راهنمایی‌های دقیق و صبورانه همراه بودند، صمیمانه سپاس‌گزارم. همچنین از اساتید محترم داور که با نقد سازنده به بهبود این نوشتار کمک کردند، و از مربیان و مدیران باشگاه‌هایی که با صرف وقت، نیازها و مشکلات روزمرهٔ کار خود را برای ما توضیح دادند و در ارزیابی نسخه‌های آزمایشی سامانه مشارکت کردند، قدردانی می‌کنم.</p>
  <p>در پایان از خانواده‌ام که در طول این مسیر پشتیبان بی‌دریغ من بودند، تشکر می‌کنم.</p>
</div>'''

ABSTRACT_FA = '''<div class="page abstract" id="abstract">
  <h2>چکیده</h2>
  <p>گسترش فرهنگ تناسب‌اندام در سال‌های اخیر با رشد سریع تعداد باشگاه‌ها و مربیان خصوصی همراه بوده است؛ اما ابزارهای مدیریتی این حوزه همچنان پراکنده و جزیره‌ای‌اند: ورزشکار برنامهٔ تمرینی خود را روی کاغذ یا در پیام‌رسان دریافت می‌کند، مربی پیشرفت شاگردان را در دفترچه یا صفحه‌گسترده نگه می‌دارد و مدیر باشگاه برای اشتراک‌ها و پرداخت‌ها نرم‌افزار جداگانه‌ای دارد. افزون بر این، انتخاب مربی و باشگاه عملاً به محدودهٔ جغرافیایی محل سکونت فرد محدود می‌شود و سابقهٔ تمرینی ورزشکار با تغییر باشگاه از بین می‌رود.</p>
  <p>در این پروژه سامانهٔ تحت وب «کوجیما» (KooGYMaa) طراحی و پیاده‌سازی شد که سه نقش مدیر باشگاه، مربی و عضو را در یک فضای کاری یکپارچه گرد هم می‌آورد. مدیر باشگاه اعضا و مربیان را می‌پذیرد، طرح‌های اشتراک تعریف می‌کند و پرداخت‌ها را با گزارش مالی به تفکیک ارز و خروجی CSV پایش می‌کند. مربی برنامه‌های تمرینی و غذایی ساخت‌یافته می‌سازد، آن‌ها را به شاگردان تخصیص می‌دهد، جلسات حضوری را با بررسی تداخل زمان‌بندی می‌کند و بازخورد می‌دهد. عضو برنامه‌ها را اجرا و ثبت می‌کند، پیشرفت بدنی و استریک تمرینی خود را می‌بیند، اشتراک می‌خرد و از هر باشگاه یا مربی در پلتفرم بهره می‌برد. سامانه با Next.js 16، React 19، TypeScript و Prisma 7 روی پایگاه دادهٔ SQLite/libSQL پیاده‌سازی شده، کاملاً دوزبانه (فارسی راست‌به‌چپ با تقویم جلالی و انگلیسی) و واکنش‌گرا است، حالت روز/شب دارد و از احراز هویت مبتنی بر JWT با نشست‌های قابل ابطال، محدودیت نرخ درخواست، ثبت رخداد و اتوماسیون چرخهٔ عمر اشتراک‌ها پشتیبانی می‌کند. صحت منطق دامنه با ۷۶ آزمون واحد و واکنش‌گرایی رابط کاربری با ۱۹۸ ترکیب صفحه/اندازهٔ نمایش به‌صورت خودکار تأیید شده است.</p>
  <p>نتیجهٔ کار، محصولی قابل استقرار است که با حذف پراکندگی ابزارها هزینهٔ عملیاتی باشگاه را کاهش می‌دهد، ارتباط مربی و ورزشکار را از محدودهٔ یک باشگاه فراتر می‌برد و سابقهٔ تمرینی فرد را مستقل از باشگاه حفظ می‌کند.</p>
  <p class="kw"><b><i>کلیدواژگان:</i></b> مدیریت باشگاه ورزشی؛ سامانهٔ یکپارچهٔ تحت وب؛ برنامهٔ تمرینی و غذایی؛ مدیریت اشتراک و پرداخت؛ Next.js؛ Prisma؛ بومی‌سازی فارسی.</p>
</div>'''

def cover_and_front(N):
    parts = [
        title_page(cover=True).replace('class="page tp"', 'class="page tp" data-nonum="1"'),   # جلد راست
        '<div class="page blank" data-nonum="1"></div>',   # سفید
        bismillah(),                          # الف
        title_page(),                         # ب – صفحهٔ عنوان فارسی
        rights_page(),                        # ج
        approval_page(),                      # د
        dedication(),                         # هـ
        acknowledgement(),                    # و
        ABSTRACT_FA,                          # ز
        '<div id="toc-placeholder"></div>',   # ح – فهرست مطالب / شکل‌ها / جدول‌ها (filled in post-pass)
    ]
    return "\n".join(parts)
