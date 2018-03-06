import { Encodable, NumericValueRef, SignalRef, TextEncodeEntry } from '.';

export type TitleOrient = 'none' | 'left' | 'right' | 'top' | 'bottom';
export type TitleAnchor = 'start' | 'middle' | 'end';
export type Title =
  | string
  | (Encodable<TextEncodeEntry> & {
      /**
       * The title text.
       */
      text: string | SignalRef;
      name?: string;
      /**
       * The orientation of the title relative to the chart. One of `"top"` (the default), `"bottom"`, `"left"`, or `"right"`.
       */
      orient?: TitleOrient;
      /**
       * The anchor position for placing the title. One of `"start"`, `"middle"` (the default), or `"end"`. For example, with an orientation of top these anchor positions map to a left-, center-, or right-aligned title.
       */
      anchor?: TitleAnchor;
      zindex?: number;
      interactive?: boolean;
      /**
       * The orthogonal offset in pixels by which to displace the title from its position along the edge of the chart.
       */
      offset?: number | NumericValueRef;
      style?: string | string[];
    });
