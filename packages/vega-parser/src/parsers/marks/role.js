import {Group} from './marktypes';
import {ScopeRole, MarkRole} from './roles';

export default function(spec) {
  return spec.role ||
    (spec.type === Group && (spec.legends || spec.axes)
      ? ScopeRole
      : MarkRole);
}
