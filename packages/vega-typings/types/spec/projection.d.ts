import { SignalRef } from './signal';
export type NumberSignalArray = (number | SignalRef)[];
export type GeoJsonFeature = any; // TODO
export type GeoJsonFeatureCollection = any; // TODO
export type Fit = GeoJsonFeature | GeoJsonFeatureCollection | GeoJsonFeature[];
export interface Projection {
  name: string;
  type: string | SignalRef;
  clipAngle?: number | SignalRef;
  clipExtent?: SignalRef | NumberSignalArray;
  scale?: number | SignalRef;
  translate?: SignalRef | NumberSignalArray;
  center?: SignalRef | NumberSignalArray;
  rotate?: SignalRef | NumberSignalArray;
  parallels?: SignalRef | NumberSignalArray;
  precision?: number | SignalRef;
  pointRadius?: number | SignalRef;
  fit?: Fit | Fit[];
  extent?: SignalRef | (SignalRef | NumberSignalArray)[];
  size?: SignalRef | NumberSignalArray;
}
