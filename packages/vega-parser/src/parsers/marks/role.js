import {GroupMark} from './marktypes';
import {ScopeRole, MarkRole} from './roles';

export default function(spec) {
  var role = spec.role || '';
  return (!role.indexOf('axis') || !role.indexOf('legend') || !role.indexOf('title'))
    ? role
    : spec.type === GroupMark ? ScopeRole : (role || MarkRole);
}
