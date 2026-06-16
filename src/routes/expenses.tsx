import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useDB, expensesApi, todayISO } from "@/lib/store";
import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses · ShaktiSadan" },
      { name: "description", content: "Add and review household expenses." },
    ],
  }),
  component: ExpensesPage,
});

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

function ExpensesPage() {
  const { expenses } = useDB();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [date, setDate] = useState(todayISO());
  const [q, setQ] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const p = Number(price);
    const qn = Number(quantity);
    if (!name.trim()) return toast.error("Name required");
    if (!Number.isFinite(p) || p <= 0) return toast.error("Price must be > 0");
    if (!Number.isFinite(qn) || qn <= 0) return toast.error("Quantity must be > 0");
    expensesApi.add({ name: name.trim(), price: p, quantity: qn, date });
    toast.success(`Added ${name}`);
    setName(""); setPrice(""); setQuantity("1");
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return expenses.filter((e) => !s || e.name.toLowerCase().includes(s));
  }, [expenses, q]);

  const total = filtered.reduce((s, e) => s + Number(e.price || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display">Expenses</h1>
        <p className="text-sm text-muted-foreground">Log every kharcha so the month adds up cleanly.</p>
      </div>

      <Card className="p-4">
        <form onSubmit={handleAdd} className="grid sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <Label htmlFor="name">Item</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Atta, Vegetables…" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="price">Price ₹</Label>
            <Input id="price" type="number" inputMode="decimal" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="qty">Quantity</Label>
            <Input id="qty" type="number" inputMode="decimal" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="sm:col-span-2 flex items-end">
            <Button type="submit" className="w-full gap-2">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="relative w-full max-w-xs">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9" />
          </div>
          <div className="text-sm text-muted-foreground">
            {filtered.length} entries ·{" "}
            <span className="text-foreground font-medium">Total {inr(total)}</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No expenses to show.</p>
        ) : (
          <div className="overflow-x-auto -mx-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <th className="px-4 py-2 font-medium">Item</th>
                  <th className="px-4 py-2 font-medium">Qty</th>
                  <th className="px-4 py-2 font-medium">Price</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b border-border/40 hover:bg-secondary/40 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{e.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{e.quantity}</td>
                    <td className="px-4 py-2.5 font-display text-primary">{inr(Number(e.price))}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{format(parseISO(e.date), "dd MMM yyyy")}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          expensesApi.remove(e.id);
                          toast.success("Deleted");
                        }}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
