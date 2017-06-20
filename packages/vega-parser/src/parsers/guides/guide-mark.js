import {Skip} from './constants';
import {extendEncode} from '../encode/encode-util';

export default function(type, role, key, dataRef, encode, extras) {
  return {
    type: type,
    name: extras ? extras.name : undefined,
    role: role,
    key:  key,
    from: dataRef,
    interactive: !!(extras && extras.interactive),
    encode: extendEncode(encode, extras, Skip)
  };
}
