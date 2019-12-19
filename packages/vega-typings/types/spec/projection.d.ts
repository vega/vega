import { Vector2, SignalRef, Signal, Vector3 } from '.';

export type GeoJsonFeature = any; // TODO
export type GeoJsonFeatureCollection = any; // TODO
export type Fit = GeoJsonFeature | GeoJsonFeatureCollection | GeoJsonFeature[];
export type ProjectionType =
  | 'albers'
  | 'albersUsa'
  | 'azimuthalEqualArea'
  | 'azimuthalEquidistant'
  | 'conicConformal'
  | 'conicEqualArea'
  | 'conicEquidistant'
  | 'equalEarth'
  | 'equirectangular'
  | 'gnomonic'
  | 'identity'
  | 'mercator'
  | 'naturalEarth1'
  | 'orthographic'
  | 'stereographic'
  | 'transverseMercator';
export interface BaseProjection {
  /*
   * The type of the projection. The default is `"mercator"`.
   */
  type?: ProjectionType | SignalRef;
  /*
   * The clip angle of the projection.
   */
  clipAngle?: number | SignalRef;
  /*
   * The projection’s viewport clip extent to the specified bounds in pixels
   */
  clipExtent?: Vector2<Vector2<number | SignalRef>> | SignalRef;
  /**
   * The projection’s scale factor to the specified value.
   */
  scale?: number | SignalRef;
  /*
   * The translation of the projection.
   */
  translate?: Vector2<number | SignalRef> | SignalRef;
  /*
   * The center of the projection.
   */
  center?: Vector2<number | SignalRef> | SignalRef;
  /**
   * The rotation of the projection.
   */
  rotate?: Vector2<number | SignalRef> | Vector3<number | SignalRef> | SignalRef;
  /**
   * The desired parallels of the projection.
   */
  parallels?: (number | SignalRef)[] | SignalRef;
  /*
   * The desired precision of the projection.
   */
  precision?: number | SignalRef;
  /**
   * The default radius (in pixels) to use when drawing GeoJSON `Point` and `MultiPoint` geometries.
   */
  pointRadius?: number | SignalRef;
  /*
   * GeoJSON data to which the projection should attempt to automatically fit the translate and scale parameters..
   */
  fit?: Fit | Fit[] | SignalRef;
  /*
   * Used in conjunction with fit, provides the pixel area to which the projection should be automatically fit.
   */
  extent?: Vector2<Vector2<number | SignalRef>> | SignalRef;
  /*
   * Used in conjunction with fit, provides the width and height in pixels of the area to which the projection should be automatically fit.
   */
  size?: Vector2<number | SignalRef> | SignalRef;

  // TODO: use a union tagged by the projection type to determine which of the following is applicable
  /* The following properties are all supported for specific types of projections. Consult the d3-geo-projection library for more information: https://github.com/d3/d3-geo-projection */
  coefficient?: number | SignalRef;
  distance?: number | SignalRef;
  fraction?: number | SignalRef;
  lobes?: number | SignalRef;
  parallel?: number | SignalRef;
  radius?: number | SignalRef;
  ratio?: number | SignalRef;
  spacing?: number | SignalRef;
  tilt?: number | SignalRef;
  reflectX?: boolean | SignalRef;
  reflectY?: boolean | SignalRef;
}
export interface Projection extends BaseProjection {
  /*
   * The name of the projection.
   */
  name: string;
}
