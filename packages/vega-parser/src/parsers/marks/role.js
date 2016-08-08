import {GroupMark} from './marktypes';
import {ScopeRole, MarkRole} from './roles';

export default function(spec) {
  return spec.role ||
    (spec.type === GroupMark && (spec.legends || spec.axes)
      ? ScopeRole
      : MarkRole);
}
