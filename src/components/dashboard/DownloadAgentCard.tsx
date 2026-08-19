import { Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api-client";
import { detectOS } from "@/lib/os-detect";
import { triggerGuardedDownload } from "@/lib/download";

const WINDOWS_DOWNLOAD_URL = `${API_BASE_URL}/downloads/desktop-agent`;
const MAC_DOWNLOAD_URL = `${API_BASE_URL}/downloads/desktop-agent?platform=mac`;

export function DownloadAgentCard() {
  const os = detectOS();
  const isMac = os === "mac";
  const primaryUrl = isMac ? MAC_DOWNLOAD_URL : WINDOWS_DOWNLOAD_URL;
  const otherUrl = isMac ? WINDOWS_DOWNLOAD_URL : MAC_DOWNLOAD_URL;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desktop Attendance Agent</CardTitle>
        <CardDescription>
          Install this app and sign in with your HRMS credentials to enable attendance
          monitoring.{" "}
          {isMac
            ? "Open the .dmg and drag the app into Applications."
            : "Extract the zip, then run the .exe inside."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-2">
        <a
          href={primaryUrl}
          download
          onClick={(e) => {
            e.preventDefault();
            triggerGuardedDownload(primaryUrl, isMac ? "The Mac installer" : "The Windows installer");
          }}
          className={buttonVariants({ variant: "default" })}
        >
          <Download />
          Download for {isMac ? "Mac" : "Windows"}
        </a>
        <a
          href={otherUrl}
          download
          onClick={(e) => {
            e.preventDefault();
            triggerGuardedDownload(otherUrl, isMac ? "The Windows installer" : "The Mac installer");
          }}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Download for {isMac ? "Windows" : "Mac"} instead
        </a>
      </CardContent>
    </Card>
  );
}
