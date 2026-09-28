import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import * as onboardingApi from "@/api/onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFetch } from "@/hooks/useFetch";
import { getErrorMessage } from "@/lib/api-client";

interface FormState {
  fullName: string;
  password: string;
  confirmPassword: string;
  phone: string;
  cnicNumber: string;
  address: string;
  gender: "male" | "female" | "other" | "";
  dateOfBirth: string;
  departmentId: string;
  designationId: string;
  managerId: string;
  baseSalary: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
}

const EMPTY_FORM: FormState = {
  fullName: "",
  password: "",
  confirmPassword: "",
  phone: "",
  cnicNumber: "",
  address: "",
  gender: "",
  dateOfBirth: "",
  departmentId: "",
  designationId: "",
  managerId: "",
  baseSalary: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",
  bankName: "",
  accountTitle: "",
  accountNumber: "",
  iban: "",
};

export default function OnboardingPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const invitation = useFetch(() => onboardingApi.fetchInvitationByToken(token!), [token]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const bankFieldsStarted = form.bankName || form.accountTitle || form.accountNumber;
    if (bankFieldsStarted && (!form.bankName || !form.accountTitle || !form.accountNumber)) {
      toast.error("Bank name, account title, and account number are all required to save bank details");
      return;
    }

    setSubmitting(true);
    try {
      await onboardingApi.completeOnboarding(token, {
        fullName: form.fullName,
        password: form.password,
        phone: form.phone || undefined,
        cnicNumber: form.cnicNumber || undefined,
        address: form.address || undefined,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        designationId: form.designationId ? Number(form.designationId) : undefined,
        managerId: form.managerId ? Number(form.managerId) : undefined,
        baseSalary: form.baseSalary ? Number(form.baseSalary) : undefined,
        emergencyContactName: form.emergencyContactName || undefined,
        emergencyContactPhone: form.emergencyContactPhone || undefined,
        emergencyContactRelation: form.emergencyContactRelation || undefined,
        bankName: form.bankName || undefined,
        accountTitle: form.accountTitle || undefined,
        accountNumber: form.accountNumber || undefined,
        iban: form.iban || undefined,
        profilePicture,
      });
      toast.success("Profile submitted — your account is ready. Please sign in.");
      navigate("/login");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to submit your profile"));
    } finally {
      setSubmitting(false);
    }
  }

  if (invitation.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">Loading invitation...</p>
      </div>
    );
  }

  if (invitation.error || !invitation.data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>This link isn't valid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {invitation.error ?? "This invitation link could not be found."} Please ask your
              CEO or manager to send a new invitation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { email, departments, designations, managers } = invitation.data;
  const filteredDesignations = designations.filter(
    (d) => !form.departmentId || String(d.department_id) === form.departmentId,
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Complete your profile</CardTitle>
          <p className="text-sm text-muted-foreground">
            You're setting up the account for <span className="font-medium">{email}</span>.
            Fill in your details below to activate it.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
            <section className="grid grid-cols-2 gap-4">
              <h3 className="col-span-2 text-sm font-semibold">Account</h3>
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  minLength={8}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  minLength={8}
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  required
                />
              </div>
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="profilePicture">Profile picture</Label>
                <Input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfilePicture(e.target.files?.[0] ?? null)}
                />
              </div>
            </section>

            <section className="grid grid-cols-2 gap-4">
              <h3 className="col-span-2 text-sm font-semibold">Personal details</h3>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cnicNumber">CNIC number</Label>
                <Input
                  id="cnicNumber"
                  value={form.cnicNumber}
                  onChange={(e) => update("cnicNumber", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => update("gender", (v ?? "") as FormState["gender"])}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dateOfBirth">Date of birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => update("dateOfBirth", e.target.value)}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={form.address} onChange={(e) => update("address", e.target.value)} />
              </div>
            </section>

            <section className="grid grid-cols-2 gap-4">
              <h3 className="col-span-2 text-sm font-semibold">Employment</h3>
              <div className="flex flex-col gap-2">
                <Label>Department</Label>
                <Select
                  value={form.departmentId}
                  onValueChange={(v) => update("departmentId", v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.department_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Position</Label>
                <Select
                  value={form.designationId}
                  onValueChange={(v) => update("designationId", v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDesignations.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.designation_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex flex-col gap-2">
                <Label>Reporting manager</Label>
                <Select value={form.managerId} onValueChange={(v) => update("managerId", v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="baseSalary">Expected salary (PKR)</Label>
                <Input
                  id="baseSalary"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.baseSalary}
                  onChange={(e) => update("baseSalary", e.target.value)}
                />
              </div>
            </section>

            <section className="grid grid-cols-2 gap-4">
              <h3 className="col-span-2 text-sm font-semibold">Emergency contact</h3>
              <div className="flex flex-col gap-2">
                <Label htmlFor="emergencyContactName">Name</Label>
                <Input
                  id="emergencyContactName"
                  value={form.emergencyContactName}
                  onChange={(e) => update("emergencyContactName", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="emergencyContactPhone">Phone</Label>
                <Input
                  id="emergencyContactPhone"
                  value={form.emergencyContactPhone}
                  onChange={(e) => update("emergencyContactPhone", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="emergencyContactRelation">Relation</Label>
                <Input
                  id="emergencyContactRelation"
                  value={form.emergencyContactRelation}
                  onChange={(e) => update("emergencyContactRelation", e.target.value)}
                />
              </div>
            </section>

            <section className="grid grid-cols-2 gap-4">
              <h3 className="col-span-2 text-sm font-semibold">
                Bank details <span className="font-normal text-muted-foreground">(optional)</span>
              </h3>
              <div className="flex flex-col gap-2">
                <Label htmlFor="bankName">Bank name</Label>
                <Input id="bankName" value={form.bankName} onChange={(e) => update("bankName", e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="accountTitle">Account title</Label>
                <Input
                  id="accountTitle"
                  value={form.accountTitle}
                  onChange={(e) => update("accountTitle", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="accountNumber">Account number</Label>
                <Input
                  id="accountNumber"
                  value={form.accountNumber}
                  onChange={(e) => update("accountNumber", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input id="iban" value={form.iban} onChange={(e) => update("iban", e.target.value)} />
              </div>
            </section>

            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit and activate my account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
