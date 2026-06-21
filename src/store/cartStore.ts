/**
 * Client-side cart store (Zustand). Phase 8 Plan 02 strips the persist
 * middleware — the DB is now the source of truth. Hydration happens via
 * `StoreHydration` calling `/api/cart` on mount.
 *
 * The mutator action surface (addItem/removeItem/updateQuantity/...) is
 * preserved for backward compatibility with `CartDrawer` and `CartItem`.
 * Components are responsible for calling the corresponding Server Action
 * alongside the optimistic Zustand update.
 */
import { create } from 'zustand';
import type { CartItem, Product } from '@/types/domain';

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  /** Hydration entry point — replaces the entire items array. */
  setItems: (items: CartItem[]) => void;
  addItem: (product: Product, selectedSize: string) => void;
  removeItem: (productId: string, selectedSize: string) => void;
  updateQuantity: (
    productId: string,
    selectedSize: string,
    delta: number
  ) => void;
  setDrawerOpen: (isOpen: boolean) => void;
  clearCart: () => void;
  getTotalCount: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  isDrawerOpen: false,

  setItems: (items) => set({ items }),

  addItem: (product, selectedSize) =>
    set((state) => {
      const existing = state.items.find(
        (i) => i.product.id === product.id && i.selectedSize === selectedSize
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id && i.selectedSize === selectedSize
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return {
        items: [...state.items, { product, selectedSize, quantity: 1 }],
      };
    }),

  removeItem: (productId, selectedSize) =>
    set((state) => ({
      items: state.items.filter(
        (i) => !(i.product.id === productId && i.selectedSize === selectedSize)
      ),
    })),

  updateQuantity: (productId, selectedSize, delta) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId && i.selectedSize === selectedSize
          ? { ...i, quantity: Math.max(1, i.quantity + delta) }
          : i
      ),
    })),

  setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),

  clearCart: () => set({ items: [] }),

  getTotalCount: () =>
    get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
