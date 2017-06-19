---
layout: page
title: Example Gallery
permalink: /examples/index.html
menu: examples
---

{% for group in site.data.examples %}
## {{ group[0] }}
{% for spec in group[1] %}
{% include preview spec=spec.name %}
{% endfor %}
{% endfor %}