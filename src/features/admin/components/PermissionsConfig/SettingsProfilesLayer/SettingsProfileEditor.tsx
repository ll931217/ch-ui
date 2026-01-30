import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SettingsProfileData {
  name: string;
  id: string;
  settings: Array<{ name: string; value: string }>;
}

interface SettingsProfileEditorProps {
  profile: SettingsProfileData | null;
  onClose: () => void;
  onAddChange: (change: any) => void;
}

// Common ClickHouse settings with descriptions
const COMMON_SETTINGS = [
  { name: "max_memory_usage", description: "Max memory per query (bytes)", type: "number" },
  { name: "max_threads", description: "Max threads for query execution", type: "number" },
  { name: "max_execution_time", description: "Max query execution time (seconds)", type: "number" },
  { name: "max_rows_to_read", description: "Max rows to read", type: "number" },
  { name: "max_bytes_to_read", description: "Max bytes to read", type: "number" },
  { name: "readonly", description: "Read-only mode (0=off, 1=on, 2=distributed)", type: "select", options: ["0", "1", "2"] },
  { name: "allow_ddl", description: "Allow DDL queries", type: "select", options: ["0", "1"] },
  { name: "max_result_rows", description: "Max rows in result", type: "number" },
  { name: "max_result_bytes", description: "Max bytes in result", type: "number" },
];

export default function SettingsProfileEditor({
  profile,
  onClose,
  onAddChange,
}: SettingsProfileEditorProps) {
  const isNewProfile = !profile || !profile.name;

  // Form state
  const [profileName, setProfileName] = useState(profile?.name || "");
  const [settings, setSettings] = useState<Array<{ name: string; value: string }>>(
    profile?.settings || []
  );

  const handleAddSetting = () => {
    setSettings([...settings, { name: "", value: "" }]);
  };

  const handleRemoveSetting = (index: number) => {
    setSettings(settings.filter((_, idx) => idx !== index));
  };

  const handleSettingChange = (
    index: number,
    field: "name" | "value",
    value: string
  ) => {
    const newSettings = [...settings];
    newSettings[index][field] = value;
    setSettings(newSettings);
  };

  const handleSave = () => {
    if (!profileName.trim()) {
      return;
    }

    // Filter out empty settings
    const validSettings = settings.filter((s) => s.name && s.value);

    if (isNewProfile) {
      // Create new settings profile
      let sql = `CREATE SETTINGS PROFILE ${profileName}`;
      if (validSettings.length > 0) {
        const settingsClause = validSettings
          .map((s) => `${s.name} = ${s.value}`)
          .join(", ");
        sql += ` SETTINGS ${settingsClause}`;
      }

      onAddChange({
        type: "CREATE",
        entityType: "SETTINGS_PROFILE",
        entityName: profileName,
        description: `Create settings profile ${profileName}`,
        sqlStatements: [sql],
        originalState: null,
        newState: {
          profileName,
          settings: validSettings,
        },
      });
    } else {
      // For ALTER, drop and recreate
      let createSql = `CREATE SETTINGS PROFILE ${profileName}`;
      if (validSettings.length > 0) {
        const settingsClause = validSettings
          .map((s) => `${s.name} = ${s.value}`)
          .join(", ");
        createSql += ` SETTINGS ${settingsClause}`;
      }

      onAddChange({
        type: "ALTER",
        entityType: "SETTINGS_PROFILE",
        entityName: profileName,
        description: `Update settings profile ${profileName}`,
        sqlStatements: [
          `DROP SETTINGS PROFILE IF EXISTS ${profileName}`,
          createSql,
        ],
        originalState: profile,
        newState: {
          settings: validSettings,
        },
      });
    }

    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {isNewProfile
              ? "Create New Settings Profile"
              : `Edit Settings Profile: ${profile?.name}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile name */}
          <div className="space-y-2">
            <Label htmlFor="profileName">Profile Name</Label>
            <Input
              id="profileName"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              disabled={!isNewProfile}
              placeholder="Enter profile name (e.g., analyst_profile)"
            />
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Settings</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSetting}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Setting
              </Button>
            </div>

            {settings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-md">
                No settings configured. Click "Add Setting" to add one.
              </div>
            ) : (
              <div className="space-y-3">
                {settings.map((setting, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Select
                        value={setting.name}
                        onValueChange={(value) =>
                          handleSettingChange(index, "name", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select setting" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMMON_SETTINGS.map((s) => (
                            <SelectItem key={s.name} value={s.name}>
                              {s.name} - {s.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Input
                        value={setting.value}
                        onChange={(e) =>
                          handleSettingChange(index, "value", e.target.value)
                        }
                        placeholder="Value"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSetting(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Examples */}
          <div className="border-l-4 border-green-500 bg-green-500/10 p-4">
            <h4 className="text-sm font-medium mb-2">Common Examples:</h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>
                • <strong>max_memory_usage</strong> = 10000000000 (10GB limit)
              </li>
              <li>
                • <strong>max_threads</strong> = 4 (use up to 4 threads)
              </li>
              <li>
                • <strong>readonly</strong> = 1 (enable read-only mode)
              </li>
              <li>
                • <strong>max_execution_time</strong> = 300 (5 minute timeout)
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isNewProfile ? "Stage Create" : "Stage Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
