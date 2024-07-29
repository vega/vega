import { Spec } from 'vega';

export const spec: Spec = {
  $schema: 'https://vega.github.io/schema/vega/v5.json',
  background: 'white',
  padding: 5,
  width: 300,
  height: 300,
  style: ['cell', 'view'],
  data: [
    {
      name: 'tile_list',
      transform: [
        { type: 'sequence', start: 0, stop: 10, as: 'a' },
        { type: 'formula', expr: 'sequence(0, 10)', as: 'b' },
        { type: 'flatten', fields: ['b'], as: ['b'] },
        {
          type: 'formula',
          expr: "'https://tile.openstreetmap.org/' + zoom_ceil + '/' + ((datum.a + dii_floor + tiles_count) % tiles_count) + '/' + (datum.b + djj_floor) + '.png'",
          as: 'url'
        },
        {
          type: 'formula',
          expr: 'datum.a * tile_size + dx + (tile_size / 2)',
          as: 'x'
        },
        {
          type: 'formula',
          expr: 'datum.b * tile_size + dy + (tile_size / 2)',
          as: 'y'
        }
      ]
    },
    {
      name: 'source_0',
      url: 'https://cdn.jsdelivr.net/npm/vega-datasets@v1.29.0/data/world-110m.json',
      format: { feature: 'countries', type: 'topojson' },
      transform: [
        {
          type: 'filter',
          expr: 'isValid(datum["id"]) && isFinite(+datum["id"])'
        }
      ]
    }
  ],
  projections: [
    {
      name: 'projection',
      size: { signal: '[width, height]' },
      fit: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [51, 37],
              [51, -34],
              [-17, -34],
              [-17, 37],
              [51, 37]
            ]
          ]
        },
        properties: {}
      },
      type: 'mercator'
    }
  ],
  signals: [
    { name: 'projection_scale', update: "geoScale('projection')" },
    {
      name: 'base_tile_size',
      update: '(2 * PI * projection_scale) / pow(2, zoom_level)'
    },
    { name: 'zoom_level', value: 2 },
    { name: 'zoom_ceil', update: 'ceil(zoom_level)' },
    { name: 'tiles_count', update: 'pow(2, zoom_ceil)' },
    {
      name: 'tile_size',
      update: 'base_tile_size * pow(2, zoom_level - zoom_ceil)'
    },
    { name: 'base_point', update: "invert('projection', [0, 0])" },
    { name: 'dii', update: '(base_point[0] + 180) / 360 * tiles_count' },
    { name: 'dii_floor', update: 'floor(dii)' },
    { name: 'dx', update: '(dii_floor - dii) * tile_size' },
    {
      name: 'djj',
      update:
        '(1 - log(tan(base_point[1] * PI / 180) + 1 / cos(base_point[1] * PI / 180)) / PI) / 2 * tiles_count'
    },
    { name: 'djj_floor', update: 'floor(djj)' },
    { name: 'dy', update: 'round((djj_floor - djj) * tile_size)' }
  ],
  marks: [
    {
      name: 'layer_0_marks',
      type: 'image',
      clip: true,
      style: ['image'],
      from: { data: 'tile_list' },
      encode: {
        update: {
          description: {
            signal:
              '"x: " + (format(datum["x"], "")) + "; y: " + (format(datum["y"], "")) + "; url: " + (isValid(datum["url"]) ? datum["url"] : ""+datum["url"])'
          },
          xc: { field: 'x' },
          width: { signal: 'tile_size + 1' },
          yc: { field: 'y' },
          height: { signal: 'tile_size + 1' },
          url: {
            signal: 'isValid(datum["url"]) ? datum["url"] : ""+datum["url"]'
          }
        }
      }
    },
    {
      name: 'layer_1_marks',
      type: 'shape',
      clip: true,
      style: ['geoshape'],
      from: { data: 'source_0' },
      encode: {
        update: {
          fillOpacity: { value: 0.1 },
          stroke: { value: 'orange' },
          strokeWidth: { value: 2 },
          fill: { scale: 'fill', field: 'id' },
          ariaRoleDescription: { value: 'geoshape' },
          description: { signal: '"id: " + (format(datum["id"], ""))' }
        }
      },
      transform: [{ type: 'geoshape', projection: 'projection' }]
    }
  ],
  scales: [
    {
      name: 'fill',
      type: 'linear',
      domain: { data: 'source_0', field: 'id' },
      range: 'heatmap',
      interpolate: 'hcl',
      zero: false
    }
  ]
};
