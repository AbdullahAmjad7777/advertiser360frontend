import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import type { LateDeductionGroup } from "@/types";

interface LateDeductionSummaryProps {
  lateDeductionDays: number;
  lateDeductionAmount: string;
  breakdown: LateDeductionGroup[];
}

// "3 lates = 1 unpaid day" only means something if the employee can see
// exactly which 3 late check-ins triggered which deduction — a lump total
// alone isn't transparent. Shown as a small clickable badge everywhere
// payroll rows appear; the dialog has the full dated breakdown.
export function LateDeductionSummary({
  lateDeductionDays,
  lateDeductionAmount,
  breakdown,
}: LateDeductionSummaryProps) {
  const [open, setOpen] = useState(false);

  if (lateDeductionDays <= 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="cursor-pointer">
        <Badge variant="destructive">
          -{lateDeductionDays} day{lateDeductionDays === 1 ? "" : "s"} ({formatCurrency(lateDeductionAmount)})
        </Badge>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Late deduction breakdown</DialogTitle>
            <DialogDescription>
              Every 3 late check-ins deduct 1 day's pay. Shown below are the specific days that
              triggered each deduction.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {breakdown.map((group) => (
              <div key={group.groupNumber} className="rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Group {group.groupNumber}</span>
                  <Badge variant="destructive">-{formatCurrency(group.deductionAmount)}</Badge>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {group.lateDays.map((day) => (
                    <li key={day.date} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{formatDate(day.date)}</span>
                      <span>
                        Checked in {formatTime(day.checkInTime)}{" "}
                        <span className="text-muted-foreground">
                          (office start {group.officeStartTime.slice(0, 5)})
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">
                  3 lates completed on {formatDate(group.deductionDate)} → 1 day's pay deducted.
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
