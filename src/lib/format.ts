const PKT_TIME_ZONE = "Asia/Karachi";

// Every date/time value from the API is a naive "YYYY-MM-DD[ HH:MM:SS]"
// string with no timezone marker. The backend now writes these as PKT
// wall-clock (see backend/src/config/db.js), so treat them as such
// explicitly here — tagging with +05:00 — rather than letting the JS Date
// constructor fall back to interpreting them in the *viewer's* browser
// timezone, which would silently shift the displayed time for anyone not
// sitting in Pakistan.
function parsePkt(value: string): Date {
  const iso = value.includes("T") ? value : value.replace(" ", "T");
  return new Date(`${iso}+05:00`);
}

export function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "-";
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = parsePkt(value.includes("T") || value.includes(" ") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: PKT_TIME_ZONE,
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = parsePkt(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PKT_TIME_ZONE,
  });
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = parsePkt(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PKT_TIME_ZONE,
  });
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? String(month);
}

// "Today" (or any instant) as a YYYY-MM-DD string in PKT — matches the
// backend's shift-date resolution (see backend/src/utils/timezone.js)
// regardless of the viewer's own browser/OS timezone.
export function localDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PKT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}
