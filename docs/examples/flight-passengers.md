---
layout: example
title: Flight Passengers Example
permalink: /examples/flight-passengers/index.html
spec: flight-passengers
image: /examples/img/flight-passengers.png
---

Monthly [total passengers at Seattle-Tacoma International Airport](https://www.portseattle.org/page/airport-statistics) (October 2019 to April 2020) relative to the previous year. This specification uses both automatically-generated and user-customized [ARIA accessibility attributes](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA). The `aria` and `description` properties are used to customize the elements and content provided to screen readers. In addition, custom `zindex` values are used to ensure a legible ordering of marks and guides within the output SVG. This example will update over time as Vega's accessibility support improves.

{% include example spec=page.spec %}
