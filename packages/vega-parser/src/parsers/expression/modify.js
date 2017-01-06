import {isArray, truthy} from 'vega-util';

function removePredicate(props) {
  return function(_) {
    for (var key in props) {
      if (_[key] !== props[key]) return false;
    }
    return true;
  };
}

export default function(name, insert, remove, toggle, modify, values) {
  var df = this.context.dataflow,
      data = this.context.data[name],
      input = data.input,
      changes = data.changes,
      stamp = df.stamp(),
      predicate, key;

  if (!(input.value.length || insert || toggle)) {
    // nothing to do!
    return 0;
  }

  if (!changes || changes.stamp < stamp) {
    data.changes = (changes = df.changeset());
    changes.stamp = stamp;
    df.runAfter(function() {
      df.pulse(input, changes).run();
    });
  }

  if (remove) {
    predicate = remove === true ? truthy
      : (isArray(remove) || remove._id != null) ? remove
      : removePredicate(remove);
    changes.remove(predicate);
  }

  if (insert) {
    changes.insert(insert);
  }

  if (toggle) {
    predicate = removePredicate(toggle);
    if (input.value.filter(predicate).length) {
      changes.remove(predicate);
    } else {
      changes.insert(toggle);
    }
  }

  if (modify) {
    for (key in values) {
      changes.modify(modify, key, values[key]);
    }
  }

  return 1;
}
