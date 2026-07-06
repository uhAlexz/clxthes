import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ItemProps } from "@/components/ui/ItemCard";

interface StoreState {
  activeGroups: string[];
  savedItems: ItemProps[];
  cartItems: ItemProps[];
  quickViewItem: ItemProps | null;
  cartDrawerOpen: boolean;
  assistantOpen: boolean;

  // HYDRATION: Zustand's `persist` middleware rehydrates from localStorage
  // asynchronously after the first client render. Server-side rendering produces
  // the initial empty state; the client then patches it from localStorage. Without
  // this flag, components that depend on persisted state (e.g. FloatingCartWidget
  // showing a cart count) can produce a React hydration mismatch warning because
  // the server HTML says "no items" but the client immediately wants to render "3".
  // Reading `_hasHydrated` before rendering persisted-state-dependent UI prevents
  // that mismatch.
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;

  addGroup: (groupId: string) => void;
  removeGroup: (groupId: string) => void;
  toggleSavedItem: (item: ItemProps) => void;
  addToCart: (item: ItemProps) => void;
  removeFromCart: (itemId: number) => void;
  clearCart: () => void;
  setQuickViewItem: (item: ItemProps | null) => void;
  setCartDrawerOpen: (open: boolean) => void;
  setAssistantOpen: (open: boolean) => void;
}

const initialState = {
  activeGroups: [],
  savedItems: [],
  cartItems: [],
  quickViewItem: null,
  cartDrawerOpen: false,
  assistantOpen: false,
  _hasHydrated: false,
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      ...initialState,

      setHasHydrated: (value) => set({ _hasHydrated: value }),
      setQuickViewItem: (item) => set({ quickViewItem: item }),
      setCartDrawerOpen: (open) => set({ cartDrawerOpen: open }),
      setAssistantOpen: (open) => set({ assistantOpen: open }),

      addGroup: (groupId) =>
        set((state) => {
          const normalizedId = groupId.trim();
          if (!normalizedId || state.activeGroups.includes(normalizedId)) {
            return state;
          }

          return { activeGroups: [...state.activeGroups, normalizedId] };
        }),

      removeGroup: (groupId) =>
        set((state) => ({
          activeGroups: state.activeGroups.filter((id) => id !== groupId),
        })),

      toggleSavedItem: (item) =>
        set((state) => {
          const exists = state.savedItems.some((saved) => saved.id === item.id);

          if (exists) {
            return {
              savedItems: state.savedItems.filter((saved) => saved.id !== item.id),
            };
          }

          return { savedItems: [item, ...state.savedItems] };
        }),

      addToCart: (item) =>
        set((state) => {
          const exists = state.cartItems.some((cartItem) => cartItem.id === item.id);
          if (exists) {
            return state;
          }

          return { cartItems: [item, ...state.cartItems] };
        }),

      removeFromCart: (itemId) =>
        set((state) => ({
          cartItems: state.cartItems.filter((item) => item.id !== itemId),
        })),

      clearCart: () => set({ cartItems: [] }),
    }),
    {
      name: "clxthes-storage",
      partialize: (state) => ({
        activeGroups: state.activeGroups,
        savedItems: state.savedItems,
        cartItems: state.cartItems,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
