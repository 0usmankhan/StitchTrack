
'use client';
import DashboardLayout from '@/components/dashboard-layout';
import { UserList } from '@/components/user-list';
import { RoleList } from '@/components/role-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield } from 'lucide-react';

export default function UsersPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Team Management
        </h1>
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="users">
              <Users className="mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="roles">
              <Shield className="mr-2" />
              Roles
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <UserList />
          </TabsContent>
          <TabsContent value="roles">
            <RoleList />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
