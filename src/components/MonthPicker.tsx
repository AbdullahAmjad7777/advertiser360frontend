import { Input } from "@/components/ui/input";
import { localDateString } from "@/lib/format";

export interface YearMonth {
  year: number;
  month: number;
}

export function currentYearMonth(): YearMonth {
  const [year, month] = localDateString().split("-").map(Number);
  return { year, month };
}

export function yearMonthLabel({ year, month }: YearMonth): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Native month input ("YYYY-MM"); can't go past the current month.
export function MonthPicker({
  value,
  onChange,
}: {
  value: YearMonth;
  onChange: (value: YearMonth) => void;
}) {
  const current = currentYearMonth();
  const toInput = (v: YearMonth) => `${v.year}-${String(v.month).padStart(2, "0")}`;
  return (
    <Input
      type="month"
      aria-label="Month"
      className="h-8 w-40"
      value={toInput(value)}
      max={toInput(current)}
      onChange={(e) => {
        if (!e.target.value) return;
        const [year, month] = e.target.value.split("-").map(Number);
        onChange({ year, month });
      }}
    />
  );
}
