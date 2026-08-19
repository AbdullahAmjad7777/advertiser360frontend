import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import * as invitationsApi from "@/api/invitations";
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

interface InviteEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited: () => void;
}

// The whole point of the self-onboarding flow (see OnboardingPage) is that
// CEO/manager only ever supplies an email here — every other detail (name,
// department, bank info, ...) is filled in by the employee themselves once
// they open the emailed link.
export function InviteEmployeeDialog({ open, onOpenChange, onInvited }: InviteEmployeeDialogProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await invitationsApi.inviteEmployee(email);
      toast.success(`Invitation sent to ${email}`);
      setEmail("");
      onOpenChange(false);
      onInvited();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to send invitation"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite employee</DialogTitle>
          <DialogDescription>
            Enter the employee's email address. They'll receive a secure link to fill in their
            own profile details and set their password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@example.com"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
