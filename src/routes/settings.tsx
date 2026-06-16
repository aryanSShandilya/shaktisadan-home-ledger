import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useDB, settingsApi } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · ShaktiSadan" },
      { name: "description", content: "Household name, member, milk and water prices." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings } = useDB();
  const [household, setHousehold] = useState(settings.householdName);
  const [member, setMember] = useState(settings.currentUser);
  const [milk, setMilk] = useState(String(settings.milkPricePerDay));
  const [water, setWater] = useState(String(settings.waterPricePerDay));

  function save() {
    const m = Number(milk), w = Number(water);
    if (!Number.isFinite(m) || m < 0) return toast.error("Milk price invalid");
    if (!Number.isFinite(w) || w < 0) return toast.error("Water price invalid");
    settingsApi.update({
      householdName: household.trim() || "ShaktiSadan",
      currentUser: member.trim() || "Member",
      milkPricePerDay: m,
      waterPricePerDay: w,
    });
    toast.success("Saved");
  }

  function resetAll() {
    if (!confirm("Erase all local data? This cannot be undone.")) return;
    localStorage.removeItem("shaktisadan.ledger.v1");
    location.reload();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-display">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Names show up across the app; prices are used to auto-calc milk & water cost.
        </p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="hh">Household name</Label>
            <Input id="hh" value={household} onChange={(e) => setHousehold(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="me">Your name</Label>
            <Input id="me" value={member} onChange={(e) => setMember(e.target.value)} placeholder="e.g. Aman" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="mp">Milk price per day (₹)</Label>
            <Input id="mp" type="number" inputMode="decimal" step="0.01" value={milk} onChange={(e) => setMilk(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="wp">Water price per day (₹)</Label>
            <Input id="wp" type="number" inputMode="decimal" step="0.01" value={water} onChange={(e) => setWater(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-between pt-2">
          <Button variant="ghost" onClick={resetAll} className="text-destructive hover:text-destructive">
            Reset all data
          </Button>
          <Button onClick={save}>Save changes</Button>
        </div>
      </Card>

      <Card className="p-4 text-sm leading-6 text-muted-foreground">
        <h2 className="font-display text-lg text-foreground mb-1">Connecting Supabase later</h2>
        <p>
          Data lives in your browser (localStorage) for now. To move to Supabase + add real auth,
          see <code className="text-foreground">CONNECT.md</code> in the project root — it has the
          SQL schema and the exact functions in <code className="text-foreground">src/lib/store.ts</code>{" "}
          to swap.
        </p>
      </Card>
    </div>
  );
}
