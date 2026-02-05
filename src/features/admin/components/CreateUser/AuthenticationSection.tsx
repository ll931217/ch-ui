// components/CreateNewUser/AuthenticationSection.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Key } from "lucide-react";

interface AuthenticationSectionProps {
  form: any;
  handleGeneratePassword: () => void;
  isEditMode?: boolean;
}

const AuthenticationSection: React.FC<AuthenticationSectionProps> = ({
  form,
  handleGeneratePassword,
  isEditMode = false,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          rules={{
            required: "Username is required",
            minLength: {
              value: 3,
              message: "Username must be at least 3 characters",
            },
            pattern: {
              value: /^[a-zA-Z0-9_]+$/,
              message: "Only letters, numbers, and underscores allowed",
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter username"
                  {...field}
                  readOnly={isEditMode}
                  disabled={isEditMode}
                  className={isEditMode ? "bg-muted" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          rules={{
            required: isEditMode ? false : "Password is required",
            validate: (value: string) => {
              // Skip validation if in edit mode and password is empty
              if (isEditMode && !value) return true;

              if (value.length < 8) {
                return "Password must be at least 8 characters";
              }
              return true;
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isEditMode ? "New Password (Optional)" : "Password"}</FormLabel>
              <div className="flex space-x-2 w-full">
                <FormControl>
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={isEditMode ? "Leave blank to keep current password" : "Enter password"}
                      className="w-full"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-0 h-full px-3"
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
                <Button
                  type="button"
                  onClick={handleGeneratePassword}
                  variant="outline"
                >
                  <Key className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:block">Generate</span>
                </Button>
              </div>
              {isEditMode && (
                <p className="text-sm text-muted-foreground">
                  Leave blank to keep current password
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default AuthenticationSection;
