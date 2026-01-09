
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MoreHorizontal,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import type { FirestoreMembership, SalaryType } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

export function UserList() {
  const { roles, addUser, memberships, deleteMembership, permissions } = useApp();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<typeof memberships[0] | null>(null);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password_DO_NOT_USE: '',
    roleId: '',
    pin: '',
    salaryType: '' as SalaryType | '',
    salaryAmount: '',
  });

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.roleId || !newUser.password_DO_NOT_USE) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide an email, password, and a role.',
      });
      return;
    }

    addUser(
      newUser.email,
      newUser.password_DO_NOT_USE,
      newUser.roleId,
      newUser.name,
      newUser.pin,
      newUser.salaryType ? newUser.salaryType as SalaryType : undefined,
      newUser.salaryAmount ? parseFloat(newUser.salaryAmount) : undefined
    );

    setNewUser({ name: '', email: '', password_DO_NOT_USE: '', roleId: '', pin: '', salaryType: '', salaryAmount: '' });
    setIsAddDialogOpen(false);
  };

  const handleDelete = () => {
    if (!userToDelete) return;
    deleteMembership(userToDelete.id);
    toast({
      title: 'User Deleted',
      description: `The user ${userToDelete.displayName} has been removed.`,
    });
    setUserToDelete(null);
  };

  return (
    <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage your team members and their account access.
              </CardDescription>
            </div>
            {permissions?.users?.write && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Enter the details below to invite a new user.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        placeholder="Alex Johnson"
                        className="col-span-3"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="alex.j@example.com"
                        className="col-span-3"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="col-span-3"
                        value={newUser.password_DO_NOT_USE}
                        onChange={(e) => setNewUser({ ...newUser, password_DO_NOT_USE: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="pin" className="text-right">
                        PIN
                      </Label>
                      <Input
                        id="pin"
                        type="password"
                        placeholder="4-6 digits"
                        className="col-span-3"
                        value={newUser.pin}
                        onChange={(e) => setNewUser({ ...newUser, pin: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right">
                        Role
                      </Label>
                      <Select
                        value={newUser.roleId}
                        onValueChange={(value) => setNewUser({ ...newUser, roleId: value })}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right pt-2">
                        Salary
                      </Label>
                      <div className="col-span-3 space-y-3">
                        <RadioGroup
                          value={newUser.salaryType}
                          onValueChange={(value: SalaryType) => setNewUser({ ...newUser, salaryType: value })}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="HOURLY" id="hourly" />
                            <Label htmlFor="hourly">Hourly</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="SALARY" id="salary" />
                            <Label htmlFor="salary">Salary</Label>
                          </div>
                        </RadioGroup>
                        {newUser.salaryType && (
                          <Input
                            type="number"
                            placeholder={newUser.salaryType === 'HOURLY' ? "Hourly Rate" : "Base Salary"}
                            value={newUser.salaryAmount}
                            onChange={(e) => setNewUser({ ...newUser, salaryAmount: e.target.value })}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateUser}>Save User</Button>
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
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={`https://picsum.photos/seed/${member.email}/40/40`} />
                        <AvatarFallback>
                          {member.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.displayName}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{member.roleName}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        member.status === 'accepted' ? 'default' : 'outline'
                      }
                      className={
                        member.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : ''
                      }
                    >
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {(permissions?.users?.write || permissions?.users?.delete) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {permissions?.users?.write && <DropdownMenuItem>Edit</DropdownMenuItem>}
                          <DropdownMenuSeparator />
                          {permissions?.users?.delete && (
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={(e) => { e.preventDefault(); setUserToDelete(member); }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the user <span className="font-bold">{userToDelete?.displayName}</span> and remove their data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
