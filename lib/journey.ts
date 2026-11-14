/**
 * Journey calculation for members - how many months as student
 * برای ممبر نیما مسیر بساز که چند ماهه شاگرد هست
 */

export type JourneyMonth = {
  monthNumber: number;
  monthNameFa: string;
  date: Date;
  weightKg?: number;
  bodyFatPercent?: number;
  waistCm?: number;
  chestCm?: number;
  armCm?: number;
  notes?: string;
  achievements: string[];
};

export function calculateMonthsAsStudent(startedAt: Date, now: Date = new Date()): number {
  const years = now.getFullYear() - startedAt.getFullYear();
  const months = now.getMonth() - startedAt.getMonth();
  let totalMonths = years * 12 + months;
  // If day of month hasn't passed yet, subtract one
  if (now.getDate() < startedAt.getDate()) {
    totalMonths--;
  }
  return Math.max(0, totalMonths);
}

export function calculateDaysAsStudent(startedAt: Date, now: Date = new Date()): number {
  const diff = now.getTime() - startedAt.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function formatJourneyDuration(startedAt: Date, now: Date = new Date()): string {
  const months = calculateMonthsAsStudent(startedAt, now);
  const days = calculateDaysAsStudent(startedAt, now);
  
  if (months === 0) {
    return `${days} روز`;
  }
  if (months === 1) {
    return `۱ ماه و ${days % 30} روز`;
  }
  const remainingDays = days - months * 30;
  if (remainingDays > 0) {
    return `${months} ماه و ${remainingDays} روز`;
  }
  return `${months} ماه`;
}

export function getMonthNameFa(monthIndex: number): string {
  const months = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
  ];
  // Convert Gregorian month to approximate Jalali
  // Simplified mapping
  return months[monthIndex % 12];
}

export function buildNimaJourney(): JourneyMonth[] {
  const now = new Date();
  const journey: JourneyMonth[] = [
    {
      monthNumber: 1,
      monthNameFa: "ماه اول - شروع",
      date: new Date(now.getFullYear(), now.getMonth() - 5, 15),
      weightKg: 85.2,
      bodyFatPercent: 22.5,
      waistCm: 92,
      chestCm: 100,
      armCm: 33,
      notes: "شروع مسیر با سارا - وزن اولیه ۸۵.۲ کیلو، چربی ۲۲.۵٪",
      achievements: ["ثبت نام در KooGYMaa Central", "شروع برنامه Foundation Strength", "اولین جلسه با سارا"],
    },
    {
      monthNumber: 2,
      monthNameFa: "ماه دوم - قدرت گیری",
      date: new Date(now.getFullYear(), now.getMonth() - 4, 15),
      weightKg: 84.0,
      bodyFatPercent: 21.0,
      waistCm: 90,
      chestCm: 100.5,
      armCm: 33.5,
      notes: "کاهش ۱.۲ کیلو، بهبود فرم اسکوات و ددلیفت",
      achievements: ["کاهش ۱.۲ کیلوگرم", "افزایش قدرت ۱۵٪", "بهبود فرم حرکات"],
    },
    {
      monthNumber: 3,
      monthNameFa: "ماه سوم - پایان قدرت پایه",
      date: new Date(now.getFullYear(), now.getMonth() - 3, 15),
      weightKg: 82.8,
      bodyFatPercent: 19.8,
      waistCm: 88.5,
      chestCm: 101,
      armCm: 34,
      notes: "پایان فاز قدرت پایه، قدرت ۲۰٪ افزایش، آماده برای هایپرتروفی",
      achievements: ["پایان Foundation Strength", "شروع قدرت پیشرفته سطح ۲", "کاهش ۲.۴ کیلو کل"],
    },
    {
      monthNumber: 4,
      monthNameFa: "ماه چهارم - حجم گیری",
      date: new Date(now.getFullYear(), now.getMonth() - 2, 15),
      weightKg: 81.5,
      bodyFatPercent: 18.5,
      waistCm: 87,
      chestCm: 101.5,
      armCm: 34.5,
      notes: "شروع فاز هایپرتروفی ۴ روزه، حجم عضلانی در حال افزایش",
      achievements: ["شروع هایپرتروفی ۴ روزه", "افزایش حجم سینه و بازو", "رژیم ۳۰۰۰ کالری"],
    },
    {
      monthNumber: 5,
      monthNameFa: "ماه پنجم - کات",
      date: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      weightKg: 80.8,
      bodyFatPercent: 17.2,
      waistCm: 85.5,
      chestCm: 102,
      armCm: 35,
      notes: "فاز کات شروع شد، رژیم ۲۰۰۰ کالری، چربی سوزی فعال",
      achievements: ["شروع رژیم کات ۲۰۰۰ کالری", "برنامه HIIT چربی سوزی", "کاهش سایز کمر ۶.۵ سانت"],
    },
    {
      monthNumber: 6,
      monthNameFa: "ماه ششم - الان",
      date: now,
      weightKg: 80.0,
      bodyFatPercent: 16.0,
      waistCm: 84,
      chestCm: 102.5,
      armCm: 35.5,
      notes: "ماه ششم: ۵.۲ کیلو کاهش وزن، ۶.۵٪ چربی کمتر، ۲.۵ سانت افزایش بازو، ۲.۵ سانت افزایش سینه",
      achievements: ["۶ ماه شاگرد سارا", "۵.۲ کیلو کاهش وزن", "۶.۵٪ کاهش چربی", "۲.۵ سانت افزایش بازو", "۲.۵ سانت افزایش سینه", "۸ سانت کاهش کمر"],
    },
  ];
  return journey;
}
