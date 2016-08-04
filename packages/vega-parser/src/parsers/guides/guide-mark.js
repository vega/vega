import {extendEncode} from '../encode/encode-util';

export default function(type, role, key, dataRef, encode, extras) {
  return {
    type: type,
    role: role,
    key:  key,
    from: dataRef,
    interactive: !!encode.interactive,
    encode: extendEncode(encode, extras)
  };
}
