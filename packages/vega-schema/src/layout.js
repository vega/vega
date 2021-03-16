import {
  booleanOrSignal, booleanType, enums, nullType,
  numberOrSignal, numberType, object, oneOf,
  orSignal, signalRef
} from './util';

const layoutAlignEnum = ['all', 'each', 'none'];

const layoutBoundsEnum = ['full', 'flush'];

const layoutTitleAnchorEnum = ['start', 'end'];

export const layoutAlign = oneOf(
  enums(layoutAlignEnum),
  signalRef
);

const layoutTitleAnchor = oneOf(
  enums(layoutTitleAnchorEnum),
  signalRef
);

const band = oneOf(
  numberOrSignal,
  nullType,
  object({row: numberOrSignal, column: numberOrSignal})
);

const layout = orSignal(object({
  align: oneOf(
    layoutAlign,
    object({row: layoutAlign, column: layoutAlign})
  ),
  bounds: orSignal(enums(layoutBoundsEnum)),
  center: oneOf(
    booleanType,
    signalRef,
    object({row: booleanOrSignal, column: booleanOrSignal})
  ),
  columns: numberOrSignal,
  padding: oneOf(
    numberType,
    signalRef,
    object({row: numberOrSignal, column: numberOrSignal})
  ),
  offset: oneOf(
    numberType,
    signalRef,
    object({
      rowHeader: numberOrSignal,
      rowFooter: numberOrSignal,
      rowTitle: numberOrSignal,
      columnHeader: numberOrSignal,
      columnFooter: numberOrSignal,
      columnTitle: numberOrSignal
    })
  ),
  headerBand: band,
  footerBand: band,
  titleBand: band,
  titleAnchor: oneOf(
    layoutTitleAnchor,
    object({row: layoutTitleAnchor, column: layoutTitleAnchor})
  )
}));

export default {
  layout
};
