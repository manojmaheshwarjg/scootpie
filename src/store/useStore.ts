import { create } from 'zustand';
import { Product, SwipeCard } from '@/types';

interface AppState {
  currentCards: SwipeCard[];
  sessionId: string;
  leftSwipeCount: number;
  isChatOpen: boolean;
  selectedProduct: Product | null;
  
  setCurrentCards: (cards: SwipeCard[]) => void;
  setSessionId: (id: string) => void;
  incrementLeftSwipeCount: () => void;
  resetLeftSwipeCount: () => void;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  setSelectedProduct: (product: Product | null) => void;
}

export const useStore = create<AppState>((set) => ({
  currentCards: [],
  sessionId: '',
  leftSwipeCount: 0,
  isChatOpen: false,
  selectedProduct: null,
  
  setCurrentCards: (cards) => set({ currentCards: cards }),
  setSessionId: (id) => set({ sessionId: id }),
  incrementLeftSwipeCount: () => set((state) => ({ leftSwipeCount: state.leftSwipeCount + 1 })),
  resetLeftSwipeCount: () => set({ leftSwipeCount: 0 }),
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  openChat: () => set({ isChatOpen: true }),
  closeChat: () => set({ isChatOpen: false }),
  setSelectedProduct: (product) => set({ selectedProduct: product }),
}));
