
'use client';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import type { PermissionsMap } from '@/lib/types';
import { Card } from './ui/card';

type PermissionMatrixProps = {
  permissions: PermissionsMap;
  onPermissionChange: (
    module: keyof PermissionsMap,
    permission: keyof PermissionsMap[keyof PermissionsMap],
    value: boolean
  ) => void;
  disabled?: boolean;
};

const permissionModules = [
  { key: 'pos', label: 'Point of Sale' },
  { key: 'orders', label: 'Stitching Orders' },
  { key: 'repairs', label: 'Repair Orders' },
  { key: 'purchaseOrders', label: 'Purchase Orders'},
  { key: 'customers', label: 'Customers' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'reports', label: 'Reports' },
  { key: 'users', label: 'Team Management' },
  { key: 'customization', label: 'App Customization' },
  { key: 'settings', label: 'Account Settings' },
] as const;

export function PermissionMatrix({ permissions, onPermissionChange, disabled = false }: PermissionMatrixProps) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Module</TableHead>
            <TableHead className="text-center">Read</TableHead>
            <TableHead className="text-center">Write</TableHead>
            <TableHead className="text-center">Delete</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {permissionModules.map(({ key, label }) => (
            <TableRow key={key}>
              <TableCell className="font-medium">{label}</TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={permissions[key]?.read ?? false}
                  onCheckedChange={(checked) =>
                    onPermissionChange(key, 'read', checked)
                  }
                  disabled={disabled}
                />
              </TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={permissions[key]?.write ?? false}
                  onCheckedChange={(checked) =>
                    onPermissionChange(key, 'write', checked)
                  }
                  disabled={disabled}
                />
              </TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={permissions[key]?.delete ?? false}
                  onCheckedChange={(checked) =>
                    onPermissionChange(key, 'delete', checked)
                  }
                  disabled={disabled}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
