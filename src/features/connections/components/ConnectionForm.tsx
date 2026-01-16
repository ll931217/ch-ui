// src/features/connections/components/ConnectionForm.tsx
// Form for creating/editing connections (no auth required)

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Eye,
  EyeOff,
  Loader2,
  Save,
  X,
  Server,
  User,
  Lock,
  Cog,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useConnectionStore } from "@/store/connectionStore";
import type { SavedConnection } from "@/lib/db";

const isValidClickHouseUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    return parsed.hostname.length > 0;
  } catch {
    return false;
  }
};

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  url: z.string().min(1, "URL is required").refine(isValidClickHouseUrl, {
    message: "Invalid URL. Please use format: http://hostname:port",
  }),
  username: z.string().min(1, "Username is required"),
  password: z.string().optional(),
  useAdvanced: z.boolean().optional(),
  customPath: z.string().optional(),
  requestTimeout: z
    .number()
    .int("Request timeout must be a whole number")
    .min(1000, "Request timeout must be at least 1000ms")
    .max(600000, "Request timeout must not exceed 600000ms"),
  isDistributed: z.boolean().optional(),
  clusterName: z.string().optional(),
  isDefault: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;
type FormInput = z.input<typeof formSchema>;

interface ConnectionFormProps {
  connection?: SavedConnection | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ConnectionForm({
  connection,
  onSuccess,
  onCancel,
}: ConnectionFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { saveConnection, updateConnectionById } = useConnectionStore();

  const form = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: connection?.name || "",
      url: connection?.url || "",
      username: connection?.username || "",
      password: connection?.password || "",
      useAdvanced: connection?.useAdvanced || false,
      customPath: connection?.customPath || "",
      requestTimeout: connection?.requestTimeout || 30000,
      isDistributed: connection?.isDistributed || false,
      clusterName: connection?.clusterName || "",
      isDefault: connection?.isDefault || false,
    },
  });

  useEffect(() => {
    if (connection?.useAdvanced) {
      setShowAdvanced(true);
    }
  }, [connection]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      if (connection) {
        const success = await updateConnectionById(connection.id, {
          name: data.name,
          url: data.url,
          username: data.username,
          password: data.password,
          useAdvanced: data.useAdvanced,
          customPath: data.customPath,
          requestTimeout: data.requestTimeout,
          isDistributed: data.isDistributed,
          clusterName: data.clusterName,
          isDefault: data.isDefault,
        });

        if (success) {
          toast.success("Connection updated");
          onSuccess();
        }
      } else {
        const result = await saveConnection({
          name: data.name,
          url: data.url,
          username: data.username,
          password: data.password || "",
          useAdvanced: data.useAdvanced,
          customPath: data.customPath,
          requestTimeout: data.requestTimeout,
          isDistributed: data.isDistributed,
          clusterName: data.clusterName,
          isDefault: data.isDefault,
        });

        if (result) {
          toast.success("Connection saved");
          onSuccess();
        }
      }
    } catch (err) {
      toast.error(
        "Failed to save: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Connection Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="My ClickHouse Server"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A friendly name to identify this connection
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                ClickHouse Host
              </FormLabel>
              <FormControl>
                <Input
                  className="font-mono"
                  placeholder="https://your-clickhouse-host:8123"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Username
                </FormLabel>
                <FormControl>
                  <Input
                    className="font-mono"
                    placeholder="default"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      disabled={isSubmitting}
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="requestTimeout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Request Timeout (ms)</FormLabel>
              <FormControl>
                <Input type="number" disabled={isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-4">
          <FormField
            control={form.control}
            name="isDefault"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormLabel className="!mt-0 cursor-pointer">
                  Set as default connection
                </FormLabel>
              </FormItem>
            )}
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full"
        >
          <Cog className="h-4 w-4 mr-2" />
          {showAdvanced ? "Hide" : "Show"} Advanced Settings
        </Button>

        {showAdvanced && (
          <div className="space-y-4 pt-2 border-t">
            <FormField
              control={form.control}
              name="useAdvanced"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer">
                    Use custom path
                  </FormLabel>
                </FormItem>
              )}
            />

            {form.watch("useAdvanced") && (
              <FormField
                control={form.control}
                name="customPath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Path</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., /clickhouse"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="isDistributed"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer">
                    Distributed cluster
                  </FormLabel>
                </FormItem>
              )}
            />

            {form.watch("isDistributed") && (
              <FormField
                control={form.control}
                name="clusterName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cluster Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="my_cluster"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Connection
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
