import {extendEncode} from '../encode/encode-util';

export default function(type, role, key, dataRef, encode, extras) {
  return {
    type: type,
    role: role,
    key:  key,
    from: dataRef,
    interactive: !!(extras && extras.interactive),
    encode: extendEncode(encode, extras)
  };
}
