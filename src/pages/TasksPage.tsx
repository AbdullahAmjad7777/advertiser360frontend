import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import * as attendanceApi from "@/api/attendance";
import * as tasksApi from "@/api/tasks";
import { PersonSelect } from "@/components/PersonSelect";
import { MyTasksCard } from "@/components/tasks/MyTasksCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { getErrorMessage } from "@/lib/api-client";
import { formatDate, formatDateTime } from "@/lib/format";
import { canManageTasks } from "@/lib/permissions";

function CeoTasksView() {
  // The server scopes this to every employee + the manager for the CEO,
  // exactly the people tasks can be assigned to.
  const people = useFetch(() => attendanceApi.fetchAttendanceStats(), []);
  const [filter, setFilter] = useState<number | null>(null);
  const tasks = useFetch(() => tasksApi.fetchTasks({ assignedTo: filter ?? undefined }), [filter]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const options = (people.data ?? []).map((p) => ({ id: p.employeeId, name: p.fullName, role: p.role }));

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!assignee) {
      toast.error("Choose who this task is for");
      return;
    }
    setSaving(true);
    try {
      await tasksApi.createTask({
        title: title.trim(),
        description: description.trim() || null,
        assignedTo: assignee,
        dueDate: dueDate || undefined,
      });
      toast.success("Task assigned");
      setTitle("");
      setDescription("");
      setDueDate("");
      tasks.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create task"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await tasksApi.deleteTask(id);
      toast.success("Task deleted");
      tasks.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete task"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[22rem_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Assign a Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="taskTitle">Title</Label>
              <Input
                id="taskTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="taskDescription">Details (optional)</Label>
              <Textarea
                id="taskDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Assign to</Label>
              <PersonSelect
                people={options}
                value={assignee}
                onChange={setAssignee}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="taskDue">Due shift (optional)</Label>
              <Input
                id="taskDue"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Defaults to the current shift. The assignee can't check out of that shift until
                it's done. A shift is the date it started, so 1:00 AM still counts as the
                previous day's shift.
              </p>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Assigning..." : "Assign task"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle>All Tasks</CardTitle>
          <PersonSelect people={options} value={filter} onChange={setFilter} allowAll />
        </CardHeader>
        <CardContent>
          {tasks.loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (tasks.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Assigned to</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tasks.data ?? []).map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="max-w-xs">
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="truncate text-xs text-muted-foreground">{task.description}</div>
                      )}
                    </TableCell>
                    <TableCell>{task.assigned_to_name}</TableCell>
                    <TableCell>{formatDate(task.due_date)}</TableCell>
                    <TableCell>
                      {task.is_completed ? (
                        <div className="flex flex-col gap-0.5">
                          <Badge variant="secondary">Completed</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(task.completed_at)}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${task.title}`}
                        disabled={deletingId === task.id}
                        onClick={() => handleDelete(task.id)}
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function TasksPage() {
  const { user } = useAuth();
  if (!user) return null;
  const isCeo = canManageTasks(user.role);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isCeo
            ? "Assign tasks to employees and the manager, and track their progress."
            : "Tick off each task when it's done. You can't check out while tasks due today or earlier are still pending."}
        </p>
      </div>
      {isCeo ? <CeoTasksView /> : <MyTasksCard title="Assigned to me" />}
    </div>
  );
}
