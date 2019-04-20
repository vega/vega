import {Skip} from './constants';
import {extendEncode} from '../encode/encode-util';

export default function(type, role, style, key, dataRef, encode, extras) {
  return {
    type:  type,
    name:  extras ? extras.name : undefined,
    role:  role,
    style: (extras && extras.style) || style,
    key:   key,
    from:  dataRef,
    interactive: !!(extras && extras.interactive),
    encode: extendEncode(encode, extras, Skip)
  };
}
