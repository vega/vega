# See the README for installation instructions.

NODE_PATH ?= ./node_modules
JS_COMPILER = $(NODE_PATH)/uglify-js/bin/uglifyjs
LOCALE ?= en_US

all: \
	vega.js \
	vega.min.js

vega.js: \
	src/core/_start.js \
	src/_package.js \
	src/core/Bounds.js \
	src/canvas/_package.js \
	src/canvas/path.js \
	src/canvas/marks.js \
	src/canvas/Renderer.js \
	src/canvas/Handler.js \
	src/svg/_package.js \
	src/svg/marks.js \
	src/svg/Renderer.js \
	src/svg/Handler.js \
	src/data/_package.js \
	src/data/read.js \
	src/data/array.js \
	src/data/copy.js \
	src/data/facet.js \
	src/data/filter.js \
	src/data/fold.js \
	src/data/force.js \
	src/data/geo.js \
	src/data/geopath.js \
	src/data/link.js \
	src/data/pie.js \
	src/data/sort.js \
	src/data/stack.js \
	src/data/stats.js \
	src/data/treemap.js \
	src/data/unique.js \
	src/data/wordcloud.js \
	src/data/zip.js \
	src/parse/_package.js \
	src/parse/axes.js \
	src/parse/data.js \
	src/parse/dataflow.js \
	src/parse/marks.js \
	src/parse/padding.js \
	src/parse/properties.js \
	src/parse/scales.js \
	src/parse/spec.js \
	src/parse/transform.js \
	src/scene/_package.js \
	src/scene/Item.js \
	src/scene/build.js \
	src/scene/encode.js \
	src/scene/transition.js \
	src/core/Axes.js \
	src/core/Model.js \
	src/core/View.js \
	src/core/Spec.js \
	src/core/_end.js

%.min.js: %.js Makefile
	@rm -f $@
	$(JS_COMPILER) < $< > $@

vega.js: Makefile
	@rm -f $@
	cat $(filter %.js,$^) > $@
	@chmod a-w $@

install:
	mkdir -p node_modules
	npm install

clean:
	rm -f tv*.js package.json
