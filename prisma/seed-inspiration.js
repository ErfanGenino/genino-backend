// prisma/seed-inspiration.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const items = [
    // calm
    {
      mode: "calm",
      quote: "آرامش یعنی تواناییِ برگشتن به اکنون.",
      author: "Genino",
      exerciseTitle: "تنفس ۳ دقیقه‌ای",
      exerciseText: "۳ دقیقه: ۴ ثانیه دم، ۴ ثانیه مکث، ۶ ثانیه بازدم. فقط ادامه بده.",
      durationSec: 180,
      reflectionQuestion: "الان دقیقاً چه چیزی از من انرژی می‌گیرد؟",
      reflectionHint: "فقط یک جمله واقع‌بینانه بنویس.",
    },
    {
      mode: "calm",
      quote: "امروز لازم نیست کامل باشی؛ فقط یک قدم آگاهانه‌تر بردار.",
      author: "Genino",
      exerciseTitle: "اسکن بدن",
      exerciseText: "از سر تا پا، ۳ دقیقه بدن را اسکن کن. هرجا تنش هست، نرم‌ترش کن.",
      durationSec: 180,
      reflectionQuestion: "اگر امروز فقط آرام‌تر واکنش بدهم، کجا بهتر می‌شود؟",
      reflectionHint: "یک موقعیت مشخص را بنویس.",
    },
    {
      mode: "calm",
      quote: "نفسِ عمیق، کلیدِ بازگشت به کنترل است.",
      author: "Genino",
      exerciseTitle: "تنفس 4-4-6",
      exerciseText: "۴ ثانیه دم، ۴ ثانیه نگه‌دار، ۶ ثانیه بازدم. ۳ دقیقه تکرار.",
      durationSec: 180,
      reflectionQuestion: "کدام فکرِ تکراری امروز باید رها شود؟",
      reflectionHint: "اسمش را بنویس و کنارش بنویس: «فعلاً نه».",
    },
    {
      mode: "calm",
      quote: "آرامش از بیرون نمی‌آید؛ از نظمِ درون ساخته می‌شود.",
      author: "Genino",
      exerciseTitle: "پاکسازی ذهن",
      exerciseText: "۳ دقیقه فقط بنویس: نگرانی‌ها، کارها، احساسات. بدون حل کردن.",
      durationSec: 180,
      reflectionQuestion: "امروز چه چیزی را می‌توانم ساده‌تر کنم؟",
      reflectionHint: "یک چیز کوچک را انتخاب کن.",
    },

    // focus
    {
      mode: "focus",
      quote: "تمرکز یعنی نه گفتن به حواس‌پرتی‌های کوچک.",
      author: "Genino",
      exerciseTitle: "یک کار، یک بازه",
      exerciseText: "فقط یک کار انتخاب کن. ۳ دقیقه شروع کن. هدف فقط شروع است.",
      durationSec: 180,
      reflectionQuestion: "مهم‌ترین کار امروز من چیست؟",
      reflectionHint: "یک جمله کوتاه و قطعی.",
    },
    {
      mode: "focus",
      quote: "شروعِ کوچک، پایانِ بزرگ می‌سازد.",
      author: "Genino",
      exerciseTitle: "قفل تمرکز",
      exerciseText: "۳ دقیقه اعلان‌ها را خاموش کن و فقط یک کار را جلو ببر.",
      durationSec: 180,
      reflectionQuestion: "کدام عامل بیشترین حواس‌پرتی را ایجاد می‌کند؟",
      reflectionHint: "یک مرز کوچک برایش بنویس.",
    },
    {
      mode: "focus",
      quote: "کسی جلو می‌افتد که هر روز کمی جلو می‌رود.",
      author: "Genino",
      exerciseTitle: "لیست سه‌تایی",
      exerciseText: "۳ دقیقه: فقط ۳ کار امروز را بنویس. بقیه را فعلاً حذف کن.",
      durationSec: 180,
      reflectionQuestion: "اگر فقط یکی را انجام بدهم، کدام ارزشمندتر است؟",
      reflectionHint: "اسمش را واضح بنویس.",
    },
    {
      mode: "focus",
      quote: "حواس‌پرتی گاهی فقط «فرار از سختی» است.",
      author: "Genino",
      exerciseTitle: "اولین قدم",
      exerciseText: "۳ دقیقه: سخت‌ترین کار را به «اولین قدم» خرد کن و همان را انجام بده.",
      durationSec: 180,
      reflectionQuestion: "این کار سخت چرا سخت است؟",
      reflectionHint: "یک دلیل بنویس، بعد یک راه کوچک.",
    },

    // energy
    {
      mode: "energy",
      quote: "انرژی از حرکت می‌آید؛ حتی حرکت کوچک.",
      author: "Genino",
      exerciseTitle: "۳ دقیقه حرکت",
      exerciseText: "۳۰ ثانیه راه رفتن + ۳۰ ثانیه کشش گردن و شانه‌ها (۳ بار).",
      durationSec: 180,
      reflectionQuestion: "امروز بدن من چه چیزی لازم دارد؟",
      reflectionHint: "خواب؟ آب؟ حرکت؟ یکی را انتخاب کن.",
    },
    {
      mode: "energy",
      quote: "بدنِ تو سرمایه‌ی توست؛ خرجش کن، نه نابودش کن.",
      author: "Genino",
      exerciseTitle: "آب و تنفس",
      exerciseText: "یک لیوان آب + ۱۰ نفس عمیق. همین.",
      durationSec: 180,
      reflectionQuestion: "کدام عادت انرژی من را می‌دزدد؟",
      reflectionHint: "یک مورد را بنویس و یک اصلاح کوچک.",
    },
    {
      mode: "energy",
      quote: "وقتی بدن روشن می‌شود، ذهن هم روشن می‌شود.",
      author: "Genino",
      exerciseTitle: "کشش سریع",
      exerciseText: "۳ دقیقه کشش دست‌ها، پشت، پاها. آرام و بدون فشار.",
      durationSec: 180,
      reflectionQuestion: "امروز چه چیزی می‌تواند انرژی‌ام را بیشتر کند؟",
      reflectionHint: "یک اقدام کوچک و فوری.",
    },
    {
      mode: "energy",
      quote: "کم انرژی؟ یک شروع کوتاه کافی است.",
      author: "Genino",
      exerciseTitle: "شروع نرم",
      exerciseText: "۳ دقیقه فقط قدم بزن. هدف فقط بیدار کردن بدن است.",
      durationSec: 180,
      reflectionQuestion: "امروز کجا باید به بدنم احترام بگذارم؟",
      reflectionHint: "یک تصمیم ساده.",
    },

    // relation
    {
      mode: "relation",
      quote: "رابطه‌ها با توجه زنده‌اند، نه با بحث.",
      author: "Genino",
      exerciseTitle: "پیام قدردانی",
      exerciseText: "برای یک نفر یک پیام واقعی قدردانی بفرست. کوتاه و صادقانه.",
      durationSec: 180,
      reflectionQuestion: "امروز چه رفتاری رابطه‌ی من را بهتر می‌کند؟",
      reflectionHint: "یک مورد مشخص.",
    },
    {
      mode: "relation",
      quote: "محبتِ کوچکِ امروز، امنیتِ بزرگِ فرداست.",
      author: "Genino",
      exerciseTitle: "یک جمله خوب",
      exerciseText: "۳ دقیقه: یک جمله‌ی خوب برای همسر/خانواده آماده کن و بگو.",
      durationSec: 180,
      reflectionQuestion: "کدام انتظارِ نگفته باعث دلخوری می‌شود؟",
      reflectionHint: "با احترام بنویس.",
    },
    {
      mode: "relation",
      quote: "گفتنِ «می‌فهممت» گاهی همه چیز را عوض می‌کند.",
      author: "Genino",
      exerciseTitle: "گوش دادن واقعی",
      exerciseText: "۳ دقیقه: در گفت‌وگو فقط گوش بده. نه نصیحت، نه دفاع.",
      durationSec: 180,
      reflectionQuestion: "امروز کجا باید کمتر واکنش و بیشتر فهم کنم؟",
      reflectionHint: "یک موقعیت واقعی.",
    },
    {
      mode: "relation",
      quote: "عشق با کارهای کوچک ساخته می‌شود.",
      author: "Genino",
      exerciseTitle: "کمک کوچک",
      exerciseText: "یک کار کوچک برای یک نفر انجام بده؛ بی‌منت و ساده.",
      durationSec: 180,
      reflectionQuestion: "چطور می‌توانم مهربان‌تر اما مرزبندی‌شده‌تر باشم؟",
      reflectionHint: "یک جمله بنویس.",
    },

    // discipline
    {
      mode: "discipline",
      quote: "پایداری از تکرارِ کوچک می‌آید.",
      author: "Genino",
      exerciseTitle: "نظم ۳ دقیقه‌ای",
      exerciseText: "فقط یک چیز را مرتب کن: میز، کیف، یا فایل‌ها. همین.",
      durationSec: 180,
      reflectionQuestion: "کوچک‌ترین عادتی که اگر شروع کنم مفید است چیست؟",
      reflectionHint: "قابل انجام تعریفش کن.",
    },
    {
      mode: "discipline",
      quote: "نظم یعنی انجام دادن، حتی وقتی حسش نیست.",
      author: "Genino",
      exerciseTitle: "یک شروع کوتاه",
      exerciseText: "۳ دقیقه فقط شروع کن. بعد تصمیم بگیر ادامه بده یا نه.",
      durationSec: 180,
      reflectionQuestion: "امروز کجا بهانه می‌آورم؟",
      reflectionHint: "یک بهانه را بنویس و جایگزینش را تعیین کن.",
    },
    {
      mode: "discipline",
      quote: "عادت‌ها تو را می‌سازند، نه انگیزه‌ها.",
      author: "Genino",
      exerciseTitle: "قانون یک کار",
      exerciseText: "یک کار کوچک را انتخاب کن و همین امروز انجامش بده. تمام.",
      durationSec: 180,
      reflectionQuestion: "اگر فقط یک قانون برای خودم بگذارم، چیست؟",
      reflectionHint: "یک جمله‌ی کوتاه.",
    },
    {
      mode: "discipline",
      quote: "هر روز یک قدم، یعنی تو جدی هستی.",
      author: "Genino",
      exerciseTitle: "برنامه ۳ دقیقه‌ای",
      exerciseText: "۳ دقیقه: فردا را در ۳ خط بنویس. ۱) مهم‌ترین کار ۲) مراقبت از بدن ۳) یک رابطه",
      durationSec: 180,
      reflectionQuestion: "فردا چطور می‌خواهم شروع کنم؟",
      reflectionHint: "یک جمله‌ی دقیق.",
    },
  ];

  // ✅ جلوگیری از تکرار: اگر quote+mode موجود بود، رد کن
  let created = 0;
  for (const it of items) {
    const exists = await prisma.inspirationItem.findFirst({
      where: { mode: it.mode, quote: it.quote },
      select: { id: true },
    });
    if (!exists) {
      await prisma.inspirationItem.create({ data: it });
      created++;
    }
  }

  const total = await prisma.inspirationItem.count();
  console.log(`✅ Seed done. created=${created}, total=${total}`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });