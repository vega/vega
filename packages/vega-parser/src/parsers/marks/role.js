import {GroupMark} from './marktypes';
import {ScopeRole, MarkRole} from './roles';

export default function(spec) {
  var role = spec.role || '';
  if (!role.indexOf('axis') || !role.indexOf('legend')) return role;
  return spec.type === GroupMark ? ScopeRole : (spec.role || MarkRole);
}
