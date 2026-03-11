export function requireAdmin(team, uid) {
  if (!team?.admins?.includes(uid)) {
    throw new Error('Unauthorized');
  }
  return true;
}
