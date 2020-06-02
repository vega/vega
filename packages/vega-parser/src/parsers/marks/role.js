import {GroupMark} from './marktypes';
import {MarkRole, ScopeRole} from './roles';

export default function(spec) {
  const role = spec.role || '';
  return (!role.indexOf('axis') || !role.indexOf('legend') || !role.indexOf('title'))
    ? role
    : spec.type === GroupMark ? ScopeRole : (role || MarkRole);
}
