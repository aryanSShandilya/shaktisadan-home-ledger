# Connecting ShaktiSadan Ledger to Supabase

The app currently stores data in `localStorage` via `src/lib/store.ts`. To
move to your existing Supabase project and add authentication:

## 1. Schema

Run this in the Supabase SQL editor (matches the in-app types):

```sql
-- Expenses
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  price numeric not null check (price >= 0),
  quantity numeric not null check (quantity > 0),
  date date not null,
  created_at timestamptz default now()
);

-- Daily milk/water marks
create table public.daily_marks (
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  milk boolean default false,
  water boolean default false,
  primary key (user_id, date)
);

-- Shopping list
create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  requested_qty numeric not null,
  unit text not null default 'pc',
  note text,
  requested_by text not null,
  created_at timestamptz default now(),
  bought boolean default false,
  bought_qty numeric,
  bought_price numeric,
  bought_at timestamptz
);

-- Household settings (one row per user / household)
create table public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  household_name text default 'ShaktiSadan',
  milk_price_per_day numeric default 60,
  water_price_per_day numeric default 40
);

-- Grants
grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update, delete on public.daily_marks to authenticated;
grant select, insert, update, delete on public.shopping_items to authenticated;
grant select, insert, update, delete on public.settings to authenticated;

-- RLS
alter table public.expenses enable row level security;
alter table public.daily_marks enable row level security;
alter table public.shopping_items enable row level security;
alter table public.settings enable row level security;

create policy "own expenses" on public.expenses for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own daily" on public.daily_marks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own shopping" on public.shopping_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own settings" on public.settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

> If the whole family should share data, replace `user_id` with a
> `household_id` and add a `household_members(user_id, household_id)` table;
> change the RLS predicate to "row's household_id is in my households".

## 2. Replace the store

In `src/lib/store.ts` each `*Api.*` function is one Supabase call:
- `expensesApi.add` → `supabase.from('expenses').insert(...)`
- `dailyApi.toggle` → `upsert` into `daily_marks`
- `shoppingApi.*` → `insert/update/delete` on `shopping_items`
- `settingsApi.update` → `upsert` on `settings`

Keep the `useDB()` shape — load all rows on mount into a small Zustand /
React Query store and the rest of the UI works unchanged.

## 3. Auth

Add a `/auth` route with email/password (and Google via Lovable Cloud's
broker). Wrap protected routes in a `_authenticated/` layout. Easiest path:
ask Lovable to "enable Lovable Cloud and add auth" — it will wire all of
the above automatically.
