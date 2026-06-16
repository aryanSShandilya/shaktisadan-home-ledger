import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useDB, shoppingApi, todayISO, type ShoppingItem } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/clearing")({
  head: () => ({
    meta: [
      { title: "Clearing · ShaktiSadan" },
      { name: "description", content: "Tick off bought items, adjust qty and price, save to expenses." },
    ],
  }),
  component: ClearingPage,
});

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

function ClearingPage() {
  const { shopping } = useDB();
  const pending = shopping.filter((s) => !s.bought);
  const cleared = shopping.filter((s) => s.bought).sort((a, b) =>
    (b.bought_at ?? "").localeCompare(a.bought_at ?? ""),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display">Clearing</h1>
        <p className="text-sm text-muted-foreground">
          Tick items as they're bought — adjust the actual quantity and price (e.g. asked 1kg, bought 1.2kg), then save.
        </p>
      </div>

      <Card className="p-4">
        <h2 className="font-display text-lg mb-3">Pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No pending items.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((s) => (
              <PendingRow key={s.id} item={s} />
            ))}
          </ul>
        )}
      </Card>

      {cleared.length > 0 && (
        <Card className="p-4">
          <h2 className="font-display text-lg mb-3">Cleared</h2>
          <ul className="divide-y divide-border/60">
            {cleared.map((s) => (
              <li key={s.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Check className="h-4 w-4 text-leaf shrink-0" />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.bought_qty} {s.unit} · {inr(Number(s.bought_price ?? 0))}
                      {s.bought_at ? ` · ${format(parseISO(s.bought_at), "dd MMM")}` : ""}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm" variant="ghost"
                  onClick={() => { shoppingApi.uncheck(s.id); toast.success("Moved back to pending"); }}
                  className="gap-1"
                >
                  <Undo2 className="h-3.5 w-3.5" /> Undo
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function PendingRow({ item }: { item: ShoppingItem }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(String(item.requested_qty));
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(todayISO());
  const [addExp, setAddExp] = useState(true);

  function save() {
    const q = Number(qty), p = Number(price);
    if (!Number.isFinite(q) || q <= 0) return toast.error("Quantity must be > 0");
    if (!Number.isFinite(p) || p <= 0) return toast.error("Price must be > 0");
    shoppingApi.clear(item.id, { bought_qty: q, bought_price: p, date, addAsExpense: addExp });
    toast.success(`${item.name} cleared`);
  }

  return (
    <li className="rounded-xl border border-border/70 bg-card/60">
      <div className="p-3 flex items-center gap-3">
        <Checkbox
          checked={open}
          onCheckedChange={(v) => setOpen(Boolean(v))}
          aria-label="Mark bought"
          className="h-5 w-5"
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{item.name}</div>
          <div className="text-xs text-muted-foreground">
            Requested {item.requested_qty} {item.unit} · by {item.requested_by}
            {item.note ? ` · ${item.note}` : ""}
          </div>
        </div>
      </div>

      {open && (
        <div className="px-3 pb-3 grid sm:grid-cols-12 gap-3 border-t border-border/60 pt-3">
          <div className="sm:col-span-3">
            <Label className="text-xs">Actual qty ({item.unit})</Label>
            <Input type="number" inputMode="decimal" step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div className="sm:col-span-3">
            <Label className="text-xs">Price paid ₹</Label>
            <Input type="number" inputMode="decimal" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
          </div>
          <div className="sm:col-span-3">
            <Label className="text-xs">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="sm:col-span-3 flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox checked={addExp} onCheckedChange={(v) => setAddExp(Boolean(v))} />
              Add to expenses
            </label>
            <Button onClick={save} className="gap-2">
              <Check className="h-4 w-4" /> Save
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
