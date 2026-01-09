'use client';
import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, CheckCircle, XCircle } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { RoleDetails } from './role-details';
import type { Role } from '@/lib/types';
import { useApp } from '@/context/app-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export function RoleList() {
  const { roles, addRole, permissions } = useApp();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const { toast } = useToast();

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setIsSheetOpen(true);
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Invalid Role Name',
        description: 'Role name cannot be empty.',
      });
      return;
    }
    addRole(newRoleName);
    toast({
      title: 'Role Created',
      description: `The role "${newRoleName}" has been successfully created.`,
    });
    setNewRoleName('');
    setIsAddDialogOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Roles</CardTitle>
              <CardDescription>
                Define user roles and their permissions within the application.
              </CardDescription>
            </div>
            {permissions?.users?.write && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2" />
                    Create Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Role</DialogTitle>
                    <DialogDescription>
                      Give the new role a name. You can assign permissions after
                      it's created.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role-name" className="text-right">
                        Role Name
                      </Label>
                      <Input
                        id="role-name"
                        placeholder="e.g., Manager"
                        className="col-span-3"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateRole}>Save Role</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow
                  key={role.id}
                  className="cursor-pointer"
                  onClick={() => handleSelectRole(role)}
                >
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.userCount}</TableCell>
                  <TableCell>
                    {role.isDefault ? (
                      <CheckCircle className="text-green-500" />
                    ) : (
                      <XCircle className="text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenuItem onClick={() => handleSelectRole(role)}>
                          {permissions?.users?.write ? "Edit Permissions" : "View Permissions"}
                        </DropdownMenuItem>
                        {permissions?.users?.delete && (
                          <DropdownMenuItem
                            disabled={role.isDefault}
                            className="text-destructive"
                          >
                            Delete Role
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-3xl w-[90vw] overflow-y-auto">
          {selectedRole && (
            <RoleDetails
              role={selectedRole}
              onClose={() => setIsSheetOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
