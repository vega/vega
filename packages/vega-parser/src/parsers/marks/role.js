import {GroupMark} from './marktypes.js';
import {MarkRole, ScopeRole} from './roles.js';

export default function(spec) {
  const role = spec.role || '';
  return (role.startsWith('axis') || role.startsWith('legend') || role.startsWith('title'))
    ? role
    : spec.type === GroupMark ? ScopeRole : (role || MarkRole);
}
