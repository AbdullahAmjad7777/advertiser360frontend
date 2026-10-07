import { Badge } from "@/components/ui/badge";
import type { Task } from "@/types";

// Who a task came from: the person themselves, or whoever assigned it.
export function TaskOriginBadge({ task }: { task: Task }) {
  if (task.self_added) {
    return <Badge variant="secondary">Self-added</Badge>;
  }
  return (
    <span className="text-xs text-muted-foreground">
      {task.assigned_by_name ? `From ${task.assigned_by_name}` : "Assigned"}
    </span>
  );
}
