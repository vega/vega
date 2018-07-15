import { Expr, ExprRef, EventSelector, SignalRef, Stream } from '.';

export type EventListener =
  | SignalRef
  | {
      scale: string;
    }
  | Stream;

export type Events = EventSelector | EventListener;
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
  events: Events | EventListener[];
  force?: boolean;
};
