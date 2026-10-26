const { db } = require('./db');

console.log('Enriching store products, messages, and exam results...');

const addProduct = db.prepare(`
  INSERT INTO store_products (title, type, price, old_price, badge, icon, bg_color, meta, description)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const existingTitles = db.prepare('SELECT title FROM store_products').all().map(p => p.title);

const newProducts = [
  ['بسته محاسبات سریع ذهنی و چرتکه', 'course', 280000, 350000, 'پرفروش‌ترین', 'zap', '#FEF3C7', '۸ جلسه ویدیویی • جزوه تمرینی', 'تکنیک‌های محاسبات ذهنی سریع ضرب و تقسیم برای آزمون‌های ورودی تیزهوشان و المپیاد'],
  ['دفتر برنامه‌ریزی اختصاصی نخبگان رشد', 'booklet', 95000, 120000, 'اختصاصی کانون', 'book-open', '#E0F2FE', '۱۶۰ صفحه تمام‌رنگی • جدول پومودورو', 'دفتر هفتگی ثبت ساعات مطالعه، ارزیابی روزانه و نظارت والدین و پشتیبان آموزشی'],
  ['کتاب جامع تست تیزهوشان نهم به دهم', 'booklet', 340000, 420000, 'ویژه سمپاد', 'award', '#F3E8FF', '۵۵۰ صفحه • پاسخ تشریحی جامع', 'بانک تست‌های طبقه‌بندی شده استعداد تحلیلی و دروس عمومی و تخصصی ورودی مدارس نمونه و تیزهوشان'],
  ['فلش‌کارت واژگان کلیدی زبان انگلیسی تیزهوشان', 'booklet', 85000, 110000, 'کاربردی', 'languages', '#DCFCE7', '۲۰۰ فلش‌کارت جعبه لایتنر', 'آموزش لغات با تصویرسازی ذهنی، مترادف، متضاد و مثال‌های کاربردی در آزمون‌های ورودی']
];

newProducts.forEach(p => {
  if (!existingTitles.includes(p[0])) {
    addProduct.run(...p);
  }
});

// Add more messages
const addMsg = db.prepare(`
  INSERT INTO messages (sender_id, receiver_id, sender_name, receiver_name, text, time_fa)
  VALUES (?, ?, ?, ?, ?, ?)
`);

addMsg.run(2, 5, 'خانم احمدی (معلم)', 'علی رضایی', 'سلام علی جان، تمرین‌های درس علوم رو بررسی کردم، عملکردت عالی بود. برای فصل بعد هم سوالات اضافه برات می‌فرستم.', '۱۰:۴۵');
addMsg.run(3, 5, 'استاد کریمی (دبیر ریاضی)', 'علی رضایی', 'آفرین علی، مأموریت فضایی بخش کسرها رو با دقت خیلی خوبی به پایان رسوندی.', '۱۲:۱۵');

console.log('Total store products now:', db.prepare('SELECT COUNT(*) as c FROM store_products').get().c);
console.log('Total messages now:', db.prepare('SELECT COUNT(*) as c FROM messages').get().c);
