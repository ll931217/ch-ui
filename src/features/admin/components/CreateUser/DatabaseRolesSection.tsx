// components/CreateNewUser/DatabaseRolesSection.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DatabaseRolesSectionProps {
  form: any;
  roles: string[];
  databases: string[];
}

const DatabaseRolesSection: React.FC<DatabaseRolesSectionProps> = ({ form, roles, databases }) => {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database and Roles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Default Role */}
        <FormField
          control={form.control}
          name="defaultRole"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select default role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Default Database */}
        <FormField
          control={form.control}
          name="defaultDatabase"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Database</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select default database" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {databases.map((db) => (
                    <SelectItem key={db} value={db}>
                      {db}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default DatabaseRolesSection;
