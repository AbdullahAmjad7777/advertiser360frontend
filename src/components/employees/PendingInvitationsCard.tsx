import { toast } from "sonner";
import * as invitationsApi from "@/api/invitations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFetch } from "@/hooks/useFetch";
import { getErrorMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import type { Invitation } from "@/types";

const STATUS_STYLES: Record<Invitation["status"], string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  revoked: "bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400",
};

export function PendingInvitationsCard() {
  const invitations = useFetch(
    () => invitationsApi.fetchInvitations({ status: "pending", limit: 20 }),
    [],
  );

  async function handleResend(id: number, email: string) {
    try {
      await invitationsApi.resendInvitation(id);
      toast.success(`Invitation resent to ${email}`);
      invitations.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to resend invitation"));
    }
  }

  async function handleRevoke(id: number, email: string) {
    if (!window.confirm(`Revoke the invitation for ${email}? This link will stop working.`)) return;
    try {
      await invitationsApi.revokeInvitation(id);
      toast.success("Invitation revoked");
      invitations.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to revoke invitation"));
    }
  }

  const items = invitations.data?.items ?? [];
  if (!invitations.loading && items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending invitations</CardTitle>
      </CardHeader>
      <CardContent>
        {invitations.loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Invited by</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.email}</TableCell>
                  <TableCell>{inv.invited_by_name ?? "-"}</TableCell>
                  <TableCell>{formatDateTime(inv.expires_at)}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_STYLES[inv.status]}>{inv.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleResend(inv.id, inv.email)}>
                        Resend
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRevoke(inv.id, inv.email)}
                      >
                        Revoke
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
