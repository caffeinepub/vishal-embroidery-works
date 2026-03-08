import { create } from "zustand";
import type { CartItem, Design } from "../lib/storage";
import {
  clearCart as clearCartStorage,
  getCart,
  saveCart,
} from "../lib/storage";

export type ActiveTab = "home" | "embroidery" | "blouse" | "bridal" | "orders";

interface AppStore {
  activeTab: ActiveTab;
  cart: CartItem[];
  isAdminOpen: boolean;
  isAdminAuthenticated: boolean;
  compareDesigns: Design[];

  setActiveTab: (tab: ActiveTab) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (designId: string) => void;
  clearCart: () => void;
  openAdmin: () => void;
  closeAdmin: () => void;
  authenticateAdmin: () => void;
  lockAdmin: () => void;
  addToCompare: (design: Design) => void;
  removeFromCompare: (designId: string) => void;
  clearCompare: () => void;
  refreshCart: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  activeTab: "home",
  cart: getCart(),
  isAdminOpen: false,
  isAdminAuthenticated: false,
  compareDesigns: [],

  setActiveTab: (tab) => set({ activeTab: tab }),

  addToCart: (item) =>
    set((state) => {
      if (state.cart.some((c) => c.designId === item.designId)) return state;
      const newCart = [...state.cart, item];
      saveCart(newCart);
      return { cart: newCart };
    }),

  removeFromCart: (designId) =>
    set((state) => {
      const newCart = state.cart.filter((c) => c.designId !== designId);
      saveCart(newCart);
      return { cart: newCart };
    }),

  clearCart: () => {
    clearCartStorage();
    set({ cart: [] });
  },

  openAdmin: () => set({ isAdminOpen: true }),
  closeAdmin: () => set({ isAdminOpen: false }),
  authenticateAdmin: () => set({ isAdminAuthenticated: true }),
  lockAdmin: () => set({ isAdminAuthenticated: false }),

  addToCompare: (design) =>
    set((state) => {
      if (state.compareDesigns.length >= 2) return state;
      if (state.compareDesigns.some((d) => d.id === design.id)) return state;
      return { compareDesigns: [...state.compareDesigns, design] };
    }),

  removeFromCompare: (designId) =>
    set((state) => ({
      compareDesigns: state.compareDesigns.filter((d) => d.id !== designId),
    })),

  clearCompare: () => set({ compareDesigns: [] }),

  refreshCart: () => set({ cart: getCart() }),
}));
