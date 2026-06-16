// Local-first data store for ShaktiSadan Ledger.
// Backed by localStorage; swap with Supabase later (see CONNECT.md).
import { useSyncExternalStore } from "react";

export type Expense = {
  id: string;
  name: string;
  price: number;     // total price in INR
  quantity: number;
  date: string;      // YYYY-MM-DD
  created_at: string;
};

export type DailyMark = {
  date: string;      // YYYY-MM-DD
  milk: boolean;
  water: boolean;
};

export type ShoppingItem = {
  id: string;
  name: string;
  requested_qty: number;
  unit: string;
  note?: string;
  requested_by: string;
  created_at: string;
  bought: boolean;
  bought_qty?: number;
  bought_price?: number;
  bought_at?: string;
};

export type Settings = {
  milkPricePerDay: number;
  waterPricePerDay: number;
  householdName: string;
  currentUser: string;
};

type DB = {
  expenses: Expense[];
  daily: DailyMark[];
  shopping: ShoppingItem[];
  settings: Settings;
};

const KEY = "shaktisadan.ledger.v1";

const defaultDB: DB = {
  expenses: [],
  daily: [],
  shopping: [],
  settings: {
    milkPricePerDay: 60,
    waterPricePerDay: 40,
    householdName: "ShaktiSadan",
    currentUser: "Member",
  },
};

function read(): DB {
  if (typeof window === "undefined") return defaultDB;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultDB;
    const parsed = JSON.parse(raw) as Partial<DB>;
    return {
      expenses: parsed.expenses ?? [],
      daily: parsed.daily ?? [],
      shopping: parsed.shopping ?? [],
      settings: { ...defaultDB.settings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return defaultDB;
  }
}

let state: DB = read();
const listeners = new Set<() => void>();

function write(next: DB) {
  state = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Cross-tab sync
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      state = read();
      listeners.forEach((l) => l());
    }
  });
}

export function useDB(): DB {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => defaultDB,
  );
}

export const uid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36));

export const todayISO = () => {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};

// ---------------- Mutations ----------------

export const expensesApi = {
  add(input: Omit<Expense, "id" | "created_at">) {
    const item: Expense = { ...input, id: uid(), created_at: new Date().toISOString() };
    write({ ...state, expenses: [item, ...state.expenses] });
    return item;
  },
  update(id: string, patch: Partial<Expense>) {
    write({ ...state, expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  },
  remove(id: string) {
    write({ ...state, expenses: state.expenses.filter((e) => e.id !== id) });
  },
};

export const dailyApi = {
  toggle(date: string, field: "milk" | "water") {
    const existing = state.daily.find((d) => d.date === date);
    let next: DailyMark[];
    if (existing) {
      next = state.daily.map((d) => (d.date === date ? { ...d, [field]: !d[field] } : d));
    } else {
      next = [...state.daily, { date, milk: field === "milk", water: field === "water" }];
    }
    write({ ...state, daily: next });
  },
  get(date: string): DailyMark {
    return state.daily.find((d) => d.date === date) ?? { date, milk: false, water: false };
  },
};

export const shoppingApi = {
  add(input: Omit<ShoppingItem, "id" | "created_at" | "bought">) {
    const item: ShoppingItem = {
      ...input,
      id: uid(),
      created_at: new Date().toISOString(),
      bought: false,
    };
    write({ ...state, shopping: [item, ...state.shopping] });
  },
  remove(id: string) {
    write({ ...state, shopping: state.shopping.filter((s) => s.id !== id) });
  },
  clear(
    id: string,
    payload: { bought_qty: number; bought_price: number; date: string; addAsExpense?: boolean },
  ) {
    const item = state.shopping.find((s) => s.id === id);
    if (!item) return;
    const updated: ShoppingItem = {
      ...item,
      bought: true,
      bought_qty: payload.bought_qty,
      bought_price: payload.bought_price,
      bought_at: new Date().toISOString(),
    };
    let nextState: DB = {
      ...state,
      shopping: state.shopping.map((s) => (s.id === id ? updated : s)),
    };
    if (payload.addAsExpense !== false) {
      const exp: Expense = {
        id: uid(),
        name: item.name,
        price: payload.bought_price,
        quantity: payload.bought_qty,
        date: payload.date,
        created_at: new Date().toISOString(),
      };
      nextState = { ...nextState, expenses: [exp, ...nextState.expenses] };
    }
    write(nextState);
  },
  uncheck(id: string) {
    write({
      ...state,
      shopping: state.shopping.map((s) =>
        s.id === id ? { ...s, bought: false, bought_qty: undefined, bought_price: undefined, bought_at: undefined } : s,
      ),
    });
  },
};

export const settingsApi = {
  update(patch: Partial<Settings>) {
    write({ ...state, settings: { ...state.settings, ...patch } });
  },
};
