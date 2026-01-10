
export const getAccountsCollection = () => 'accounts';
export const getAccountDocument = (accountId: string) => `accounts/${accountId}`;

export const getRolesCollection = (accountId: string) => `accounts/${accountId}/roles`;
export const getMembershipsCollection = (accountId: string) => `accounts/${accountId}/memberships`;

export const getUsersCollection = () => 'users';
export const getUserDocument = (userId: string) => `users/${userId}`;

export const getInvitationsCollection = () => 'invitations';

export const getCustomersCollection = (accountId: string) => `accounts/${accountId}/customers`;
export const getOrdersCollection = (accountId: string) => `accounts/${accountId}/orders`;
export const getInventoryCollection = (accountId: string) => `accounts/${accountId}/inventory`;
export const getInvoicesCollection = (accountId: string) => `accounts/${accountId}/invoices`;
export const getTimesheetCollection = (accountId: string) => `accounts/${accountId}/timesheet`;
export const getPurchaseOrdersCollection = (accountId: string) => `accounts/${accountId}/purchaseOrders`;
export const getGeneralSettingsDocument = (accountId: string) => `accounts/${accountId}/settings/general`;

