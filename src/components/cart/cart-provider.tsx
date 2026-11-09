/**
 * @file cart-provider.tsx
 * @description Contexte React global gérant :
 * 1. Le panier d'achat (`lines`, `add`, `setQuantity`, `clear`) persisté dans `localStorage`.
 * 2. Les produits favoris (`favorites`, `toggleFavorite`, `favoritesOnly`) persistés dans `localStorage`.
 * 3. Les notifications visuelles rapides (`showToast`) en bas de l'écran.
 */

"use client";

import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/** Ligne d'article stockée dans le panier client */
export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  unit: string;
  stock: number;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  favorites: string[];
  favoritesOnly: boolean;
  setFavoritesOnly: (value: boolean) => void;
  isFavorite: (slug: string) => boolean;
  toggleFavorite: (slug: string, name?: string) => void;
  showToast: (message: string) => void;
};

const CART_STORAGE_KEY = "tal-agro-cart-v2";
const FAV_STORAGE_KEY = "tal-agro-favs";
const CartContext = createContext<CartContextValue | null>(null);

/** Détecte si l'unité du produit impose un minimum de commande (ex: "unité · minimum 10") */
function getMinimumQuantity(unit: string): number {
  const match = unit.match(/minimum\s+(\d+)/i);
  return match ? Math.max(1, Number(match[1])) : 1;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // Restauration initiale du panier et des favoris depuis localStorage
  useEffect(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique après hydratation
      if (Array.isArray(savedCart)) setLines(savedCart);
      const savedFavs = JSON.parse(localStorage.getItem(FAV_STORAGE_KEY) ?? "[]");
      if (Array.isArray(savedFavs)) setFavorites(savedFavs.filter((x) => typeof x === "string"));
    } catch {}
    setLoaded(true);
  }, []);

  // Sauvegarde automatique dans localStorage
  useEffect(() => {
    if (loaded) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  }, [lines, loaded]);

  useEffect(() => {
    if (loaded) localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites, loaded]);

  /** Ajoute un produit au panier en respectant le stock et un éventuel minimum de commande */
  const add = useCallback(
    (line: Omit<CartLine, "quantity">, qty?: number) => {
      const minQty = getMinimumQuantity(line.unit);
      const step = qty ?? 1;
      setLines((prev) => {
        const existing = prev.find((l) => l.productId === line.productId);
        if (existing) {
          return prev.map((l) =>
            l.productId === line.productId
              ? { ...l, ...line, quantity: Math.min(l.quantity + step, line.stock) }
              : l,
          );
        }
        const initialQty = Math.min(Math.max(step, minQty), line.stock);
        return [...prev, { ...line, quantity: initialQty }];
      });
      showToast(`✓ ${line.name} ajouté au panier`);
    },
    [showToast],
  );

  /** Définit la quantité d'un article (ou le retire si `quantity <= 0`) */
  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, quantity: Math.min(quantity, l.stock) } : l)),
    );
  }, []);

  const isFavorite = useCallback((slug: string) => favorites.includes(slug), [favorites]);

  const toggleFavorite = useCallback(
    (slug: string, name?: string) => {
      setFavorites((prev) => {
        const exists = prev.includes(slug);
        const next = exists ? prev.filter((s) => s !== slug) : [...prev, slug];
        if (name) {
          showToast(exists ? `${name} retiré des favoris` : `♥ ${name} ajouté aux favoris`);
        }
        return next;
      });
    },
    [showToast],
  );

  const count = useMemo(() => lines.reduce((n, l) => n + l.quantity, 0), [lines]);
  const subtotal = useMemo(() => lines.reduce((n, l) => n + l.quantity * l.price, 0), [lines]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count,
      subtotal,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      add,
      setQuantity,
      clear: () => {
        setLines([]);
        showToast("Panier vidé.");
      },
      favorites,
      favoritesOnly,
      setFavoritesOnly,
      isFavorite,
      toggleFavorite,
      showToast,
    }),
    [lines, count, subtotal, isOpen, add, setQuantity, favorites, favoritesOnly, isFavorite, toggleFavorite, showToast],
  );

  return (
    <CartContext value={value}>
      {children}
      {/* Barre flottante du panier sur mobile / iPhone lorsque des articles sont ajoutés */}
      {count > 0 && !isOpen && (
        <div className="fixed bottom-3 left-3 right-3 z-40 sm:hidden print:hidden">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex w-full touch-manipulation items-center justify-between rounded-2xl bg-brand px-4 py-3.5 text-sm font-bold text-white shadow-2xl ring-2 ring-brand-lime/60"
          >
            <span>
              🧺 {count} {count > 1 ? "articles" : "article"}
            </span>
            <span className="rounded-lg bg-brand-lime px-2.5 py-1 text-xs font-extrabold text-brand">
              {new Intl.NumberFormat("fr-FR").format(subtotal)} FCFA · Commander →
            </span>
          </button>
        </div>
      )}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed left-4 right-4 z-50 rounded-2xl bg-brand px-5 py-3 text-center text-sm font-bold text-white shadow-2xl sm:left-auto sm:right-5 sm:max-w-sm sm:text-left print:hidden ${
            count > 0 && !isOpen ? "bottom-20 sm:bottom-5" : "bottom-5"
          }`}
        >
          {toast}
        </div>
      )}
    </CartContext>
  );
}

/** Hook permettant d'accéder au panier et aux favoris depuis n'importe quel Client Component */
export function useCart() {
  const ctx = use(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans <CartProvider>");
  return ctx;
}
