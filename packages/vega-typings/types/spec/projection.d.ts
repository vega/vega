import { SignalRef, Vector2, Vector3 } from '../index.js';
import { Feature, FeatureCollection } from 'geojson';

export type GeoJsonFeature = Feature;
export type GeoJsonFeatureCollection = FeatureCollection;
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
   * The cartographic projection to use. This value is case-insensitive, for example `"albers"` and `"Albers"` indicate the same projection type.
   *
   * __Default value:__ `mercator`
   */
  type?: ProjectionType | SignalRef;

  /**
   * The projection's clipping circle radius to the specified angle in degrees. If `null`, switches to [antimeridian](http://bl.ocks.org/mbostock/3788999) cutting rather than small-circle clipping.
   */
  clipAngle?: number | SignalRef;

  /**
   * The projection's viewport clip extent to the specified bounds in pixels. The extent bounds are specified as an array `[[x0, y0], [x1, y1]]`, where `x0` is the left-side of the viewport, `y0` is the top, `x1` is the right and `y1` is the bottom. If `null`, no viewport clipping is performed.
   */
  clipExtent?: Vector2<Vector2<number | SignalRef>> | SignalRef;

  /**
   * The projection’s scale factor. The default scale is projection-specific. The scale factor corresponds linearly to the distance between projected points; however, scale factor values are not equivalent across projections.
   */
  scale?: number | SignalRef;

  /*
   * The projection's translation offset as a two-element array `[tx, ty]`, defaults to `[480, 250]`. The translation offset determines the pixel coordinates of the projection's center. The default translation offset places (0°,0°) at the center of a 960×500 area.
   */
  translate?: Vector2<number | SignalRef> | SignalRef;

  /**
   * The projection's center, a two-element array of longitude and latitude in degrees.
   *
   * __Default value:__ `[0, 0]`
   */
  center?: Vector2<number | SignalRef> | SignalRef;

  /**
   * The projection's three-axis rotation to the specified angles, which must be a two- or three-element array of numbers [`lambda`, `phi`, `gamma`] specifying the rotation angles in degrees about each spherical axis. (These correspond to yaw, pitch and roll.)
   *
   * __Default value:__ `[0, 0, 0]`
   */
  rotate?: Vector2<number | SignalRef> | Vector3<number | SignalRef> | SignalRef;

  /**
   * For conic projections, the [two standard parallels](https://en.wikipedia.org/wiki/Map_projection#Conic) that define the map layout. The default depends on the specific conic projection used.
   */
  parallels?: (number | SignalRef)[] | SignalRef;

  /**
   * The default radius (in pixels) to use when drawing GeoJSON `Point` and `MultiPoint` geometries. This parameter sets a constant default value. To modify the point radius in response to data, see the corresponding parameter of the GeoPath and GeoShape transforms.
   *
   * __Default value:__ `4.5`
   */
  pointRadius?: number | SignalRef;

  /**
   * The threshold for the projection's [adaptive resampling](http://bl.ocks.org/mbostock/3795544) to the specified value in pixels. This value corresponds to the [Douglas–Peucker distance](http://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm). If precision is not specified, returns the projection's current resampling precision which defaults to `√0.5 ≅ 0.70710…`.
   */
  precision?: number | SignalRef;

  /*
   * GeoJSON data to which the projection should attempt to automatically fit the `translate` and `scale` parameters. If object-valued, this parameter should be a GeoJSON Feature or FeatureCollection. If array-valued, each array member may be a GeoJSON Feature, FeatureCollection, or a sub-array of GeoJSON Features.
   */
  fit?: Fit | Fit[] | SignalRef;

  /*
   * Used in conjunction with fit, provides the pixel area to which the projection should be automatically fit.
   */
  extent?: Vector2<Vector2<number | SignalRef>> | SignalRef;

  /**
   * Used in conjunction with fit, provides the width and height in pixels of the area to which the projection should be automatically fit.
   */
  size?: Vector2<number | SignalRef> | SignalRef;

  // TODO: use a union tagged by the projection type to determine which of the following is applicable
  // The following properties are all supported for specific types of projections. Consult the d3-geo-projection library for more information: https://github.com/d3/d3-geo-projection.

  /**
   * The coefficient parameter for the `hammer` projection.
   *
   * __Default value:__ `2`
   */
  coefficient?: number | SignalRef;

  /**
   * For the `satellite` projection, the distance from the center of the
   * sphere to the point of view, as a proportion of the sphere’s radius.
   * The recommended maximum clip angle for a given `distance` is
   * acos(1 / distance) converted to degrees. If tilt is also
   * applied, then more conservative clipping may be necessary.
   *
   * __Default value:__ `2.0`
   */
  distance?: number | SignalRef;

  /**
   * The fraction parameter for the `bottomley` projection.
   *
   * __Default value:__ `0.5`, corresponding to a sin(ψ) where ψ = π/6.
   */
  fraction?: number | SignalRef;

  /**
   * The number of lobes in projections that support multi-lobe views:
   * `berghaus`, `gingery`, or `healpix`.
   * The default value varies based on the projection type.
   */
  lobes?: number | SignalRef;

  /**
   * The parallel parameter for projections that support it:
   * `armadillo`, `bonne`, `craig`, `cylindricalEqualArea`,
   * `cylindricalStereographic`, `hammerRetroazimuthal`, `loximuthal`,
   * or `rectangularPolyconic`.
   * The default value varies based on the projection type.
   */
  parallel?: number | SignalRef;

  /**
   * The radius parameter for the `airy` or `gingery` projection.
   * The default value varies based on the projection type.
   */
  radius?: number | SignalRef;

  /**
   * The ratio parameter for the `hill`, `hufnagel`, or `wagner` projections.
   * The default value varies based on the projection type.
   */
  ratio?: number | SignalRef;

  /**
   * The spacing parameter for the `lagrange` projection.
   *
   * __Default value:__ `0.5`
   */
  spacing?: number | SignalRef;

  /**
   * The tilt angle (in degrees) for the `satellite` projection.
   *
   * __Default value:__ `0`.
   */
  tilt?: number | SignalRef;

  /**
   * Sets whether or not the x-dimension is reflected (negated) in the output.
   */
  reflectX?: boolean | SignalRef;

  /**
   * Sets whether or not the y-dimension is reflected (negated) in the output.
   */
  reflectY?: boolean | SignalRef;
}
export interface Projection extends BaseProjection {
  /*
   * The name of the projection.
   */
  name: string;
}
