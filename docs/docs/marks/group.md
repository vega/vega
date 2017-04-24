---
layout: mark
title: Group Mark
permalink: /docs/marks/group/index.html
---

**Group** marks are containers for other marks, and used to create visualizations with multiple views or layers. Each group instance recursively defines its own nested visualization specification. Group marks provide their own coordinate space and can include nested [data](../../data), [signal](../../signals), [scale](../../scales), [axis](../../axes), [legend](../../legends), [title](../../title) and [mark](../) definitions. In addition a group mark may have a colored background, similar to a `rect` mark.

## Example

{% include embed spec="group" %}

## Type-Specific Mark Properties

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| clip                | {% include type t="Boolean" %} | A boolean flag indicating if the visible group content should be clipped to the group's specified width and height. |
| cornerRadius        | {% include type t="Number" %}  | The radius in pixels of rounded rectangle corners for the group background (default `0`). |

{% include properties.md %}
