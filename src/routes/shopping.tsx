import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useDB, shoppingApi } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/shopping")({
  head: () => ({
    meta: [
      { title: "Shopping List · ShaktiSadan" },
      { name: "description", content: "Things to buy, added by anyone at home." },
    ],
  }),
  component: ShoppingPage,
});

function ShoppingPage() {
  const { shopping, settings } = useDB();
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("kg");
  const [note, setNote] = useState("");

  const pending = shopping.filter((s) => !s.bought);
  const recentlyBought = shopping.filter((s) => s.bought).slice(0, 5);

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("What to buy?");
    const q = Number(qty);
    if (!Number.isFinite(q) || q <= 0) return toast.error("Quantity must be > 0");
    shoppingApi.add({
      name: name.trim(),
      requested_qty: q,
      unit: unit.trim() || "pc",
      note: note.trim() || undefined,
      requested_by: settings.currentUser,
    });
    toast.success(`Added “${name}”`);
    setName(""); setQty("1"); setUnit("kg"); setNote("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-display">Shopping list</h1>
          <p className="text-sm text-muted-foreground">
            Anyone at home can add. Mark bought in{" "}
            <Link to="/clearing" className="text-primary hover:underline">Clearing</Link>.
          </p>
        </div>
        <Link
          to="/clearing"
          className="inline-flex items-center gap-2 rounded-xl bg-secondary text-secondary-foreground px-3 py-2 text-sm font-medium hover:bg-secondary/80"
        >
          <CheckCheck className="h-4 w-4" /> Go to Clearing
        </Link>
      </div>

      <Card className="p-4">
        <form onSubmit={add} className="grid sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <Label htmlFor="sname">Item</Label>
            <Input id="sname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tomato, Soap…" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="sqty">Quantity</Label>
            <Input id="sqty" type="number" inputMode="decimal" step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="sunit">Unit</Label>
            <Input id="sunit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg / pc / l" />
          </div>
          <div className="sm:col-span-3">
            <Label htmlFor="snote">Note</Label>
            <Input id="snote" value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional" />
          </div>
          <div className="sm:col-span-1 flex items-end">
            <Button type="submit" className="w-full gap-2" aria-label="Add">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-4">
        <h2 className="font-display text-lg mb-3">To buy ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">All clear. Nothing pending.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {pending.map((s) => (
              <li key={s.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.requested_qty} {s.unit} · by {s.requested_by} ·{" "}
                    {format(parseISO(s.created_at), "dd MMM")}
                    {s.note ? ` · ${s.note}` : ""}
                  </div>
                </div>
                <Button
                  size="icon" variant="ghost"
                  onClick={() => { shoppingApi.remove(s.id); toast.success("Removed"); }}
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {recentlyBought.length > 0 && (
        <Card className="p-4">
          <h2 className="font-display text-lg mb-3">Recently bought</h2>
          <ul className="divide-y divide-border/60">
            {recentlyBought.map((s) => (
              <li key={s.id} className="py-2 flex items-center justify-between text-sm">
                <span>{s.name}</span>
                <span className="text-xs text-muted-foreground">
                  {s.bought_qty} {s.unit} · ₹{s.bought_price}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
