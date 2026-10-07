import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import * as tasksApi from "@/api/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFetch } from "@/hooks/useFetch";
import { getErrorMessage } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

// The caller's own checklist, plus a quick form to add a task for
// themselves (the CEO and manager see those too). The server only returns
// the caller's tasks and only lets the assignee tick them. Every task due on
// or before the current shift, self-added ones included, must be ticked
// before check-out is allowed.
export function MyTasksCard({
  title = "My Tasks",
  limit,
}: {
  title?: string;
  limit?: number;
}) {
  const tasks = useFetch(() => tasksApi.fetchTasks({ status: "all" }), []);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [adding, setAdding] = useState(false);

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

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      await tasksApi.createTask({ title: newTitle.trim(), dueDate: dueDate || undefined });
      setNewTitle("");
      setDueDate("");
      tasks.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to add task"));
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(task: Task) {
    setBusyId(task.id);
    try {
      await tasksApi.deleteTask(task.id);
      tasks.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete task"));
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
      <CardContent className="flex flex-col gap-3">
        <form onSubmit={handleAdd} className="flex flex-wrap gap-2">
          <Input
            aria-label="New task"
            placeholder="Add a task for yourself..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            maxLength={200}
            className="min-w-0 flex-1 basis-48"
          />
          <Input
            aria-label="Due shift (optional, defaults to the current shift)"
            title="Due shift (defaults to the current shift)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-36"
          />
          <Button type="submit" size="sm" className="h-8" disabled={adding || !newTitle.trim()}>
            <Plus />
            Add
          </Button>
        </form>

        {tasks.loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks yet.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {shown.map((task) => (
              <li key={task.id} className="flex items-start gap-3 py-2.5">
                <input
                  id={`task-${task.id}`}
                  type="checkbox"
                  className="mt-0.5 size-4 cursor-pointer accent-primary"
                  checked={Boolean(task.is_completed)}
                  disabled={busyId === task.id}
                  onChange={() => toggle(task)}
                />
                <label htmlFor={`task-${task.id}`} className="flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5">
                  <span
                    className={cn(
                      "text-sm font-medium break-words",
                      task.is_completed && "text-muted-foreground line-through",
                    )}
                  >
                    {task.title}
                  </span>
                  {task.description && (
                    <span className="text-xs text-muted-foreground">{task.description}</span>
                  )}
                  <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    Due {formatDate(task.due_date)}
                    {task.self_added ? (
                      <Badge variant="outline" className="h-4 px-1.5 text-[10px]">Added by you</Badge>
                    ) : (
                      task.assigned_by_name && <span>· from {task.assigned_by_name}</span>
                    )}
                  </span>
                </label>
                {Boolean(task.self_added) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    aria-label={`Delete ${task.title}`}
                    disabled={busyId === task.id}
                    onClick={() => handleDelete(task)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
