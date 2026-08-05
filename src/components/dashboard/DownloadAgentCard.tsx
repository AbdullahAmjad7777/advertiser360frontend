import { Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api-client";

const DOWNLOAD_URL = `${API_BASE_URL}/downloads/desktop-agent`;

export function DownloadAgentCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Desktop Attendance Agent</CardTitle>
        <CardDescription>
          Install this app and sign in with your HRMS credentials to enable attendance
          monitoring. Extract the zip, then run the .exe inside.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <a href={DOWNLOAD_URL} download className={buttonVariants({ variant: "default" })}>
          <Download />
          Download Desktop App
        </a>
      </CardContent>
    </Card>
  );
}
