import { useState, type FormEvent } from "react";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import * as employeesApi from "@/api/employees";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api-client";

// No look-alike characters (0/O, 1/l/I), so it can be read out or typed
// from a message without mistakes.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function generatePassword(length = 12) {
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function ResetPasswordDialog({
  employee,
  onClose,
}: {
  employee: { id: number; full_name: string };
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [signOut, setSignOut] = useState(false);
  const [saving, setSaving] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      toast.success("Password copied");
    } catch {
      toast.error("Couldn't copy. Select the password and copy it manually.");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await employeesApi.resetEmployeePassword(employee.id, {
        newPassword: password,
        signOutEverywhere: signOut,
      });
      toast.success(
        `${employee.full_name}'s password was changed. Share the new password with them privately.`,
      );
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to change password"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Set a new password for {employee.full_name}. Their old password stops working
            immediately. They'll get a notification that it was changed, but not the password
            itself, so share it with them yourself.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="newPassword">New password</Label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Input
                  id="newPassword"
                  type={visible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  className="pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setVisible((v) => !v)}
                  aria-label={visible ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Generate a password"
                title="Generate"
                onClick={() => {
                  setPassword(generatePassword());
                  setVisible(true);
                }}
              >
                <RefreshCw />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Copy password"
                title="Copy"
                disabled={!password}
                onClick={copy}
              >
                <Copy />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-primary"
              checked={signOut}
              onChange={(e) => setSignOut(e.target.checked)}
            />
            <span>
              Also sign them out everywhere
              <span className="block text-xs text-muted-foreground">
                Use this if the account may have been misused. It also signs out their desktop
                agent, which stops attendance tracking until they sign in again with the new
                password.
              </span>
            </span>
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || password.length < 8}>
              {saving ? "Saving..." : "Change password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
