import { AutoSize } from './autosize.js';
import { Color } from './color.js';
import { Config } from './config.js';
import { Encodable, EncodeEntry } from './encode.js';
import { Padding } from './padding.js';
import { Scope } from './scope.js';
import { SignalRef } from './signal.js';

export interface Spec extends Scope, Encodable<EncodeEntry> {
  $schema?: string;
  config?: Config;
  description?: string;
  width?: number | SignalRef;
  height?: number | SignalRef;
  padding?: Padding | SignalRef;
  autosize?: AutoSize | SignalRef;
  background?: Color | SignalRef;
  style?: string | string[];
}

export * from './autosize.js';
export * from './axis.js';
export * from './bind.js';
export * from './color.js';
export * from './config.js';
export * from './data.js';
export * from './encode.js';
export * from './expr.js';
export * from './layout.js';
export * from './legend.js';
export * from './locale.js';
export * from './mark.js';
export * from './marktype.js';
export * from './on-events.js';
export * from './on-trigger.js';
export * from './padding.js';
export * from './projection.js';
export * from './scale.js';
export * from './scheme.js';
export * from './scope.js';
export * from './selector.js';
export * from './signal.js';
export * from './stream.js';
export * from './title.js';
export * from './transform.js';
export * from './util.js';
export * from './values.js';
