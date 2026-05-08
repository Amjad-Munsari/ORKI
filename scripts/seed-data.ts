export const seedData = [
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
    sizes: [
      { label: 'XS', inStock: true, stock: 10 },
      { label: 'S', inStock: true, stock: 10 },
      { label: 'M', inStock: false, stock: 0 },
      { label: 'L', inStock: true, stock: 10 },
      { label: 'XL', inStock: true, stock: 10 },
    ],
    images: ['/images/products/placeholder-hoodie.png'],
    inStock: true,
  },
  {
    id: 'orki-utility-cargo-black',
    slug: 'orki-utility-cargo-black',
    name: { en: 'ORKI Utility Cargo — Black', ar: 'بنطلون أوركي الكارغو — أسود' },
    description: {
      en: 'Relaxed cargo silhouette. Six pockets. Adjustable ankle cuffs. Twill fabric.',
      ar: 'سيلويت كارغو مريح. ستة جيوب. أكمام قابلة للتعديل عند الكاحل. قماش تويل.',
    },
    category: 'bottoms',
    price: 349,
    currency: 'SAR',
    sizes: [
      { label: 'XS', inStock: true, stock: 10 },
      { label: 'S', inStock: true, stock: 10 },
      { label: 'M', inStock: true, stock: 10 },
      { label: 'L', inStock: true, stock: 10 },
      { label: 'XL', inStock: false, stock: 0 },
    ],
    images: ['/images/products/placeholder-hoodie.png'],
    inStock: true,
  }
];
