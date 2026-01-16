import { Server, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import useAppStore from "@/store";
import { ConnectionManager } from "@/features/connections/components";

export default function SettingsPage() {
  document.title = "CH-UI | Settings";
  const { credential, credentialSource, clearLocalData } = useAppStore();

  const handleClearLocal = () => {
    const confirmed = window.confirm(
      "This will clear tabs and metrics layouts saved locally. Credentials are kept. Continue?"
    );
    if (!confirmed) return;
    clearLocalData();
    toast.success("Local data cleared");
  };

  return (
    <div className="max-h-screen w-full overflow-y-auto">
      <div className="max-w-2xl mx-auto py-8">
        <div className="space-y-8">
          {credentialSource === "env" && (
            <Alert variant="info" className="mb-8">
              <AlertTitle className="flex items-center font-semibold">
                <Server className="mr-2 h-4 w-4" />
                Using Environment Variables
              </AlertTitle>
              <AlertDescription>
                Your ClickHouse credentials are set using environment variables.
                Please update your environment variables to change the
                connection settings.
                <hr className="my-4" />
                <p className="text-sm">
                  You are connected to: {credential?.url}
                  <br />
                  User: {credential?.username}
                  <br />
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Connection Manager - handles add/edit/delete/connect */}
          <ConnectionManager />

          {/* Local data management */}
          <Card className="shadow-lg border-muted">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Trash2 className="h-6 w-6 text-primary" />
                Local Data
              </CardTitle>
              <CardDescription>
                Clear tabs and dashboard layouts saved in this browser.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This keeps your saved connections. Use the connection manager
                above to delete individual connections.
              </p>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 rounded-b-lg pt-4 flex justify-end">
              <Button variant="destructive" onClick={handleClearLocal}>
                <Trash2 className="mr-2 h-4 w-4" /> Clear Local Data
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
