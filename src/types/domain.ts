// Data contract between frontend components and future backend integration.
// When Medusa v2 backend arrives, only /lib/products.ts changes — these types stay.

export type Locale = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

export interface Size {
  id: string;
  label: string; // 'XS' | 'S' | 'M' | 'L' | 'XL'
  stock: number;
  inStock: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  category: 'tops' | 'bottoms';
  price: number;
  currency: 'SAR';
  sizes: Size[];
  images: string[];
  inStock: boolean;
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  quantity: number;
}
