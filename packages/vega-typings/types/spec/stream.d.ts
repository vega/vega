import { Expr, MarkType } from '.';
import { type } from 'os';

export type EventSource = EventStream['source'] & {};
export type EventType =
  | 'click'
  | 'dblclick'
  | 'dragenter'
  | 'dragleave'
  | 'dragover'
  | 'keydown'
  | 'keypress'
  | 'keyup'
  | 'mousedown'
  | 'mousemove'
  | 'mouseout'
  | 'mouseover'
  | 'mouseup'
  | 'mousewheel'
  | 'timer'
  | 'touchend'
  | 'touchmove'
  | 'touchstart'
  | 'wheel';

export type HTMLBodyEventType =
  | EventType
  | 'abort'
  | 'afterprint'
  | 'animationcancel'
  | 'animationend'
  | 'animationiteration'
  | 'animationstart'
  | 'auxclick'
  | 'beforeprint'
  | 'beforeunload'
  | 'blur'
  | 'cancel'
  | 'canplay'
  | 'canplaythrough'
  | 'change'
  | 'close'
  | 'copy'
  | 'contextmenu'
  | 'cuechange'
  | 'cut'
  | 'drag'
  | 'dragexit'
  | 'dragstart'
  | 'drop'
  | 'durationchange'
  | 'emptied'
  | 'ended'
  | 'error'
  | 'focus'
  | 'fullscreenchange'
  | 'fullscreenerror'
  | 'gotpointercapture'
  | 'hashchange'
  | 'input'
  | 'invalid'
  | 'languagechange'
  | 'load'
  | 'loadeddata'
  | 'loadedmetadata'
  | 'loadend'
  | 'loadstart'
  | 'lostpointercapture'
  | 'message'
  | 'messageerror'
  | 'rejectionhandled'
  | 'storage'
  | 'unhandledrejection'
  | 'unload'
  | 'offline'
  | 'online'
  | 'orientationchange'
  | 'paste'
  | 'pause'
  | 'pagehide'
  | 'pageshow'
  | 'play'
  | 'playing'
  | 'pointercancel'
  | 'pointerdown'
  | 'pointerenter'
  | 'pointerleave'
  | 'pointermove'
  | 'pointerout'
  | 'pointerover'
  | 'pointerup'
  | 'popstate'
  | 'progress'
  | 'ratechange'
  | 'reset'
  | 'resize'
  | 'scroll'
  | 'securitypolicyviolation'
  | 'seeked'
  | 'seeking'
  | 'select'
  | 'stalled'
  | 'submit'
  | 'suspend'
  | 'timeupdate'
  | 'toggle'
  | 'touchcancel'
  | 'transitioncancel'
  | 'transitionend'
  | 'transitionrun'
  | 'transitionstart'
  | 'volumechange'
  | 'waiting';

export interface StreamParameters {
  between?: Stream[];
  marktype?: MarkType;
  markname?: string;
  filter?: Expr | Expr[];
  throttle?: number;
  debounce?: number;
  consume?: boolean;
}
export type EventStream = StreamParameters &
  (
    | {
        source?: 'view' | 'scope';
        type: EventType;
      }
    | {
        source: 'window';
        type: HTMLBodyEventType;
      });
export interface DerivedStream extends StreamParameters {
  stream: Stream;
}
export interface MergedStream extends StreamParameters {
  merge: Stream[];
}
export type Stream = EventStream | DerivedStream | MergedStream;
