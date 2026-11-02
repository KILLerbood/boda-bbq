// BODA BBQ: menu + build-your-burger data. Prices in SAR.
export const CONFIG = {
  // WhatsApp in international format, digits only (Saudi: 9665XXXXXXXX).
  // Empty = online ordering shows "coming soon" so no order is ever lost.
  whatsapp: '',
  delivery: 10,
  mealExtra: 12,
  maxQty: 20,
};

const P = (id) => `assets/menu/${id}.webp`;

export const MENU = [
  { id: 'classic', cat: 'beef', price: 29, img: P('classic'), badge: 'top',
    en: { n: 'The Boda Classic', d: '160g flame-grilled beef, cheddar, lettuce, tomato and our secret Boda sauce.' },
    ar: { n: 'بودة كلاسيك', d: 'لحم بقري ١٦٠ جرام على الفحم، شيدر، خس، طماطم وصوص بودة السري.' } },
  { id: 'smoky', cat: 'beef', price: 39, img: P('smoky'), badge: 'smoked',
    en: { n: 'Smoky Fire', d: 'Two beef patties, smoked beef bacon, melted cheddar and BBQ sauce.' },
    ar: { n: 'سموكي فاير', d: 'قطعتين لحم بقري، بيكن بقري مدخن، شيدر ذايب وصوص باربكيو.' } },
  { id: 'double', cat: 'beef', price: 42, img: P('double'),
    en: { n: 'Double Smash', d: 'Two crispy-edged smash patties, double American cheese, pickles and special sauce.' },
    ar: { n: 'دبل سماش', d: 'قطعتين سماش أطرافها مقرمشة، دبل جبن أمريكي، مخلل وصوص سبيشل.' } },
  { id: 'mushroom', cat: 'beef', price: 38, img: P('mushroom'),
    en: { n: 'Mushroom Swiss', d: 'Beef patty, butter-garlic mushrooms, melted Swiss and a creamy sauce.' },
    ar: { n: 'مشروم سويس', d: 'لحم بقري، مشروم سوتيه بالزبدة والثوم، جبن سويسري ذايب وصوص كريمي.' } },
  { id: 'special', cat: 'beef', price: 35, img: P('special'),
    en: { n: 'Boda Special', d: 'Beef patty, pickled red onion, fresh lettuce, pickles and Boda sauce.' },
    ar: { n: 'بودة سبيشل', d: 'لحم بقري، بصل أحمر مخلل، خس فريش، مخلل وصوص بودة.' } },
  { id: 'crispy', cat: 'chicken', price: 25, img: P('crispy'), badge: 'top',
    en: { n: 'Crispy Classic', d: 'Crispy chicken breast marinated for 12 hours, lettuce, pickles and Boda sauce.' },
    ar: { n: 'كرسبي كلاسيك', d: 'صدر دجاج كرسبي متتبل ١٢ ساعة، خس، مخلل وصوص بودة.' } },
  { id: 'nashville', cat: 'chicken', price: 29, img: P('nashville'), badge: 'hot', hot: true,
    en: { n: 'Nashville Hot', d: 'Crispy chicken dipped in hot chili oil, red onion and a cooling cream sauce.' },
    ar: { n: 'ناشفيل هوت', d: 'دجاج كرسبي مغطوس بزيت الشطة الحار، بصل أحمر وصوص كريمي.' } },
  { id: 'ranch', cat: 'chicken', price: 31, img: P('ranch'),
    en: { n: 'Ranch Slaw', d: 'Crispy chicken, ranch coleslaw, pickles and spring onion.' },
    ar: { n: 'رانش كول سلو', d: 'دجاج كرسبي، كول سلو بصوص الرانش، مخلل وبصل أخضر.' } },
  { id: 'jalapeno', cat: 'chicken', price: 32, img: P('jalapeno'), badge: 'hot', hot: true,
    en: { n: 'Jalapeño Chicken', d: 'Crispy chicken, jalapeños, melted cheddar, lettuce and garlic sauce.' },
    ar: { n: 'دجاج هالبينو', d: 'دجاج كرسبي، هالبينو، شيدر ذايب، خس وصوص الثوم.' } },
  { id: 'garlic', cat: 'chicken', price: 28, img: P('garlic'),
    en: { n: 'Creamy Garlic', d: 'Crispy chicken, garlic mayo, fresh lettuce on a brioche bun.' },
    ar: { n: 'كريمي جارلك', d: 'دجاج كرسبي، مايونيز بالثوم، خس فريش في خبز بريوش.' } },
  { id: 'fries', cat: 'sides', price: 9, img: P('fries'), side: true,
    en: { n: 'Boda Fries', d: 'Crispy fries with Boda seasoning.' },
    ar: { n: 'بطاطس بودة', d: 'بطاطس مقرمشة بتتبيلة بودة.' } },
  { id: 'cheesefries', cat: 'sides', price: 15, img: P('cheesefries'), side: true,
    en: { n: 'Loaded Cheese Fries', d: 'Fries under melted cheddar sauce and seasoned minced beef.' },
    ar: { n: 'تشيز فرايز', d: 'بطاطس عليها صوص شيدر ذايب ولحم مفروم متبل.' } },
  { id: 'pepsi', cat: 'sides', price: 6, img: P('pepsi'), side: true,
    en: { n: 'Pepsi', d: 'Ice-cold can.' },
    ar: { n: 'بيبسي', d: 'علبة باردة.' } },
];

// Build-your-burger: every option has a fixed price here; the cart re-computes from this table, never from storage.
export const BUILD = {
  base: 18, // bun + one beef patty
  groups: [
    { id: 'bun', type: 'one', en: 'Bun', ar: 'الخبز', opts: [
      { id: 'brioche', en: 'Toasted brioche', ar: 'بريوش محمّص', p: 0 },
      { id: 'potato', en: 'Potato bun', ar: 'خبز بطاطس', p: 0 },
      { id: 'sesame', en: 'Sesame bun', ar: 'خبز بالسمسم', p: 0 } ] },
    { id: 'patty', type: 'count', en: 'Smash patties', ar: 'قطع السماش', min: 1, max: 3, each: 9 },
    { id: 'cheese', type: 'one', en: 'Cheese', ar: 'الجبن', opts: [
      { id: 'american', en: 'American', ar: 'أمريكي', p: 3 },
      { id: 'cheddar', en: 'Aged cheddar', ar: 'شيدر معتّق', p: 4 },
      { id: 'swiss', en: 'Swiss', ar: 'سويسري', p: 4 },
      { id: 'none', en: 'No cheese', ar: 'بدون جبن', p: 0 } ] },
    { id: 'top', type: 'many', en: 'Toppings', ar: 'الإضافات', opts: [
      { id: 'pickles', en: 'Pickles', ar: 'مخلل', p: 0 },
      { id: 'onion', en: 'Diced onion', ar: 'بصل مفروم', p: 0 },
      { id: 'lettuce', en: 'Lettuce', ar: 'خس', p: 0 },
      { id: 'tomato', en: 'Tomato', ar: 'طماطم', p: 0 },
      { id: 'jalapeno', en: 'Jalapeños', ar: 'هالبينو', p: 2 },
      { id: 'bacon', en: 'Beef bacon', ar: 'بيكن بقري', p: 6 },
      { id: 'mushroom', en: 'Mushrooms', ar: 'مشروم', p: 4 },
      { id: 'egg', en: 'Fried egg', ar: 'بيض مقلي', p: 4 } ] },
    { id: 'sauce', type: 'many', max: 2, en: 'Sauces (up to 2)', ar: 'الصوصات (لين ٢)', opts: [
      { id: 'boda', en: 'Boda sauce', ar: 'صوص بودة', p: 0 },
      { id: 'ketchup', en: 'Ketchup', ar: 'كاتشب', p: 0 },
      { id: 'mustard', en: 'Mustard', ar: 'مستردة', p: 0 },
      { id: 'bbq', en: 'BBQ', ar: 'باربكيو', p: 0 },
      { id: 'garlic', en: 'Garlic mayo', ar: 'مايونيز بالثوم', p: 0 },
      { id: 'hot', en: 'Hot sauce', ar: 'صوص حار', p: 0 } ] },
  ],
};
