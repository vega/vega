import role from './role';

export default function(spec) {
  return {
    clip:        spec.clip || false,
    interactive: spec.interactive === false ? false : true,
    marktype:    spec.type,
    name:        spec.name || undefined,
    role:        role(spec),
    zindex:      +spec.zindex || undefined
  };
}
