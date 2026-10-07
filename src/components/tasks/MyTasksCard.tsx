import { useState } from "react";
import { toast } from "sonner";
import * as tasksApi from "@/api/tasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFetch } from "@/hooks/useFetch";
import { getErrorMessage } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

// The assignee's own checklist. The server only returns tasks assigned to
// the caller and only lets the assignee tick them. Every task due on or
// before the current shift must be ticked before check-out is allowed.
export function MyTasksCard({
  title = "My Tasks",
  limit,
}: {
  title?: string;
  limit?: number;
}) {
  const tasks = useFetch(() => tasksApi.fetchTasks({ status: "all" }), []);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function toggle(task: Task) {
    setBusyId(task.id);
    try {
      await tasksApi.setTaskCompleted(task.id, !task.is_completed);
      tasks.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update task"));
    } finally {
      setBusyId(null);
    }
  }

  const items = tasks.data ?? [];
  const pending = items.filter((t) => !t.is_completed);
  const shown = limit ? items.slice(0, limit) : items;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        {!tasks.loading && (
          <span className="text-xs text-muted-foreground">{pending.length} pending</span>
        )}
      </CardHeader>
      <CardContent>
        {tasks.loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks assigned to you.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {shown.map((task) => {
              return (
                <li key={task.id} className="flex items-start gap-3 py-2.5">
                  <input
                    id={`task-${task.id}`}
                    type="checkbox"
                    className="mt-0.5 size-4 cursor-pointer accent-primary"
                    checked={Boolean(task.is_completed)}
                    disabled={busyId === task.id}
                    onChange={() => toggle(task)}
                  />
                  <label htmlFor={`task-${task.id}`} className="flex flex-1 cursor-pointer flex-col gap-0.5">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        task.is_completed && "text-muted-foreground line-through",
                      )}
                    >
                      {task.title}
                    </span>
                    {task.description && (
                      <span className="text-xs text-muted-foreground">{task.description}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Due {formatDate(task.due_date)}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
