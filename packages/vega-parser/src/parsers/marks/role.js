import {GroupMark} from './marktypes';
import {MarkRole, ScopeRole} from './roles';

export default function(spec) {
  const role = spec.role || '';
  return (role.startsWith('axis') || role.startsWith('legend') || role.startsWith('title'))
    ? role
    : spec.type === GroupMark ? ScopeRole : (role || MarkRole);
}
