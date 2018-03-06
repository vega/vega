import { Expr, ExprRef, EventSelector, SignalRef, Stream } from '.';

export type Events =
  | EventSelector
  | SignalRef
  | Stream
  | Stream[]
  | {
      scale: string;
    };
export type Update =
  | Expr
  | ExprRef
  | SignalRef
  | {
      value: any;
    };
export type OnEvent = (
  | {
      encode: string;
    }
  | {
      update: Update;
    }) & {
  events: Events;
  force?: boolean;
};
