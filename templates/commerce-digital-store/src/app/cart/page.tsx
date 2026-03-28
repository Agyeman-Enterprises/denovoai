"use client";

import { useState } from "react";
import Link from "next/link";

interface CartItem { productId: string; quantity: number; priceCents: number; title: string }

function getCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch { return []; }
}
function setCart(items: CartItem[]) {
  localStorage.setItem("cart", JSON.stringify(items));
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    return getCart();
  });
  const [checking, setChecking] = useState(false);

  const updateQty = (productId: string, delta: number) => {
    const updated = items.map(i => i.productId === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i);
    setItems(updated);
    setCart(updated);
  };

  const remove = (productId: string) => {
    const updated = items.filter(i => i.productId !== productId);
    setItems(updated);
    setCart(updated);
  };

  const totalCents = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);

  const handleCheckout = async () => {
    setChecking(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items.map(i => ({ productId: i.productId, quantity: i.quantity })) }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || "Checkout failed");
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <Link href="/shop" className="text-sm text-white/40 hover:text-white/70">Continue Shopping</Link>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold">Cart</h1>

        {items.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-sm text-white/30">Your cart is empty.</p>
            <Link href="/shop" className="mt-4 inline-block text-sm text-violet-400 hover:text-violet-300">Browse {"{{PRODUCT_NOUN_PLURAL}}"}</Link>
          </div>
        )}

        {items.length > 0 && (
          <>
            <div className="mt-6 space-y-3">
              {items.map(item => (
                <div key={item.productId} className="flex items-center justify-between rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-white/30">${(item.priceCents / 100).toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQty(item.productId, -1)} className="h-7 w-7 rounded-md text-xs text-white/40 hover:text-white" style={{ background: "rgba(255,255,255,0.05)" }}>−</button>
                    <span className="text-sm w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.productId, 1)} className="h-7 w-7 rounded-md text-xs text-white/40 hover:text-white" style={{ background: "rgba(255,255,255,0.05)" }}>+</button>
                    <button onClick={() => remove(item.productId)} className="ml-2 text-xs text-red-400 hover:text-red-300">Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Total</span>
                <span className="text-xl font-bold text-violet-400">${(totalCents / 100).toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={checking}
                className="mt-4 w-full rounded-lg py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "#8B5CF6" }}
              >
                {checking ? "Redirecting to checkout..." : "Checkout"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
