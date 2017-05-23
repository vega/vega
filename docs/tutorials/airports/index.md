---
layout: tutorials
title: "Mapping Airport Connections Tutorial"
permalink: /tutorials/airports/index.html
---

From massive hubs to small local outposts, the United States air traffic system consists of a rich set of connections among hundeds of airports. In this tutorial, we will visualize this system of airports and connections, based on data from the year 2008. Our goal will be to create our own version of [Mike Bostock's D3.js airports map](https://mbostock.github.io/d3/talk/20111116/airports.html).

{% include embed spec="airports" dir="." %}

In the process, we will touch upon many of the features supported by Vega: transforming data, combining multiple data sets, handling user input, mapping geographic data, and plotting both tabular and network data. Here's the steps we will follow:

1. [Meet the Data](#meet-the-data)
2. [Visualization Scaffolding](#visualization-scaffolding)
3. [Draw a U.S. State Map](#draw-a-us-state-map)
4. [Plot All the Airports](#plot-all-the-airports)
5. [Filter the Airports by Traffic](#filter-airports-by-traffic)
6. [Size the Airports by Traffic](#size-airports-by-traffic)
7. [Show Airport Name on Mouse Hover](#show-airport-name-on-hover)
8. [Sort the Airports by Size](#sort-airports-by-size)
9. [Plot the Connections among Airports](#plot-connections-among-airports)
10. [Show Connections on Mouse Hover](#show-connections-on-hover)
11. [Add Mouse Acceleration via Voronoi Cells](#add-voronoi-cells)
12. [One Last Thing...](#one-last-thing)

As you work through the tutorial, we encourage you to build up and experiment with each step in the [online Vega Editor](http://vega.github.io/new-editor).


<a name="meet-the-data"></a>

## Step 1: Meet the Data

Let's begin by examining our raw ingredients. We will build the visualization from three data sets; each resides in the `data` subfolder and are available within the [Vega Editor](http://vega.github.io/new-editor).

**[us-10m.json](../../data/us-10m.json)**

This is a [TopoJSON](https://github.com/mbostock/topojson) file that contains the boundaries of U.S. states at a scale of 1:10,000,000. We will use this file to draw a map of U.S. states as the base layer of our visualization. If you are interested in generating your own TopoJSON data, check out the [U.S. Atlas TopoJSON tools](https://github.com/mbostock/us-atlas).

**[airports.csv](../../data/airports.csv)**

This data set contains a list of U.S. airports in CSV (comma-separated value) format. The first column (`iata`) contains a unique identifier provided by the International Air Transport Association. Subsequent columns describe the name and location of the airport, including `latitude` and `longitude` coordinates. We will use these coordinates to plot the airports.

```csv
iata,name,city,state,country,latitude,longitude
00M,Thigpen,Bay Springs,MS,USA,31.95376472,-89.23450472
00R,Livingston Municipal,Livingston,TX,USA,30.68586111,-95.01792778
00V,Meadow Lake,Colorado Springs,CO,USA,38.94574889,-104.5698933
01G,Perry-Warsaw,Perry,NY,USA,42.74134667,-78.05208056
```

**[flights-airport.csv](../../data/flights-airport.csv)**

This data set contains flight information for the year 2008. Each record consists of an `origin` airport (identified by IATA id), a `destination` airport, and the `count` of flights along this route. We will use this dataset to compute per-airport traffic and to plot connections among airports.

```csv
origin,destination,count
ABE,ATL,853
ABE,BHM,1
ABE,CLE,805
ABE,CLT,465
```


<a name="visualization-scaffolding"></a>

## Step 2: Visualization Scaffolding

Now let's get started building our visualization! We begin with a basic scaffold:

```json
{
  "$schema": "https://vega.github.io/schema/vega/v{{ site.data.versions.schema }}.json",
  "width": 900,
  "height": 560,
  "padding": {"top": 0, "left": 0, "right": 0, "bottom": 0},
  "signals": [],
  "data": [],
  "scales": [],
  "projections": [],
  "marks": []
}
```

We first set the width (`900` pixels) and height (`560` pixels) of the view, and initially set the padding to zero (we will adjust this later on). We also include empty arrays for:

* `signals` for variables that dynamically react to user input,
* `data` to load and transform data sets,
* `scales` to map data values to visual variables,
* `projections` to draw a base map showing U.S. states, and
* `marks` for graphical elements that visualize data.

We will fill in each of these aspects as we progress.


<a name="draw-a-us-state-map"></a>

## Step 3: Draw a U.S. State Map

Now that we have a basic setup, let's add a U.S. state map as the background layer of our visualization. This requires two steps: preparing the data and drawing the map.

### Load TopoJSON Data

To load the geographic data, we add an entry to the `data` array:

{: .suppress-error}
```json
"data": [
  {
    "name": "states",
    "url": "data/us-10m.json",
    "format": {"type": "topojson", "feature": "states"}
  }
],
```

This entry defines a new dataset named `states`, and loads it from the provided URL. We use the `format` property to indicate that this is `topojson` data and that we wish to use the feature named `states`. TopoJSON files may include any number of arbitrarily-named features; `us-10m.json` includes the features `states` and `counties`.

We can now load the data, and Vega unpacks the requested feature into a collection of latitude and longitude coordinates in [GeoJSON](http://geojson.org/) format. To visualize the states, we next want to add a cartographic projection to map from (longitude, latitude) coordinates to (x, y) coordinates. While a number of projections might be reasonable choices, the [Albers projection](https://en.wikipedia.org/wiki/Albers_projection) preserves area, and the special `albersUsa` version places Alaska and Hawaii in convenient viewing locations, which will allow us to better see flights originating in those states.

{: .suppress-error}
```json
"projections": [
  {
    "name": "projection",
    "type": "albersUsa",
    "scale": 1200,
    "translate": [{"signal": "width / 2"}, {"signal": "height / 2"}]
  }
],
```

In addition to the projection `type`, we supply `scale` and `translate` parameters to set the zoom level and relative position of the map. We use _signal expressions_ to ensure that we `translate` the map to the center of the view. With our projection defined, we can update our data set definition to generate paths for each state using the `geopath` transform:

{: .suppress-error}
```json
"data": [
  {
    "name": "states",
    "url": "data/us-10m.json",
    "format": {"type": "topojson", "feature": "states"},
    "transform": [
      {
        "type": "geopath",
        "projection": "projection"
      }
    ]
  }
],
```

For each state, the `geopath` transform sets a `path` property that contains outlines for each state as [SVG path strings](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths).

### Draw State Boundaries

Once we've generated outline paths for each state, plotting them is straightforward:

{: .suppress-error}
```json
"marks": [
  {
    "type": "path",
    "from": {"data": "states"},
    "encode": {
      "enter": {
        "fill": {"value": "#dedede"},
        "stroke": {"value": "white"}
      },
      "update": {
        "path": {"field": "path"}
      }
    }
  }
]
```

Here we add a definition for a `path` mark to the `marks` array. In the `enter` block we set the `fill` color to light grey, and set the `stroke` color to white. In the `update` block we use the `path` property for the path outline. (We place the `path` encoding in the `update` block to ensure that the map outlines update if we change the size of the visualization or modify other aspects.)

{% include embed spec="airports-map" dir="." %}

Et voil&agrave;! Our visualization now contains a base map. If you are feeling adventurous, try experimenting with changing the map projection, adjusting the projection parameters, and modifying the visualization size!


<a name="plot-all-the-airports"></a>

## Step 4: Plot All the Airports

Now we can plot the airports on our map. We load the airport data by adding a new `airports` entry to the end of the `data` array:

```json
{
  "name": "airports",
  "url": "data/airports.csv",
  "format": {"type": "csv", "parse": "auto"}
}
```

We use the `format` property to indicate that this is `csv` data and that we should `auto` parse the data values. Vega will automatically try to determine which columns are numbers, which are strings, and so on.

To plot the data, we need to project the `longitude` and `latitude` variables to x and y coordinates. Here we use the `geopoint` transform with the same projection as before. By default, `geopoint` writes the projected coordinates to the `x` and `y` fields of the data objects (though you can use the `as` parameter to provide different field names).

```json
{
  "name": "airports",
  "url": "data/airports.csv",
  "format": {"type": "csv", "parse": "auto"},
  "transform": [
    {
      "type": "geopoint",
      "projection": "projection",
      "fields": ["longitude", "latitude"]
    },
    {
      "type": "filter",
      "expr": "datum.x != null && datum.y != null"
    }
  ]
}
```

In addition, we add a `filter` transform to remove any data points with `null` coordinates. Airports outside the 50 states and Washington D.C. (such as those in U.S. territories) are not supported by the `albersUsa` projection. The projection returns `null` x and y values for those airports.

To visualize the airports, we add a new `symbol` mark entry to the `marks` array:

```json
{
  "type": "symbol",
  "from": {"data": "airports"},
  "encode": {
    "enter": {
      "size": {"value": 16},
      "fill": {"value": "steelblue"},
      "fillOpacity": {"value": 0.8},
      "stroke": {"value": "white"},
      "strokeWidth": {"value": 1.5}
    },
    "update": {
      "x": {"field": "x"},
      "y": {"field": "y"}
    }
  }
}
```

The symbol mark type defaults to circles if no `shape` property is provided. We position each airport according to the `x` and `y` coordinates set by the `geopoint` transform. We also set a number of constant values for the size, fill and stroke.

{% include embed spec="airports-all" dir="." %}

The result is a map of all airports in the United States. That's a lot of airports!


<a name="filter-airports-by-traffic"></a>

## Step 5: Filter the Airports by Traffic

We'd now like to visualize more information about the airports. How much traffic does each airport get in 2008? In the process, we can also filter out those airports that did not service any commercial flights in 2008. To incorporate this information, we need to load the flights data.

We can add the following entry to the the `data` array, _before_ the `airports` data:

```json
{
  "name": "traffic",
  "url": "data/flights-airport.csv",
  "format": {"type": "csv", "parse": "auto"},
  "transform": [
    {
      "type": "aggregate",
      "groupby": ["origin"],
      "fields": ["count"], "ops": ["sum"], "as": ["flights"]
    }
  ]
}
```

We load the data and parse the CSV file. We then use an `aggregate` transform to count the total number of flights originating at each airport. The resulting `traffic` dataset is a table with two variables: an `origin` airport and the total count of `flights` that departed that airport.

Now that we have a measure of per-airport traffic, we would like to combine (or in database terms, _join_) this data with our original airports data. To do this, we use Vega's `lookup` transform. This transform looks for specified key values of a primary dataset within a secondary dataset, and if found adds the matched data record as a new property of the primary data.

```json
{
  "name": "airports",
  "url": "data/airports.csv",
  "format": {"type": "csv", "parse": "auto"},
  "transform": [
    {
      "type": "lookup",
      "from": "traffic", "key": "origin",
      "fields": ["iata"], "as": ["traffic"]
    },
    {
      "type": "filter",
      "expr": "datum.traffic != null"
    },
    {
      "type": "geopoint",
      "projection": "projection",
      "fields": ["longitude", "latitude"]
    },
    {
      "type": "filter",
      "expr": "datum.x != null && datum.y != null"
    }
  ]
}
```

Here the `airports` data is our primary dataset and the `traffic` data is used as the lookup table. For each airport, we look for a record in the traffic data whose `origin` property matches the `iata` property of the airport. If a match is found, we add the traffic record to the airport data under a property named `traffic`.

We also add a new `filter` transform to remove airports for which we fail to find a match in the traffic dataset (indicated by a `null` value). This step filters out all the airports for which we observe no originating flights in 2008. Though we could combine the filter criteria into a single filter instance, here we filter out the extraneous airports up front so that we don't waste time needlessly computing geo-coordinates.

{% include embed spec="airports-filtered" dir="." %}

We now see only those airports that are included in the `flights-airport.csv` data.


<a name="size-airports-by-traffic"></a>

## Step 6: Size the Airports by Traffic

We can also use the traffic data to size each airport based on the number of originating flights. We first add an entry to the `scales` array to map from traffic to circular area:

{: .suppress-error}
```json
"scales": [
  {
    "name": "size",
    "type": "linear",
    "domain": {"data": "traffic", "field": "flights"},
    "range": [16, 1000]
  }
],
```

Here we define a linear scale that maps from the `domain` of flight counts to a `range` of `[16, 1000]` pixels. At this point, you might be thinking: Why a linear scale? If we map that to the radius of a circle, won't we exaggerate the area and mislead our viewers? (In general you would be correct!) However, in this case we are using the `size` parameter of our `symbol` marks: this property sets the _area_, not the _radius_, of the symbol.

```json
{
  "type": "symbol",
  "from": {"data": "airports"},
  "encode": {
    "enter": {
      "size": {"scale": "size", "field": "traffic.flights"},
      "fill": {"value": "steelblue"},
      "fillOpacity": {"value": 0.8},
      "stroke": {"value": "white"},
      "strokeWidth": {"value": 1.5}
    },
    "update": {
      "x": {"field": "x"},
      "y": {"field": "y"}
    }
  }
}
```

Here we modify our airport `symbol` marks. The `size` property is now set by running `traffic.flights` through our size scale. We also set `fillOpacity` to create a transparency effect and increase the `strokeWidth`.

{% include embed spec="airports-sized" dir="." %}

We can now see the massive hubs, the local outposts, and everything in-between!


<a name="show-airport-name-on-hover"></a>

## Step 7: Show Airport Name on Mouse Hover

While we can see differences between airports, it would be nice to see their names, too. We will now add interactions to show the airport name and IATA id upon mouse hover. To do so, we add two entries to the `signals` array:

{: .suppress-error}
```json
"signals": [
  {
    "name": "hover",
    "value": null,
    "on": [
      {"events": "symbol:mouseover", "update": "datum"},
      {"events": "symbol:mouseout", "update": "null"}
    ]
  },
  {
    "name": "title",
    "value": "U.S. Airports, 2008",
    "update": "hover ? hover.name + ' (' + hover.iata + ')' : 'U.S. Airports, 2008'"
  }
],
```

_Signals_ are variables that can change dynamically in response to user input. Each signal consists of a name, an initial value, and an optional set of one or more update rules. The update rules are defined as a set of handlers for input `events` that `update` the signal value. To learn more about expressions, see the [expression language documentation](../../docs/expressions).

The `hover` signal contains the current airport record (or `datum`) under the mouse cursor, or `null` if no airport is being hovered over. The `on` entries state that upon `mousover` of a `symbol` mark, set the signal value to the current `datum`. Upon a `mouseout` event, set the signal value to `null`. In short, this signal tracks the data of the currently hovered symbol.

The `title` signal contains a string describing the currently hovered airport, or a generic title string if no airport is selected. The `update` entry responds to changes in the `hover` signal, producing a string containing the airport `name` and `iata` id if the `hover` data point is defined.

To show this information, we add a new `text` mark entry to the end of the `marks` array:

```json
 {
  "type": "text",
  "interactive": false,
  "encode": {
    "enter": {
      "x": {"signal": "width", "offset": -5},
      "y": {"value": 0},
      "fill": {"value": "black"},
      "fontSize": {"value": 20},
      "align": {"value": "right"}
    },
    "update": {
      "text": {"signal": "title"}
    }
  }
}
```

Note that this text mark definition does not have a `from` property indicating a backing data source. If the `from` property is omitted, Vega defaults to generating a single mark instance. We set the text layout and appearance. We use a combination of a signal expression and offset to position the title 5 pixels in from the right side of the view. We set the `text` content to be the `title` signal. As the `title` signal changes, the text will reactively update in response.

Unfortunately, there is still a problem: we positioned the text at the top-right of the display, such that much of the text will actually be drawn off-screen!

{: .suppress-error}
```json
"padding": {"top": 25, "left": 0, "right": 0, "bottom": 0},
```

To fix the problem, we can add `25` pixels of padding to the `top` of the visualization.

{% include embed spec="airports-hover" dir="." %}

Now we can mouse over each airport to see more information.


<a name="sort-airports-by-size"></a>

## Step 8: Sort the Airports by Size

Notice any problems with our visualization? Take a look at Chicago: O'Hare completely covers Midway! Or look at Dallas, where DFW clobbers DAL. When visualizing points of varying size, it is common to sort by size, such that smaller elements are drawn on top of larger elements.

```json
{
  "name": "airports",
  "url": "data/airports.csv",
  "format": {"type": "csv", "parse": "auto"},
  "transform": [
    {
      "type": "lookup",
      "from": "traffic", "key": "origin",
      "fields": ["iata"], "as": ["traffic"]
    },
    {
      "type": "filter",
      "expr": "datum.traffic != null"
    },
    {
      "type": "geopoint",
      "projection": "projection",
      "fields": ["longitude", "latitude"]
    },
    {
      "type": "filter",
      "expr": "datum.x != null && datum.y != null"
    },
    {
      "type": "collect", "sort": {
        "field": "traffic.flights",
        "order": "descending"
      }
    }
  ]
}
```

We now add a `collect` transform to the `airports` data: this operation collects all the object in a data stream, allowing us to sort them. We include a `sort` parameter that indicates we should sort by the flight counts data `field` in a descending sort `order`. This sorting causes larger points to be drawn before smaller points.

{% include embed spec="airports-sort" dir="." %}

That's better!


<a name="plot-connections-among-airports"></a>

## Step 9: Plot the Connections among Airports

Now we're ready to visualize the connections among the airports.

Let's add a new entry (`routes`) to the end of the `data` array:

```json
{
  "name": "routes",
  "url": "data/flights-airport.csv",
  "format": {"type": "csv", "parse": "auto"},
  "transform": [
    {
      "type": "lookup",
      "from": "airports", "key": "iata",
      "fields": ["origin", "destination"], "as": ["source", "target"]
    },
    {
      "type": "filter",
      "expr": "datum.source && datum.target"
    },
    {
      "type": "linkpath",
      "shape": "line"
    }
  ]
}
```

After loading the CSV file, we apply a series of transforms. First, we need the coordinates for both the `origin` and `destination` airports so we perform a `lookup` against the `airports` data. The transform is similar to our earlier lookup against the `traffic` data, except here we perform two lookups at once to grab both the origin and destination. Second, we filter out any routes for which the lookup failed. This keeps us safe if the `routes` data contains any origins or destinations not present in the `airports` data.

Finally, we add a `linkpath` transform, which generates an SVG path based on link end points. The `linkpath` shape defaults to a straight line, but we explicitly set the `shape` parameter to `line` to make our intention clear. (For a different style, try setting the shape to `curve` instead!)

To determine the link end points, the `linkpath` transform looks for `source.x` and `source.y` properties (and similarly for `target`) by default. In this case, we don't need to provide any additional configuration &ndash; that is why we set `source` and `target` as the output properties of the `lookup` transform!

Now we can add a new `path` mark to the `marks` array to visualize the routes:

```json
{
  "type": "path",
  "interactive": false,
  "from": {"data": "routes"},
  "properties": {
    "enter": {
      "path": {"field": "layout_path"},
      "stroke": {"value": "black"},
      "strokeOpacity": {"value": 0.15}
    }
  }
}
```

We set the `interactive` property false to prevent the links from interfering with mouse events from the airport symbols. As there may be many links with lots of overlap, we also set the `strokeOpacity` to a low value (`0.15`).

{% include embed spec="airports-connect-all" dir="." %}

What a mess! Let's filter the connections and use interaction to show details-on-demand.


<a name="show-connections-on-hover"></a>

## Step 10: Show Connections on Mouse Hover

Adding hover-sensitive filtering is now quite easy:

{: .suppress-error}
```json
{
  "name": "routes",
  "url": "data/flights-airport.csv",
  "format": {"type": "csv", "parse": "auto"},
  "transform": [
    {
      "type": "filter",
      "expr": "hover && hover.iata == datum.origin"
    },
    ...
  ]
}
```

We already have a `hover` signal set up to track the data associated with the currently selected airport. We just need to add a `filter` transform to our `routes` data: the new `filter` at the beginning of the transform list keeps only those routes whose `origin` matches the selected airport. In addition, we increase the path `strokeOpacity` to `0.35` to be a bit more opaque.

{% include embed spec="airports-connect-hover" dir="." %}

Now we can interactively explore the network of routes!


<a name="add-voronoi-cells"></a>

## Step 11: Add Mouse Acceleration via Voronoi Cells

We now have a nice interactive visualization, but we can make it even better. Some of the airports are rather small and hard to select. Instead of having to hover directly over a point, let's update the visualization to select the _nearest_ airport to the mouse cursor.

To do so, we can create a [Voronoi diagram](https://en.wikipedia.org/wiki/Voronoi_diagram), which subdivides space into the cells containing all points closest to our data points. We can then filter the routes based on mouse over of the Voronoi cells. To compute the Voronoi cells, we add a `voronoi` transform to the `airports` data before the sort operation:

{: .suppress-error}
```json
{
  "name": "airports",
  "url": "data/airports.csv",
  "format": {"type": "csv", "parse": "auto"},
  "transform": [
    ...
    {
      "type": "voronoi", "x": "x", "y": "y"
    },
    {
      "type": "collect", "sort": {
        "field": "traffic.flights",
        "order": "descending"
      }
    }
  ]
},
```

The `voronoi` transform computes the enclosing cells for each airport using the `x` and `y` coordinates. The output is an SVG path string written to the `path` property.

Next, we add the Voronoi cells to the visualization as an invisible set of `path` marks. We add the following to the `data` array, right _after_ the airport `symbol` marks:

{: .suppress-error}
```json
{
  "type": "path",
  "name": "cell",
  "from": {"data": "airports"},
  "encode": {
    "enter": {
      "fill": {"value": "transparent"}
    },
    "update": {
      "path": {"field": "path"}
    }
  }
},
```

We set the `fill` to `transparent` to ensure that the Voronoi cells can't be seen, but still receive input events. We also specify a `name` property so that we can refer to these marks elsewhere.

Finally, we update our `hover` signal to respond to mouse events on the Voronoi cells instead of on the circle `symbol` marks:

{: .suppress-error}
```json
{
  "name": "hover",
  "value": null,
  "on": [
    {"events": "@cell:mouseover", "update": "datum"},
    {"events": "@cell:mouseout", "update": "null"}
  ]
},
```

Here we simply replace `symbol:` with `@cell:`. The `@name` pattern selects only events originating from a mark with the provided name.

{% include embed spec="airports-voronoi" dir="." %}

Now we have much improved, user-friendly mouse selection!

<a name="one-last-thing"></a>

## Step 12: One Last Thing...

We now have a complete interactive visualization! But before we wrap up, let's add a little easter egg. We use invisible Voronoi cells to help with mouse selections. In order to better understand them, it might be nice to actually see them! Let's toggle their visibility with a double click...

We add a new signal named `cell_stroke` to our `signals` array:

```json
{
  "name": "cell_stroke",
  "value": null,
  "on": [
    {"events": "dblclick", "update": "cell_stroke ? null : 'brown'"},
    {"events": "mousedown!", "update": "cell_stroke"}
  ]
}
```

This signal responds to any double click (`dblclick`) event, toggling the `cell_stroke` signal between `null` and `'brown'`. However, the double click action may cause text on the page to be automatically selected due to the web browser's default behavior. To prevent text selection on double click, we include an extra event handler for `mousedown` events. The exclamation point (`mousedown!`) indicates that the handler should _consume_ the event, thereby preventing side-effects such as text selection; the signal itself simply retains its current value.

Finally, we update our Voronoi cell marks:

{: .suppress-error}
```json
{
  "type": "path",
  "name": "cell",
  "from": {"data": "airports"},
  "encode": {
    "enter": {
      "fill": {"value": "transparent"},
      "strokeWidth": {"value": 0.35}
    },
    "update": {
      "path": {"field": "path"},
      "stroke": {"signal": "cell_stroke"}
    }
  }
},
```

We add `strokeWidth` to the `enter` properties, and add `stroke` color to the `update` properties. We set `stroke` to be the value of the `cell_stroke` signal, so that the Voronoi cells will automatically toggle their visibility upon double click.

To test out our easter egg, scroll back to the top of this page and try double clicking the visualization! You may also now want to review [our complete Vega specification](airports.vg.json).

### Next Steps

Though we've reached the end of this tutorial, there are a number of additional variations you might attempt on your own:

- Can you modify the signals to support touch events as well as mouse events?
- In addition to showing links on hover, can you make the origin airport highlight in a new color?
- When selecting an origin airport, can you make the destinations highlight?
- Can you change the map projection to view the routes from a different perspective?
- Can you collect additional data and visualize airports across the entire world?
