---
layout: spec
title: Triggers
permalink: /docs/triggers/index.html
---

**Triggers** enable dynamic updates to data sets or mark items when specific conditions are met. When a _trigger_ expression &ndash; typically referencing one or more signals &ndash; evaluates to a truthy value, one or more data updates (_insert_, _remove_, _toggle_ and/or _modify_) are applied.

Triggers can either be used to update data objects within a [data set](../data), or to update the properties (_modify_ only) of mark items within a [mark](../marks) definition. Please note that triggers are **not** supported for derived data sets; any triggers defined on a derived data set will have no effect.

## Trigger Object Properties

| Property  | Type                          | Description    |
| :-------- | :---------------------------: | :------------- |
| trigger   | [Expression](../expressions)  | {% include required %} An expression defining the trigger condition. When this expression is evaluated and returns a truthy value, the trigger condition is met and data updates are applied.|
| insert    | [Expression](../expressions)  | An expression that evaluates to data objects to insert. Insert operations are only applicable to data sets, not marks.|
| remove    | [Expression](../expressions){% include or %}{% include type t="Boolean" %} | An expression that indicates which data objects to remove. If boolean `true`, indicates that all existing data objects should be removed. If an existing data object or array of data objects, those objects are removed. Otherwise, an object-valued expression result is treated as a predicate specification: all data objects with property values matching those of the input object should be removed. Remove operations are only applicable to data sets, not marks.|
| toggle    | [Expression](../expressions)  | An expression that indicates which data objects to toggle. The expresion result is treated as a predicate specification: all data objects with property values matching those of the input object should be toggled. Toggled objects are inserted or removed depending on whether they are already in the data set. Toggle operations are only applicable to data sets, not marks.|
| modify    | [Expression](../expressions)  | An expression that evaluates to data objects to modify. The expression result should consist of one or more data objects that already exist in the data stream. Modify operations are applicable to both data sets and marks. If _modify_ is specified, the _values_ property **must** be specified as well.|
| values    | [Expression](../expressions)  | An expression that evaluates to an object of name-value pairs, indicating the field values that should be updated for the data objects returned by the _modify_ expression. |

## Usage

Update a data set of selected items based on shift-click interactions. The signal `shift` indicates if the shift key is pressed during a click event, and the signal `clicked` references a data object corresponding to a clicked mark item. (Note the signal definitions are not shown in these examples.) If a click event occurs and the shift key is not pressed, all selected items are removed. If a mark item is clicked without the shift key, its data object is added to the data set. If a mark item is clicked while the shift key is pressed, its data object is toggled.

{: .suppress-error}
```json
"data": [
  ...
  {
    "name": "selected",
    "on": [
      {"trigger": "!shift", "remove": true},
      {"trigger": "!shift && clicked", "insert": "clicked"},
      {"trigger": "shift && clicked", "toggle": "clicked"}
    ]
  }
]
```

Set the `fx` and `fy` properties on mark items referenced by the `dragged` signal to the current mouse position:

{: .suppress-error}
```json
{
  "type": "symbol",
  "from": {"data": "nodes"},
  "encode": {...},
  "on": [
    {
      "trigger": "dragged",
      "modify":  "dragged",
      "values":  "{fx: x(), fy: y()}"
    }
  ]
}
```
