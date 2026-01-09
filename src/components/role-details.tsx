
'use client';
import { useState, useEffect } from 'react';
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { PermissionMatrix } from './permission-matrix';
import type { Role, PermissionsMap, FirestoreRole } from '@/lib/types';
import { Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/context/app-context';

type RoleDetailsProps = {
  role: Role;
  onClose: () => void;
};

export function RoleDetails({ role, onClose }: RoleDetailsProps) {
  const { toast } = useToast();
  const { updateRole, permissions: appPermissions } = useApp();
  const [roleName, setRoleName] = useState(role.name);
  const [permissions, setPermissions] = useState<PermissionsMap>(role.permissions);
  const [isSuperUser, setIsSuperUser] = useState(false);

  useEffect(() => {
    setRoleName(role.name);
    setPermissions(role.permissions);
    setIsSuperUser(false); // Reset on role change
  }, [role]);

  const handlePermissionChange = (
    module: keyof PermissionsMap,
    permission: keyof PermissionsMap[keyof PermissionsMap],
    value: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [permission]: value,
      },
    }));
  };

  const handleSuperUserToggle = (enabled: boolean) => {
    setIsSuperUser(enabled);
    if (enabled) {
      const allEnabledPermissions = { ...permissions };
      for (const moduleKey in allEnabledPermissions) {
        allEnabledPermissions[moduleKey as keyof PermissionsMap] = {
          read: true,
          write: true,
          delete: true,
        };
      }
      setPermissions(allEnabledPermissions);
    }
  }

  const handleSaveChanges = () => {
    const updatedData: Partial<FirestoreRole> = {
      name: roleName,
      permissions: permissions,
    };

    updateRole(role.id, updatedData);

    toast({
      title: 'Role Updated',
      description: `Permissions for ${roleName} have been saved.`,
    });
    onClose();
  };



  const isOwner = role.name === 'Owner';
  const canEdit = appPermissions?.users?.write;

  return (
    <>
      <SheetHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <SheetTitle className="text-2xl">Edit Role: {role.name}</SheetTitle>
            <SheetDescription>
              {isOwner ? "The Owner role has all permissions and cannot be changed." : canEdit ? "Modify permissions for this role across the application." : "View permissions for this role."}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>
      <div className="space-y-6">
        <Separator />

        <div className="space-y-2">
          <Label htmlFor="role-name">Role Name</Label>
          <Input id="role-name" value={roleName} onChange={(e) => setRoleName(e.target.value)} disabled={role.isDefault || !canEdit} />
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Permissions</h3>
            {!isOwner && (
              <div className="flex items-center space-x-2">
                <Switch id="super-user-toggle" checked={isSuperUser} onCheckedChange={handleSuperUserToggle} />
                <Label htmlFor="super-user-toggle" className="font-medium">Make super user</Label>
              </div>
            )}
          </div>
          <PermissionMatrix permissions={permissions} onPermissionChange={handlePermissionChange} disabled={isOwner} />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {canEdit && (
            <Button onClick={handleSaveChanges} disabled={isOwner}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          )}
        </div>

      </div>
    </>
  );
}
