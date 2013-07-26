#!/bin/bash
mkdir output

# test canvas
echo
echo "TESTING CANVAS"
echo "ARC"
./bin/vg2png examples/spec/arc.json -b examples output/arc.png
echo "AREA"
./bin/vg2png examples/spec/area.json -b examples output/area.png
echo "BAR"
./bin/vg2png examples/spec/bar.json -b examples output/bar.png
echo "BARLEY"
./bin/vg2png examples/spec/barley.json -b examples output/barley.png
echo "CHOROPLETH"
./bin/vg2png examples/spec/choropleth.json -b examples output/choropleth.png
echo "ERROR_BARS"
./bin/vg2png examples/spec/error.json -b examples output/error.png
echo "FORCE"
./bin/vg2png examples/spec/force.json -b examples output/force.png
echo "GROUPED_BAR"
./bin/vg2png examples/spec/grouped_bar.json -b examples output/grouped_bar.png
echo "IMAGE"
./bin/vg2png examples/spec/image.json -b examples output/image.png
echo "JOBS"
./bin/vg2png examples/spec/jobs.json -b examples output/jobs.png
echo "LIFELINES"
./bin/vg2png examples/spec/lifelines.json -b examples output/lifelines.png
echo "NAPOLEON"
./bin/vg2png examples/spec/napoleon.json -b examples output/napoleon.png
echo "PARALLEL_COORDINATES"
./bin/vg2png examples/spec/parallel_coords.json -b examples output/parallel_coords.png
echo "POPULATION_PYRAMID"
./bin/vg2png examples/spec/population.json -b examples output/population.png
echo "SCATTER_PLOT_MATRIX"
./bin/vg2png examples/spec/scatter_matrix.json -b examples output/scatter_matrix.png
echo "SCATTER_PLOT"
./bin/vg2png examples/spec/scatter.json -b examples output/scatter.png
echo "STACKED_AREA"
./bin/vg2png examples/spec/stacked_area.json -b examples output/stacked_area.png
echo "STACKED_BAR"
./bin/vg2png examples/spec/stacked_bar.json -b examples output/stacked_bar.png
echo "STOCKS"
./bin/vg2png examples/spec/stocks.json -b examples output/stocks.png
echo "TREEMAP"
./bin/vg2png examples/spec/treemap.json -b examples output/treemap.png
echo "WEATHER"
./bin/vg2png examples/spec/weather.json -b examples output/weather.png

# test svg
echo
echo "TESTING SVG"
echo "ARC"
./bin/vg2svg examples/spec/arc.json -b examples output/arc.svg
echo "AREA"
./bin/vg2svg examples/spec/area.json -b examples output/area.svg
echo "BAR"
./bin/vg2svg examples/spec/bar.json -b examples output/bar.svg
echo "BARLEY"
./bin/vg2svg examples/spec/barley.json -b examples output/barley.svg
echo "CHOROPLETH"
./bin/vg2svg examples/spec/choropleth.json -b examples output/choropleth.svg
echo "ERROR_BARS"
./bin/vg2svg examples/spec/error.json -b examples output/error.svg
echo "FORCE"
./bin/vg2svg examples/spec/force.json -b examples output/force.svg
echo "GROUPED_BAR"
./bin/vg2svg examples/spec/grouped_bar.json -b examples output/grouped_bar.svg
echo "IMAGE"
./bin/vg2svg examples/spec/image.json -b examples output/image.svg
echo "JOBS"
./bin/vg2svg examples/spec/jobs.json -b examples output/jobs.svg
echo "LIFELINES"
./bin/vg2svg examples/spec/lifelines.json -b examples output/lifelines.svg
echo "NAPOLEON"
./bin/vg2svg examples/spec/napoleon.json -b examples output/napoleon.svg
echo "PARALLEL_COORDINATES"
./bin/vg2svg examples/spec/parallel_coords.json -b examples output/parallel_coords.svg
echo "POPULATION_PYRAMID"
./bin/vg2svg examples/spec/population.json -b examples output/population.svg
echo "SCATTER_PLOT_MATRIX"
./bin/vg2svg examples/spec/scatter_matrix.json -b examples output/scatter_matrix.svg
echo "SCATTER_PLOT"
./bin/vg2svg examples/spec/scatter.json -b examples output/scatter.svg
echo "STACKED_AREA"
./bin/vg2svg examples/spec/stacked_area.json -b examples output/stacked_area.svg
echo "STACKED_BAR"
./bin/vg2svg examples/spec/stacked_bar.json -b examples output/stacked_bar.svg
echo "STOCKS"
./bin/vg2svg examples/spec/stocks.json -b examples output/stocks.svg
echo "TREEMAP"
./bin/vg2svg examples/spec/treemap.json -b examples output/treemap.svg
echo "WEATHER"
./bin/vg2svg examples/spec/weather.json -b examples output/weather.svg

echo
echo "DONE"