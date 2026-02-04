import { useState, useEffect } from 'react';
import { usePermissions, useHasRole } from '@/lib/use-permissions';
import { getAllRoles, getRoleLabel, getRoleDescription, getPermissionMatrix } from '@/services/permission.service';
import { ProtectedComponent } from '@/components/protected-component';

export function RoleManagementDashboard({ user }) {
  const { can } = usePermissions(user);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    setRoles(getAllRoles());
  }, []);

  const permissionMatrix = getPermissionMatrix();

  if (!can('manage', 'user')) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-900 font-semibold">Access Denied</h3>
        <p className="text-red-700">You don't have permission to manage user roles.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
        <p className="text-gray-600">Configure and view role-based access control (RBAC)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {roles.map(role => (
          <div
            key={role}
            className={`p-4 border rounded-lg cursor-pointer transition ${
              selectedRole === role
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setSelectedRole(role)}
          >
            <h3 className="font-semibold text-gray-900">{getRoleLabel(role)}</h3>
            <p className="text-sm text-gray-600 mt-1">{getRoleDescription(role)}</p>
          </div>
        ))}
      </div>

      {selectedRole && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {getRoleLabel(selectedRole)} - Permissions
          </h2>
          <p className="text-gray-600 mb-6">{getRoleDescription(selectedRole)}</p>

          <div className="space-y-4">
            {Object.entries(permissionMatrix[selectedRole] || {}).map(([entity, actions]) => (
              <div key={entity} className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-gray-900 capitalize">{entity}</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {actions.length > 0 ? (
                    actions.map(action => (
                      <span
                        key={action}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {action}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 italic">No permissions</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function RoleSelect({ value, onChange, disabled = false }) {
  const roles = getAllRoles();

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {roles.map(role => (
        <option key={role} value={role}>
          {getRoleLabel(role)}
        </option>
      ))}
    </select>
  );
}

export function RoleBadge({ role }) {
  const roleColors = {
    partner: 'bg-purple-100 text-purple-800',
    manager: 'bg-blue-100 text-blue-800',
    clerk: 'bg-green-100 text-green-800',
    client_admin: 'bg-orange-100 text-orange-800',
    client_user: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleColors[role] || 'bg-gray-100 text-gray-800'}`}>
      {getRoleLabel(role)}
    </span>
  );
}

export function RoleInfoCard({ role }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <RoleBadge role={role} />
      <h3 className="font-semibold text-gray-900 mt-3">{getRoleLabel(role)}</h3>
      <p className="text-sm text-gray-600 mt-2">{getRoleDescription(role)}</p>
    </div>
  );
}

export function PermissionsList({ role }) {
  const matrix = getPermissionMatrix();
  const permissions = matrix[role] || {};

  return (
    <div className="space-y-3">
      {Object.entries(permissions).map(([entity, actions]) => (
        <div key={entity} className="bg-gray-50 p-3 rounded-lg">
          <div className="font-medium text-gray-900 capitalize">{entity}</div>
          <div className="text-sm text-gray-600 mt-1">
            {actions.length > 0 ? actions.join(', ') : 'No permissions'}
          </div>
        </div>
      ))}
    </div>
  );
}
