type SeedSize = { label: string; inStock: boolean; stock: number };
type SeedProduct = {
  id: string;
  slug: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  category: 'tops' | 'bottoms';
  price: number;
  currency: 'SAR';
  sizes: SeedSize[];
  images: string[];
  inStock: boolean;
};

const TOP_IMG = '/images/products/hoodie.png';
const BOTTOM_IMG = '/images/products/jeans.png';

const fullStock: SeedSize[] = [
  { label: 'XS', inStock: true, stock: 12 },
  { label: 'S', inStock: true, stock: 18 },
  { label: 'M', inStock: true, stock: 22 },
  { label: 'L', inStock: true, stock: 16 },
  { label: 'XL', inStock: true, stock: 8 },
];

const lowStock: SeedSize[] = [
  { label: 'XS', inStock: false, stock: 0 },
  { label: 'S', inStock: true, stock: 4 },
  { label: 'M', inStock: true, stock: 7 },
  { label: 'L', inStock: true, stock: 3 },
  { label: 'XL', inStock: false, stock: 0 },
];

const midStock: SeedSize[] = [
  { label: 'XS', inStock: true, stock: 6 },
  { label: 'S', inStock: true, stock: 10 },
  { label: 'M', inStock: false, stock: 0 },
  { label: 'L', inStock: true, stock: 9 },
  { label: 'XL', inStock: true, stock: 5 },
];

export const seedData: SeedProduct[] = [
  // ─── Tops ───────────────────────────────────────────────────────────────────
  {
    id: 'orki-heavy-tee-black',
    slug: 'orki-heavy-tee-black',
    name: { en: 'ORKI Heavy Tee — Black', ar: 'تيشيرت أوركي الثقيل — أسود' },
    description: {
      en: 'Heavyweight 320gsm cotton. Dropped shoulders. ORKI wordmark embroidered at chest.',
      ar: 'قطن ثقيل 320 جرام. أكتاف منخفضة. شعار أوركي مطرّز على الصدر.',
    },
    category: 'tops',
    price: 249,
    currency: 'SAR',
    sizes: fullStock,
    images: [TOP_IMG],
    inStock: true,
  },
  {
    id: 'orki-heavy-tee-bone',
    slug: 'orki-heavy-tee-bone',
    name: { en: 'ORKI Heavy Tee — Bone', ar: 'تيشيرت أوركي الثقيل — عظمي' },
    description: {
      en: 'Heavyweight 320gsm cotton in undyed bone. Garment-washed for a lived-in feel.',
      ar: 'قطن ثقيل 320 جرام بلون عظمي طبيعي. مغسول للحصول على ملمس مريح.',
    },
    category: 'tops',
    price: 249,
    currency: 'SAR',
    sizes: midStock,
    images: [TOP_IMG],
    inStock: true,
  },
  {
    id: 'orki-box-hoodie-black',
    slug: 'orki-box-hoodie-black',
    name: { en: 'ORKI Box Hoodie — Black', ar: 'هودي أوركي الواسع — أسود' },
    description: {
      en: 'Boxy fit. 480gsm fleece. Tonal embroidery at chest. Double-layer hood.',
      ar: 'قصة واسعة. صوف 480 جرام. تطريز بنفس اللون على الصدر. كابوشون بطبقتين.',
    },
    category: 'tops',
    price: 449,
    currency: 'SAR',
    sizes: fullStock,
    images: [TOP_IMG],
    inStock: true,
  },
  {
    id: 'orki-box-hoodie-stone',
    slug: 'orki-box-hoodie-stone',
    name: { en: 'ORKI Box Hoodie — Stone', ar: 'هودي أوركي الواسع — حجري' },
    description: {
      en: 'Boxy fit in stone-washed grey. Drop shoulder. Heavyweight 480gsm fleece.',
      ar: 'قصة واسعة بلون رمادي حجري. كتف منخفض. صوف ثقيل 480 جرام.',
    },
    category: 'tops',
    price: 449,
    currency: 'SAR',
    sizes: lowStock,
    images: [TOP_IMG],
    inStock: true,
  },
  {
    id: 'orki-crewneck-charcoal',
    slug: 'orki-crewneck-charcoal',
    name: { en: 'ORKI Crewneck — Charcoal', ar: 'كرو نيك أوركي — فحمي' },
    description: {
      en: 'Heavy-knit crewneck. Ribbed collar and cuffs. Subtle ORKI tab at hem.',
      ar: 'كرو نيك بنسيج ثقيل. ياقة وأساور مضلعة. لاصقة أوركي خفيفة على الحاشية.',
    },
    category: 'tops',
    price: 329,
    currency: 'SAR',
    sizes: fullStock,
    images: [TOP_IMG],
    inStock: true,
  },
  {
    id: 'orki-longsleeve-bone',
    slug: 'orki-longsleeve-bone',
    name: { en: 'ORKI Longsleeve Tee — Bone', ar: 'تيشيرت أوركي بأكمام طويلة — عظمي' },
    description: {
      en: 'Long-sleeve cotton tee with cuffed sleeves. ORKI graphic at the back.',
      ar: 'تيشيرت قطني بأكمام طويلة وأساور. طباعة أوركي على الظهر.',
    },
    category: 'tops',
    price: 279,
    currency: 'SAR',
    sizes: midStock,
    images: [TOP_IMG],
    inStock: true,
  },
  {
    id: 'orki-mockneck-black',
    slug: 'orki-mockneck-black',
    name: { en: 'ORKI Mockneck — Black', ar: 'موك نيك أوركي — أسود' },
    description: {
      en: 'Slim mockneck in midweight rib knit. Layer staple. Cuts a clean line.',
      ar: 'موك نيك ضيّق بنسيج مضلّع متوسط الوزن. أساسي للطبقات. خطوط نظيفة.',
    },
    category: 'tops',
    price: 299,
    currency: 'SAR',
    sizes: fullStock,
    images: [TOP_IMG],
    inStock: true,
  },
  {
    id: 'orki-varsity-jacket',
    slug: 'orki-varsity-jacket',
    name: { en: 'ORKI Varsity Jacket — Black/Bone', ar: 'جاكيت أوركي الفارسيتي — أسود وعظمي' },
    description: {
      en: 'Wool body, leather sleeves. Snap-front. Chenille ORKI patch at chest.',
      ar: 'جسم صوفي وأكمام جلدية. أزرار كبس أمامية. شعار أوركي بنسيج الشانيل على الصدر.',
    },
    category: 'tops',
    price: 599,
    currency: 'SAR',
    sizes: lowStock,
    images: [TOP_IMG],
    inStock: true,
  },
  {
    id: 'orki-overshirt-charcoal',
    slug: 'orki-overshirt-charcoal',
    name: { en: 'ORKI Overshirt — Charcoal', ar: 'قميص أوركي الفوقي — فحمي' },
    description: {
      en: 'Heavy twill overshirt. Two chest pockets. Cut to wear open or buttoned.',
      ar: 'قميص فوقي بقماش تويل ثقيل. جيبان على الصدر. مصمم ليُلبس مفتوحاً أو مزرراً.',
    },
    category: 'tops',
    price: 499,
    currency: 'SAR',
    sizes: midStock,
    images: [TOP_IMG],
    inStock: true,
  },
  {
    id: 'orki-half-zip-stone',
    slug: 'orki-half-zip-stone',
    name: { en: 'ORKI Half-Zip Sweatshirt — Stone', ar: 'سويتشيرت أوركي بنصف سحاب — حجري' },
    description: {
      en: 'Half-zip pullover. Brushed-back fleece. Funnel collar. Embroidered logo.',
      ar: 'سويتشيرت بنصف سحاب. صوف مفروش من الداخل. ياقة عالية. شعار مطرز.',
    },
    category: 'tops',
    price: 379,
    currency: 'SAR',
    sizes: fullStock,
    images: [TOP_IMG],
    inStock: true,
  },

  // ─── Bottoms ────────────────────────────────────────────────────────────────
  {
    id: 'orki-utility-cargo-black',
    slug: 'orki-utility-cargo-black',
    name: { en: 'ORKI Utility Cargo — Black', ar: 'بنطلون أوركي الكارغو — أسود' },
    description: {
      en: 'Relaxed cargo silhouette. Six pockets. Adjustable ankle cuffs. Twill fabric.',
      ar: 'سيلويت كارغو مريح. ستة جيوب. أساور قابلة للتعديل عند الكاحل. قماش تويل.',
    },
    category: 'bottoms',
    price: 349,
    currency: 'SAR',
    sizes: fullStock,
    images: [BOTTOM_IMG],
    inStock: true,
  },
  {
    id: 'orki-utility-cargo-stone',
    slug: 'orki-utility-cargo-stone',
    name: { en: 'ORKI Utility Cargo — Stone', ar: 'بنطلون أوركي الكارغو — حجري' },
    description: {
      en: 'Same relaxed cargo cut, washed twill. Looks better with every wear.',
      ar: 'نفس قصة الكارغو المريحة بقماش تويل مغسول. يصبح أجمل مع كل ارتداء.',
    },
    category: 'bottoms',
    price: 349,
    currency: 'SAR',
    sizes: midStock,
    images: [BOTTOM_IMG],
    inStock: true,
  },
  {
    id: 'orki-wide-denim-indigo',
    slug: 'orki-wide-denim-indigo',
    name: { en: 'ORKI Wide-Leg Denim — Indigo', ar: 'جينز أوركي الواسع — نيلي' },
    description: {
      en: '14oz selvedge denim. Wide leg, mid-rise. Made to fade with wear.',
      ar: 'جينز سيلفدج 14 أونصة. ساق واسعة، خصر متوسط. مصمم ليتلاشى مع الاستخدام.',
    },
    category: 'bottoms',
    price: 399,
    currency: 'SAR',
    sizes: fullStock,
    images: [BOTTOM_IMG],
    inStock: true,
  },
  {
    id: 'orki-wide-denim-bone',
    slug: 'orki-wide-denim-bone',
    name: { en: 'ORKI Wide-Leg Denim — Bone', ar: 'جينز أوركي الواسع — عظمي' },
    description: {
      en: 'Undyed cotton denim in natural bone. Wide-leg cut. Heavy enamel button.',
      ar: 'جينز قطني طبيعي بلون عظمي. قصة ساق واسعة. زر إيناميل ثقيل.',
    },
    category: 'bottoms',
    price: 399,
    currency: 'SAR',
    sizes: lowStock,
    images: [BOTTOM_IMG],
    inStock: true,
  },
  {
    id: 'orki-track-pants-black',
    slug: 'orki-track-pants-black',
    name: { en: 'ORKI Track Pants — Black', ar: 'بنطلون أوركي الرياضي — أسود' },
    description: {
      en: 'Brushed-back fleece. Tonal side stripe. Tapered leg, elastic waist.',
      ar: 'صوف مفروش من الداخل. خط جانبي بنفس اللون. ساق مدببة وخصر مطاطي.',
    },
    category: 'bottoms',
    price: 299,
    currency: 'SAR',
    sizes: fullStock,
    images: [BOTTOM_IMG],
    inStock: true,
  },
  {
    id: 'orki-pleated-trousers-charcoal',
    slug: 'orki-pleated-trousers-charcoal',
    name: { en: 'ORKI Pleated Trousers — Charcoal', ar: 'بنطلون أوركي بكسرات — فحمي' },
    description: {
      en: 'Double-pleat front. High rise. Drapes wide through the leg.',
      ar: 'كسرتان من الأمام. خصر مرتفع. ينسدل بعرض عبر الساق.',
    },
    category: 'bottoms',
    price: 349,
    currency: 'SAR',
    sizes: midStock,
    images: [BOTTOM_IMG],
    inStock: true,
  },
  {
    id: 'orki-painter-pants-bone',
    slug: 'orki-painter-pants-bone',
    name: { en: 'ORKI Painter Pants — Bone', ar: 'بنطلون أوركي الرسام — عظمي' },
    description: {
      en: 'Workwear-inspired painter pant. Hammer loop. Reinforced knees.',
      ar: 'بنطلون رسام مستوحى من ملابس العمل. حلقة للمطرقة. ركب مدعّمة.',
    },
    category: 'bottoms',
    price: 379,
    currency: 'SAR',
    sizes: fullStock,
    images: [BOTTOM_IMG],
    inStock: true,
  },
  {
    id: 'orki-workshop-shorts-black',
    slug: 'orki-workshop-shorts-black',
    name: { en: 'ORKI Workshop Shorts — Black', ar: 'شورت أوركي الورشة — أسود' },
    description: {
      en: 'Knee-length workshop short. Heavy twill. Oversized side pockets.',
      ar: 'شورت ورشة بطول الركبة. قماش تويل ثقيل. جيوب جانبية كبيرة.',
    },
    category: 'bottoms',
    price: 219,
    currency: 'SAR',
    sizes: midStock,
    images: [BOTTOM_IMG],
    inStock: true,
  },
  {
    id: 'orki-parachute-pants-black',
    slug: 'orki-parachute-pants-black',
    name: { en: 'ORKI Parachute Pants — Black', ar: 'بنطلون أوركي المظلة — أسود' },
    description: {
      en: 'Technical nylon. Wide leg, drawstring hem. Cargo pockets at thigh.',
      ar: 'نايلون تقني. ساق واسعة، حاشية برباط. جيوب كارغو على الفخذ.',
    },
    category: 'bottoms',
    price: 429,
    currency: 'SAR',
    sizes: fullStock,
    images: [BOTTOM_IMG],
    inStock: true,
  },
  {
    id: 'orki-carpenter-jeans-charcoal',
    slug: 'orki-carpenter-jeans-charcoal',
    name: { en: 'ORKI Carpenter Jeans — Charcoal', ar: 'جينز أوركي النجار — فحمي' },
    description: {
      en: 'Carpenter jean in overdyed charcoal denim. Utility loop, side pocket.',
      ar: 'جينز نجار من قماش جينز فحمي مصبوغ. حلقة للأدوات وجيب جانبي.',
    },
    category: 'bottoms',
    price: 419,
    currency: 'SAR',
    sizes: lowStock,
    images: [BOTTOM_IMG],
    inStock: true,
  },
];
