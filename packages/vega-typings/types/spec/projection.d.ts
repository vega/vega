import { Vector2, SignalRef, Signal, Vector3 } from '.';
export type GeoJsonFeature = any; // TODO
export type GeoJsonFeatureCollection = any; // TODO
export type Fit = GeoJsonFeature | GeoJsonFeatureCollection | GeoJsonFeature[];
export interface Projection {
  name: string;
  type: string | SignalRef;
  clipAngle?: number | SignalRef;
  clipExtent?: Vector2<Vector2<number | SignalRef>> | SignalRef;
  scale?: number | SignalRef;
  translate?: Vector2<number | SignalRef> | SignalRef;
  center?: Vector2<number | SignalRef> | SignalRef;
  rotate?: Vector3<number | SignalRef> | SignalRef;
  parallels?: (number | SignalRef)[] | SignalRef;
  precision?: number | SignalRef;
  pointRadius?: number | SignalRef;
  fit?: Fit | Fit[];
  extent?: Vector2<Vector2<number | SignalRef>> | SignalRef;
  size?: Vector2<number | SignalRef> | SignalRef;
}
