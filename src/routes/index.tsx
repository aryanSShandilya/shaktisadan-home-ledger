import { createFileRoute, Link } from "@tanstack/react-router";
import { useDB } from "@/lib/store";
import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, subDays } from "date-fns";
import { Card } from "@/components/ui/card";
import { IndianRupee, Droplets, Milk, Receipt, ShoppingBasket } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · ShaktiSadan Ledger" },
      { name: "description", content: "Monthly spend, milk & water, and shopping at a glance." },
    ],
  }),
  component: Dashboard,
});

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

function Dashboard() {
  const { expenses, daily, shopping, settings } = useDB();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthExpenses = useMemo(
    () => expenses.filter((e) => {
      const d = parseISO(e.date);
      return d >= monthStart && d <= monthEnd;
    }),
    [expenses, monthStart, monthEnd],
  );

  const monthDaily = useMemo(
    () => daily.filter((d) => {
      const dd = parseISO(d.date);
      return dd >= monthStart && dd <= monthEnd;
    }),
    [daily, monthStart, monthEnd],
  );

  const milkDays = monthDaily.filter((d) => d.milk).length;
  const waterDays = monthDaily.filter((d) => d.water).length;
  const milkCost = milkDays * settings.milkPricePerDay;
  const waterCost = waterDays * settings.waterPricePerDay;
  const expenseTotal = monthExpenses.reduce((s, e) => s + Number(e.price || 0), 0);
  const grandTotal = expenseTotal + milkCost + waterCost;

  // Last 14 days bar
  const last14 = eachDayOfInterval({ start: subDays(now, 13), end: now }).map((day) => {
    const iso = format(day, "yyyy-MM-dd");
    const dayExp = expenses
      .filter((e) => e.date === iso)
      .reduce((s, e) => s + Number(e.price || 0), 0);
    const m = daily.find((d) => d.date === iso);
    const dailyCost =
      (m?.milk ? settings.milkPricePerDay : 0) + (m?.water ? settings.waterPricePerDay : 0);
    return { day: format(day, "dd MMM"), total: dayExp + dailyCost };
  });

  // Category split (by name)
  const byName = monthExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.name] = (acc[e.name] ?? 0) + Number(e.price || 0);
    return acc;
  }, {});
  if (milkCost) byName["Milk"] = (byName["Milk"] ?? 0) + milkCost;
  if (waterCost) byName["Water"] = (byName["Water"] ?? 0) + waterCost;
  const pie = Object.entries(byName)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const pieColors = [
    "var(--chart-1)", "var(--chart-2)", "var(--chart-3)",
    "var(--chart-4)", "var(--chart-5)", "var(--accent)",
  ];

  const pendingShopping = shopping.filter((s) => !s.bought).length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {format(now, "MMMM yyyy")}
          </p>
          <h1 className="text-3xl sm:text-4xl font-display mt-1">
            Aaj ka hisaab, <span className="text-primary">sambhal ke.</span>
          </h1>
        </div>
        <Link
          to="/expenses"
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium shadow-warm hover:bg-primary/90 transition"
        >
          <Receipt className="h-4 w-4" /> Add expense
        </Link>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={IndianRupee} label="This month" value={inr(grandTotal)} accent="primary" />
        <StatCard icon={Receipt} label="Expenses" value={inr(expenseTotal)} accent="saffron" />
        <StatCard icon={Milk} label={`Milk · ${milkDays} days`} value={inr(milkCost)} accent="turmeric" />
        <StatCard icon={Droplets} label={`Water · ${waterDays} days`} value={inr(waterCost)} accent="leaf" />
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-4">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="font-display text-lg">Last 14 days</h2>
            <span className="text-xs text-muted-foreground">Daily total (₹)</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last14} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip
                  cursor={{ fill: "color-mix(in oklab, var(--accent) 25%, transparent)" }}
                  contentStyle={{
                    background: "var(--popover)", border: "1px solid var(--border)",
                    borderRadius: 10, fontSize: 12,
                  }}
                  formatter={(v: number) => inr(v)}
                />
                <Bar dataKey="total" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-display text-lg mb-2">Where it goes</h2>
          {pie.length === 0 ? (
            <div className="h-64 grid place-items-center text-sm text-muted-foreground">
              Add some expenses to see the split.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {pie.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)", border: "1px solid var(--border)",
                      borderRadius: 10, fontSize: 12,
                    }}
                    formatter={(v: number) => inr(v)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg">Recent expenses</h2>
            <Link to="/expenses" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses yet.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {expenses.slice(0, 6).map((e) => (
                <li key={e.id} className="py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{e.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(parseISO(e.date), "dd MMM")} · qty {e.quantity}
                    </div>
                  </div>
                  <div className="font-display text-primary">{inr(Number(e.price))}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg">Shopping list</h2>
            <Link to="/shopping" className="text-xs text-primary hover:underline">Open</Link>
          </div>
          {pendingShopping === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShoppingBasket className="h-4 w-4" /> Nothing pending. Sab ho gaya.
            </div>
          ) : (
            <ul className="space-y-2">
              {shopping.filter((s) => !s.bought).slice(0, 6).map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{s.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.requested_qty} {s.unit} · {s.requested_by}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: "primary" | "saffron" | "turmeric" | "leaf";
}) {
  const ring = {
    primary: "from-primary/20 to-primary/5 text-primary",
    saffron: "from-saffron/25 to-saffron/5 text-saffron",
    turmeric: "from-turmeric/40 to-turmeric/10 text-foreground",
    leaf: "from-leaf/25 to-leaf/5 text-leaf",
  }[accent];
  return (
    <Card className="p-4 relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${ring} opacity-60 pointer-events-none`} />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Icon className="h-3.5 w-3.5" /> {label}
        </div>
        <div className="mt-2 font-display text-2xl">{value}</div>
      </div>
    </Card>
  );
}
