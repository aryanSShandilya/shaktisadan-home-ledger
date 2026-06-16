import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useDB, dailyApi } from "@/lib/store";
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday,
  addMonths, subMonths, startOfWeek, parseISO,
} from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Milk, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/daily")({
  head: () => ({
    meta: [
      { title: "Milk & Water · ShaktiSadan" },
      { name: "description", content: "Mark daily milk and water deliveries." },
    ],
  }),
  component: DailyPage,
});

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

function DailyPage() {
  const { daily, settings } = useDB();
  const [cursor, setCursor] = useState(new Date());

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });

  const days = useMemo(() => {
    const arr: Date[] = [];
    const total = 42; // 6 weeks
    for (let i = 0; i < total; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [gridStart]);

  const monthMarks = daily.filter((d) => {
    const dd = parseISO(d.date);
    return dd >= monthStart && dd <= monthEnd;
  });
  const milkDays = monthMarks.filter((d) => d.milk).length;
  const waterDays = monthMarks.filter((d) => d.water).length;
  const milkCost = milkDays * settings.milkPricePerDay;
  const waterCost = waterDays * settings.waterPricePerDay;

  function markFor(date: Date) {
    const iso = format(date, "yyyy-MM-dd");
    return daily.find((d) => d.date === iso) ?? { date: iso, milk: false, water: false };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-display">Milk & Water</h1>
          <p className="text-sm text-muted-foreground">
            Tap the dot to mark delivery. Cost auto-calculates from settings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCursor(subMonths(cursor, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-display text-lg min-w-[10ch] text-center">
            {format(cursor, "MMMM yyyy")}
          </div>
          <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Card className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-turmeric/30 grid place-items-center">
            <Milk className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Milk this month</div>
            <div className="font-display text-2xl">{inr(milkCost)}</div>
            <div className="text-xs text-muted-foreground">
              {milkDays} days × {inr(settings.milkPricePerDay)}
            </div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-leaf/20 grid place-items-center">
            <Droplets className="h-6 w-6 text-leaf" />
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Water this month</div>
            <div className="font-display text-2xl">{inr(waterCost)}</div>
            <div className="text-xs text-muted-foreground">
              {waterDays} days × {inr(settings.waterPricePerDay)}
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-7 text-center text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day) => {
            const inMonth = isSameMonth(day, cursor);
            const iso = format(day, "yyyy-MM-dd");
            const mark = markFor(day);
            return (
              <div
                key={iso}
                className={cn(
                  "aspect-square rounded-lg border p-1.5 flex flex-col text-left transition-colors",
                  inMonth ? "bg-card border-border/60" : "bg-muted/30 border-transparent opacity-50",
                  isToday(day) && "ring-2 ring-saffron",
                )}
              >
                <div className="text-[11px] font-medium text-muted-foreground">
                  {format(day, "d")}
                </div>
                <div className="mt-auto flex items-center justify-between gap-1">
                  <button
                    type="button"
                    disabled={!inMonth}
                    onClick={() => dailyApi.toggle(iso, "milk")}
                    aria-label="Toggle milk"
                    className={cn(
                      "h-5 w-5 rounded-full grid place-items-center transition",
                      mark.milk
                        ? "bg-turmeric text-foreground shadow-warm"
                        : "bg-secondary/70 text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    <Milk className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    disabled={!inMonth}
                    onClick={() => dailyApi.toggle(iso, "water")}
                    aria-label="Toggle water"
                    className={cn(
                      "h-5 w-5 rounded-full grid place-items-center transition",
                      mark.water
                        ? "bg-leaf text-primary-foreground"
                        : "bg-secondary/70 text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    <Droplets className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-turmeric" /> Milk taken
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-leaf" /> Water taken
          </span>
        </div>
      </Card>
    </div>
  );
}
