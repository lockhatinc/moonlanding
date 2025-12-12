export function can(user, spec, action) {
  if (!user) return false;
  if (!spec.access?.[action]) return true;
  return spec.access[action].includes(user.role);
}

export function check(user, spec, action) {
  if (!can(user, spec, action)) throw new Error(`Permission denied: ${spec.name}.${action}`);
}
