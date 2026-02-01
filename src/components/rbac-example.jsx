import { usePermissions, useCanAction, useHasRole } from '@/lib/use-permissions';
import { 
  ProtectedComponent, 
  RoleBasedComponent, 
  VisibilityGate, 
  FeatureGate,
  HiddenIfUnauthorized 
} from '@/components/protected-component';
import { RoleBadge, PermissionsList } from '@/components/role-management';

export function RBACExampleDashboard({ user }) {
  const { can, cannot, checkRole } = usePermissions(user);
  const canCreateEngagement = useCanAction('create', 'engagement', user);
  const isManager = useHasRole('manager', user);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">RBAC Example Dashboard</h1>

      {/* Section 1: User Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Your User Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-gray-600 text-sm">Name</label>
            <div className="text-lg font-semibold">{user?.name}</div>
          </div>
          <div>
            <label className="text-gray-600 text-sm">Email</label>
            <div className="text-lg font-semibold">{user?.email}</div>
          </div>
          <div>
            <label className="text-gray-600 text-sm">Role</label>
            <div className="mt-2">
              <RoleBadge role={user?.role} />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Permission Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Your Permissions</h2>
        {user?.role && <PermissionsList role={user.role} />}
      </div>

      {/* Section 3: Conditional Rendering Examples */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Conditional Rendering Examples</h2>
        <div className="space-y-4">
          {/* Example 1: Direct Hook Usage */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900">Direct Hook Usage</h3>
            {canCreateEngagement ? (
              <p className="text-green-600">✓ You can create engagements</p>
            ) : (
              <p className="text-red-600">✗ You cannot create engagements</p>
            )}
          </div>

          {/* Example 2: Permission Check Hook */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900">useHasRole Hook</h3>
            {isManager ? (
              <p className="text-green-600">✓ You are a Manager</p>
            ) : (
              <p className="text-red-600">✗ You are not a Manager</p>
            )}
          </div>

          {/* Example 3: ProtectedComponent with Action/Subject */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900">ProtectedComponent Pattern</h3>
            <ProtectedComponent
              action="create"
              subject="review"
              user={user}
              fallback={<p className="text-red-600">✗ Cannot create reviews</p>}
            >
              <p className="text-green-600">✓ You can create reviews</p>
            </ProtectedComponent>
          </div>

          {/* Example 4: RoleBasedComponent */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900">RoleBasedComponent Pattern</h3>
            <RoleBasedComponent
              roles={['partner', 'manager']}
              user={user}
              fallback={<p className="text-red-600">✗ Managers and Partners only</p>}
            >
              <p className="text-green-600">✓ You have manager-level access</p>
            </RoleBasedComponent>
          </div>

          {/* Example 5: FeatureGate */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900">FeatureGate Pattern</h3>
            <FeatureGate
              feature="analytics"
              user={user}
              fallback={<p className="text-red-600">✗ Analytics not available for your role</p>}
            >
              <p className="text-green-600">✓ Analytics feature available</p>
            </FeatureGate>
          </div>
        </div>
      </div>

      {/* Section 4: Permission-Based UI Elements */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Permission-Based UI Elements</h2>
        <div className="space-y-3">
          {/* Create Button */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span>Create Engagement Button</span>
            <HiddenIfUnauthorized
              action="create"
              subject="engagement"
              user={user}
            >
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Create
              </button>
            </HiddenIfUnauthorized>
          </div>

          {/* Delete Button */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span>Delete User Button</span>
            <ProtectedComponent
              action="delete"
              subject="user"
              user={user}
              fallback={<button className="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed">Delete</button>}
            >
              <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                Delete
              </button>
            </ProtectedComponent>
          </div>

          {/* Edit Button */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span>Edit Review Button</span>
            <HiddenIfUnauthorized
              action="update"
              subject="review"
              user={user}
            >
              <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                Edit
              </button>
            </HiddenIfUnauthorized>
          </div>
        </div>
      </div>

      {/* Section 5: Direct Permission Checks */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Direct Permission Checks</h2>
        <div className="space-y-2 text-sm">
          <div>can('create', 'engagement'): <span className={can('create', 'engagement') ? 'text-green-600' : 'text-red-600'}>{String(can('create', 'engagement'))}</span></div>
          <div>can('delete', 'user'): <span className={can('delete', 'user') ? 'text-green-600' : 'text-red-600'}>{String(can('delete', 'user'))}</span></div>
          <div>can('manage', 'all'): <span className={can('manage', 'all') ? 'text-green-600' : 'text-red-600'}>{String(can('manage', 'all'))}</span></div>
          <div>cannot('delete', 'comment'): <span className={cannot('delete', 'comment') ? 'text-green-600' : 'text-red-600'}>{String(cannot('delete', 'comment'))}</span></div>
          <div>checkRole('manager'): <span className={checkRole('manager') ? 'text-green-600' : 'text-red-600'}>{String(checkRole('manager'))}</span></div>
        </div>
      </div>

      {/* Section 6: Admin-Only Section */}
      <RoleBasedComponent
        roles="partner"
        user={user}
        fallback={
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-bold text-red-900">Partners Only</h3>
            <p className="text-red-700">This section is only visible to Partner users.</p>
          </div>
        }
      >
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="font-bold text-purple-900">Admin Dashboard (Partners Only)</h3>
          <p className="text-purple-700">This section is only visible to Partner users.</p>
          <div className="mt-4 space-y-2">
            <button className="block w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
              Manage Users
            </button>
            <button className="block w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
              System Configuration
            </button>
            <button className="block w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
              View Audit Logs
            </button>
          </div>
        </div>
      </RoleBasedComponent>

      {/* Section 7: Feature Gates */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Feature Gates</h2>
        <div className="grid grid-cols-2 gap-4">
          <FeatureGate feature="analytics" user={user} fallback={<div className="p-4 bg-gray-100 rounded">Analytics Locked</div>}>
            <div className="p-4 bg-green-100 rounded">Analytics Available</div>
          </FeatureGate>

          <FeatureGate feature="user-management" user={user} fallback={<div className="p-4 bg-gray-100 rounded">User Mgmt Locked</div>}>
            <div className="p-4 bg-green-100 rounded">User Management Available</div>
          </FeatureGate>

          <FeatureGate feature="audit-logs" user={user} fallback={<div className="p-4 bg-gray-100 rounded">Audit Locked</div>}>
            <div className="p-4 bg-green-100 rounded">Audit Logs Available</div>
          </FeatureGate>

          <FeatureGate feature="integrations" user={user} fallback={<div className="p-4 bg-gray-100 rounded">Integrations Locked</div>}>
            <div className="p-4 bg-green-100 rounded">Integrations Available</div>
          </FeatureGate>
        </div>
      </div>
    </div>
  );
}

export default RBACExampleDashboard;
