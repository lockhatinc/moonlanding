import { getUser } from '@/engine.server';
import { withPageAuth } from '@/lib/auth-middleware';
import { UnauthorizedError } from '@/lib/error-handler';
import { RoleInfoCard, RoleBadge, PermissionsList } from '@/components/role-management';
import { usePermissions } from '@/lib/use-permissions';

export default async function UserSettingsPage() {
  try {
    const { user } = await withPageAuth('user', 'view');

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Settings</h1>
          <p className="text-gray-600">Manage your account and view permissions</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <div className="text-lg text-gray-900">{user?.name || 'Not set'}</div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <div className="text-lg text-gray-900">{user?.email || 'Not set'}</div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Role</label>
            <div className="mt-2">
              <RoleBadge role={user?.role} />
            </div>
          </div>
        </div>

        {user?.role && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Your Permissions</h2>
            <PermissionsList role={user.role} />
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900">About Roles</h3>
          <p className="text-blue-800 text-sm mt-2">
            Your role determines what actions you can perform in the system. 
            Contact an administrator if you need additional permissions.
          </p>
        </div>
      </div>
    );
  } catch (error) {
    if (error.message?.includes('Not authenticated')) {
      return (
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="font-semibold text-red-900">Authentication Required</h2>
            <p className="text-red-700">Please log in to access your user settings.</p>
          </div>
        </div>
      );
    }
    throw error;
  }
}
