---
layout: spec
title: Data
permalink: /docs/data/index.html
---

**Data** set definitions and transforms define the data to load and how to process it.

The basic data model used by Vega is _tabular_ data, similar to a spreadsheet or database table. Individual data sets are assumed to contain a collection of records (or "rows"), which may contain any number of named data attributes (fields, or "columns"). Records are modeled using standard JavaScript objects.

If the input data is simply an array of primitive values, Vega maps each value to the `data` property of a new object. For example `[5, 3, 8, 1]` is loaded as:

```json
[ {"data": 5}, {"data": 3}, {"data": 8}, {"data": 1} ]
```

Upon ingest, Vega also assigns each data object a unique id property, accessible via a custom [Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol). As a result, the id property is not accessible via a string key and is not enumerable, though you can observe the id value when inspecting data objects in a JavaScript console.

Data sets can be specified directly by defining data inline or providing a URL from which to load the data. Alternatively, data can be bound dynamically at runtime by using the [View API](../api/view) to provide data when a chart is instantiated or issue streaming updates. Loading data from a URL will be subject to the policies of your runtime environment (e.g., [cross-origin request rules](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS)).

## Documentation Overview

- [Data Properties](#properties)
- [Data Formats](#format)
- [Examples](#examples)


## <a name="properties"></a>Data Properties

Properties for specifying a data set. At most one of the _source_, _url_, or _values_ properties should be defined.

| Property  | Type                          | Description    |
| :-------- | :---------------------------: | :------------- |
| name      | {% include type t="String" %} | {% include required %} A unique name for the data set. |
| format    | [Format](#format)             | An object that specifies the format for parsing the data file or values. See the [format reference](#format) for more. |
| source    | {% include type t="String|String[]" %} | The name of one or more data sets to use as the source for this data set. The _source_ property is useful in combination with a transform pipeline to derive new data. If string-valued, indicates the name of the source data set. If array-valued, specifies a collection of data source names that should be merged (unioned) together.|
| url       | {% include type t="String" %} | A URL from which to load the data set. Use the _format_ property to ensure the loaded data is correctly parsed. If the _format_ property is not specified, the data is assumed to be in a row-oriented JSON format. |
| values    | {% include type t="Any" %}    | The full data set, included inline. The _values_ property allows data to be included directly within the specification itself. While most commonly an array of objects, other data types (such as CSV strings) may be used, subject to the _format_ settings.|
| async     | {% include type t="Boolean" %}| {% include tag ver="5.9" %} A boolean flag (default `false`) indicating if dynamic data loading or reformatting should occur asynchronously. If `true`, dataflow evaluation will complete, data loading will occur in the background, and the dataflow will be re-evaluated when loading is complete. If `false`, dataflow evaluation will block until loading is complete and then continue within the same evaluation cycle. The use of *async* can allow multiple dynamic datasets to be loaded simultaneously while still supporting interactivity. However, the use of *async* can cause datasets to remain empty while the rest of the dataflow is evaluated, potentially affecting downstream computation.|
| on        | {% include array t="[Trigger](../triggers)" %} | An array of updates to insert, remove, &amp; toggle data values, or clear the data when trigger conditions are met. See the [trigger reference](../triggers) for more.|
| transform | {% include array t="[Transform](../transforms)" %} | An array of transforms to perform on the input data. The output of the transform pipeline then becomes the value of this data set. See the [transform reference](../transforms) for more. |

### Dynamic Data Loading

{% include tag ver="4.2" %} For Vega version 4.2 and higher, the data _url_ parameter and (when used with URL-loading) the _format_ parameter may include [signal references](../types/#Signal). This feature allows either the source url or one or more formatting parameters to be dynamically changed at runtime, causing the data to be reloaded. For example, a single spec might load a different dataset based on user input, or the data might be polled at a regular interval in conjunction with a `timer` event stream.

If no signals are used (the traditional configuration), external data sources are loaded _immediately_ upon view construction and the first dataflow evaluation is delayed until data loading is complete. For dynamic loading, the dataflow must first be evaluated in order to determine the signal values, and then data can be loaded. As a result of this, downstream transforms and encodings may initially be evaluated with empty datasets: _be sure any signal expressions behave appropriately with empty data, including downstream concerns such as empty scale domains_.

## <a name="format"></a>Format

The format object describes the data format and additional parsing instructions.

| Name          | Type                          | Description    |
| :------------ | :---------------------------: | :------------- |
| type          | {% include type t="String" %} | The data format type. The currently supported data formats are `json` (the default), `csv` (comma-separated values), `tsv` (tab-separated values), `dsv` (delimited text files), and `topojson`.|
| parse         | {% include type t="String|Object" %} | If set to `auto`, perform automatic type inference to determine the desired data types. Alternatively, a parsing directive object can be provided for explicit data types. Each property of the object corresponds to a field name, and the value to the desired data type (one of `"boolean"`, `"date"`, `"number"` or `"string"`). For example, `"parse": {"modified_on": "date"}` parses the `modified_on` field in each input record as a Date value. Specific date formats can be provided (e.g., `{"foo": "date:'%m%d%Y'"}`), using the [d3-time-format syntax](https://github.com/d3/d3-time-format#locale_format). UTC date format parsing is supported similarly (e.g., `{"foo": "utc:'%m%d%Y'"}`).|

### <a name="json"></a>json

Loads a JavaScript Object Notation (JSON) file. Assumes row-oriented data, where each row is an object with named attributes. This is the default file format, and so will be used if no `format` parameter is provided. If specified, the `format` parameter should have a `type` property of `"json"`, and can also accept the following:

| Name          | Type                          | Description    |
| :------------ | :---------------------------: | :------------- |
| property      | {% include type t="String" %} | The JSON property containing the desired data. This parameter can be used when the loaded JSON file may have surrounding structure or meta-data. For example `"property": "values.features"` is equivalent to retrieving `json.values.features` from the loaded JSON object. |
| copy          | {% include type t="Boolean" %}| A boolean flag (default `false`) that indicates if input JSON data should be copied prior to use. This setting may be useful when providing as input pre-parsed JSON data (e.g., not loaded from a URL) that should not be modified. |

### <a name="csv"></a>csv

Load a comma-separated values (CSV) file.

| Name          | Type                          | Description    |
| :------------ | :---------------------------: | :------------- |
| header        | {% include type t="String[]" %} | An array of field names to prepend to the data as a header row. A header should only be supplied if the input data does not already include one.|

### <a name="tsv"></a>tsv

Load a tab-separated values (TSV) file.

| Name          | Type                          | Description    |
| :------------ | :---------------------------: | :------------- |
| header        | {% include type t="String[]" %} | An array of field names to prepend to the data as a header row. A header should only be supplied if the input data does not already include one.|

### <a name="dsv"></a>dsv

Load a delimited text file with a custom delimiter.

| Name          | Type                          | Description    |
| :------------ | :---------------------------: | :------------- |
| delimiter     | {% include type t="String" %} | {% include required %} The delimiter between records. The delimiter must be a single character (i.e., a single 16-bit code unit); so, ASCII delimiters are fine, but emoji delimiters are not.|
| header        | {% include type t="String[]" %} | An array of field names to prepend to the data as a header row. A header should only be supplied if the input data does not already include one.|

### <a name="topojson"></a>topojson

Load a JavaScript Object Notation (JSON) file using the [TopoJSON](https://github.com/mbostock/topojson/wiki) format. The input file must contain valid TopoJSON data. The TopoJSON input is then converted into a GeoJSON format for use within Vega. There are two mutually exclusive properties that can be used to specify the conversion process:

| Name          | Type                          | Description    |
| :------------ | :---------------------------: | :------------- |
| feature       | {% include type t="String" %} | The name of the TopoJSON object set to convert to a GeoJSON feature collection. For example, in a map of the world, there may be an object set named `"countries"`. Using the feature property, we can extract this set and generate a GeoJSON feature object for each country.|
| mesh          | {% include type t="String" %} | The name of the TopoJSON object set to convert to a mesh. Similar to the _feature_ option, _mesh_ extracts a named TopoJSON object set. Unlike the _feature_ option, the corresponding geo data is returned as a single, unified mesh instance, not as individual GeoJSON features. Extracting a mesh is useful for more efficiently drawing borders or other geographic elements that you do not need to associate with specific regions such as individual countries, states or counties.|
| filter        | {% include type t="String" %} | An optional filter to apply to an extracted mesh. If set to `"interior"`, only interior region boundaries are included, filtering out exterior borders. If set to `"exterior"`, only the exterior border is included, filtering out all internal boundaries. If `null` or unspecified (the default), no filtering is performed. This property applies to _mesh_ extraction only, not _feature_ extraction. {% include tag ver="5.4" %} |
| property      | {% include type t="String" %} | The JSON property containing the desired data. Similar to [type=json](#json), this optional parameter can be used when the loaded TopoJSON data has surrounding structure or meta-data. |
| copy          | {% include type t="Boolean" %}| A boolean flag (default `false`) that indicates if input JSON data should be copied prior to use. Similar to [type=json](#json), this setting may be useful when providing as input pre-parsed JSON data (e.g., not loaded from a URL) that should not be modified. |


## <a name="examples"></a>Examples

Here is an example defining data directly in a specification:

```json
{"name": "table", "values": [12, 23, 47, 6, 52, 19]}
```

One can also load data from an external file (in this case, a JSON file):

```json
{"name": "points", "url": "data/points.json"}
```

Or, one can simply declare the existence of a data set. The data can then be dynamically provided when the visualization is instantiated. See the [View API](../api/view) documentation for more.

```json
{"name": "table"}
```

Finally, one can draw from an existing data set and apply new data transforms. In this case, we create a new data set (`"stats"`) by computing aggregate statistics for groups drawn from the source `"table"` data set:

```json
{
  "name": "stats",
  "source": "table",
  "transform": [
    {
      "type": "aggregate",
      "groupby": ["x"],
      "ops": ["average", "sum", "min", "max"],
      "fields": ["y", "y", "y", "y"]
    }
  ]
}
```
