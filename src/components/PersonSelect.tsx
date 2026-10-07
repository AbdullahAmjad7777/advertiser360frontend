import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PersonOption {
  id: number;
  name: string;
  role?: string;
}

// Picks one person (or "everyone" when allowAll) by id. `items` lets the
// trigger show the name instead of the raw id.
export function PersonSelect({
  people,
  value,
  onChange,
  allowAll,
  placeholder = "Select a person",
  className = "w-56",
}: {
  people: PersonOption[];
  value: number | null;
  onChange: (id: number | null) => void;
  allowAll?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const items: Record<string, string> = {};
  if (allowAll) items.all = "Everyone";
  for (const p of people) items[String(p.id)] = p.role === "manager" ? `${p.name} (Manager)` : p.name;

  return (
    <Select
      items={items}
      value={value == null ? (allowAll ? "all" : null) : String(value)}
      onValueChange={(v) => onChange(v == null || v === "all" ? null : Number(v))}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(items).map(([key, label]) => (
          <SelectItem key={key} value={key}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
