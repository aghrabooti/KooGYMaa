# پایان‌نامهٔ کوجیما – منبع و خروجی

این پوشه منبع کامل پایان‌نامهٔ «طراحی و پیاده‌سازی سامانهٔ یکپارچهٔ مدیریت باشگاه، مربی و ورزشکار (کوجیما)» است که
بر اساس «شیوه‌نامهٔ تدوین و ارائهٔ پایان‌نامه» دانشکدهٔ برق و کامپیوتر دانشگاه سمنان (ویرایش دوم، ۱۳۸۷) تولید می‌شود.

* `thesis.pdf` – خروجی نهایی (A4، بیش از ۱۱۰ صفحه)
* `build.py` – تولیدکنندهٔ HTML؛ فصل‌ها در `front.py`, `ch1.py` … `ch4.py`, `back.py`
* `style.css` – قواعد صفحه‌آرایی شیوه‌نامه (حاشیه‌ها، قلم‌ها، شماره‌گذاری، پانویس)
* `paged.mjs` – تبدیل HTML به PDF با paged.js (پانویس پای صفحه، شروع فصل در صفحهٔ فرد، شمارهٔ صفحه‌های ابجد/فارسی، شمارهٔ صفحه در فهرست‌ها)
* `diagrams.mjs` – تعریف و رندر نمودارهای Mermaid به `diag/`
* `shots.mjs` – گرفتن تصاویر صفحات سامانه از سرور توسعه به `shots/`
* `fonts/` – قلم‌های آزاد IRNazanin / IRTitr / IRLotus (جایگزین B Nazanin) و Tinos

## بازتولید

```bash
# ابزارها (یک بار): playwright + @sparticuz/chromium + pagedjs + mermaid
mkdir -p /tmp/tools && cd /tmp/tools && npm i playwright @sparticuz/chromium pagedjs@0.4.3 mermaid@11
export THESIS_TOOLS=/tmp/tools

cd docs/thesis
node diagrams.mjs                # نمودارها (اختیاری – خروجی‌ها در مخزن هستند)
node shots.mjs                   # تصاویر (نیاز به سرور توسعه روی APP_URL)
python3 build.py                 # → thesis.html + numbering.json
node paged.mjs "$PWD/thesis.html" "$PWD/thesis.pdf" "$PWD/pagemap.json"
```

فیلدهای شخصی (نام دانشجو، استاد راهنما، تاریخ دفاع) عمداً خالی گذاشته شده‌اند و در `front.py` / `back.py` قابل تکمیل‌اند.
