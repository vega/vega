import { array, def, object, objectType, oneOf } from './util';

const scope = object({
  encode:      def('encode'),
  layout:      def('layout'),
  signals:     array(def('signal')),
  data:        array(def('data')),
  scales:      array(def('scale')),
  projections: array(def('projection')),
  axes:        array(def('axis')),
  legends:     array(def('legend')),
  title:       def('title'),
  marks:       array(oneOf(def('markGroup'), def('markVisual'))),
  usermeta:    objectType
}, undefined);

export default {
  scope
};
