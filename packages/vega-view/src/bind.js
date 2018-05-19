import element from './element';
import {debounce} from 'vega-util';
import {tickStep} from 'd3-array';

var BindClass = 'vega-bind',
    NameClass = 'vega-bind-name',
    RadioClass = 'vega-bind-radio',
    OptionClass = 'vega-option-';

/**
 * Bind a signal to an external HTML input element. The resulting two-way
 * binding will propagate input changes to signals, and propagate signal
 * changes to the input element state. If this view instance has no parent
 * element, we assume the view is headless and no bindings are created.
 * @param {Element|string} el - The parent DOM element to which the input
 *   element should be appended as a child. If string-valued, this argument
 *   will be treated as a CSS selector. If null or undefined, the parent
 *   element of this view will be used as the element.
 * @param {object} param - The binding parameters which specify the signal
 *   to bind to, the input element type, and type-specific configuration.
 * @return {View} - This view instance.
 */
export default function(view, el, binding) {
  if (!el) return;

  var param = binding.param,
      bind = binding.state;

  if (!bind) {
    bind = binding.state = {
      elements: null,
      active: false,
      set: null,
      update: function(value) {
        if (value !== view.signal(param.signal)) {
          bind.source = true;
          view.signal(param.signal, value).run();
        }
      }
    };
    if (param.debounce) {
      bind.update = debounce(param.debounce, bind.update);
    }
  }

  generate(bind, el, param, view.signal(param.signal));

  if (!bind.active) {
    view.on(view._signals[param.signal], null, function() {
      bind.source
        ? (bind.source = false)
        : bind.set(view.signal(param.signal));
    });
    bind.active = true;
  }

  return bind;
}

/**
 * Generate an HTML input form element and bind it to a signal.
 */
function generate(bind, el, param, value) {
  var div = element('div', {'class': BindClass});

  div.appendChild(element('span',
    {'class': NameClass},
    (param.name || param.signal)
  ));

  el.appendChild(div);

  var input = form;
  switch (param.input) {
    case 'checkbox': input = checkbox; break;
    case 'select':   input = select; break;
    case 'radio':    input = radio; break;
    case 'range':    input = range; break;
  }

  input(bind, div, param, value);
}

/**
 * Generates an arbitrary input form element.
 * The input type is controlled via user-provided parameters.
 */
function form(bind, el, param, value) {
  var node = element('input');

  for (var key in param) {
    if (key !== 'signal' && key !== 'element') {
      node.setAttribute(key === 'input' ? 'type' : key, param[key]);
    }
  }
  node.setAttribute('name', param.signal);
  node.value = value;

  el.appendChild(node);

  node.addEventListener('input', function() {
    bind.update(node.value);
  });

  bind.elements = [node];
  bind.set = function(value) { node.value = value; };
}

/**
 * Generates a checkbox input element.
 */
function checkbox(bind, el, param, value) {
  var attr = {type: 'checkbox', name: param.signal};
  if (value) attr.checked = true;
  var node = element('input', attr);

  el.appendChild(node);

  node.addEventListener('change', function() {
    bind.update(node.checked);
  });

  bind.elements = [node];
  bind.set = function(value) { node.checked = !!value || null; }
}

/**
 * Generates a selection list input element.
 */
function select(bind, el, param, value) {
  var node = element('select', {name: param.signal});

  param.options.forEach(function(option) {
    var attr = {value: option};
    if (valuesEqual(option, value)) attr.selected = true;
    node.appendChild(element('option', attr, option+''));
  });

  el.appendChild(node);

  node.addEventListener('change', function() {
    bind.update(param.options[node.selectedIndex]);
  });

  bind.elements = [node];
  bind.set = function(value) {
    for (var i=0, n=param.options.length; i<n; ++i) {
      if (valuesEqual(param.options[i], value)) {
        node.selectedIndex = i; return;
      }
    }
  };
}

/**
 * Generates a radio button group.
 */
function radio(bind, el, param, value) {
  var group = element('span', {'class': RadioClass});

  el.appendChild(group);

  bind.elements = param.options.map(function(option) {
    var id = OptionClass + param.signal + '-' + option;

    var attr = {
      id:    id,
      type:  'radio',
      name:  param.signal,
      value: option
    };
    if (valuesEqual(option, value)) attr.checked = true;

    var input = element('input', attr);

    input.addEventListener('change', function() {
      bind.update(option);
    });

    group.appendChild(input);
    group.appendChild(element('label', {'for': id}, option+''));

    return input;
  });

  bind.set = function(value) {
    var nodes = bind.elements,
        i = 0,
        n = nodes.length;
    for (; i<n; ++i) {
      if (valuesEqual(nodes[i].value, value)) nodes[i].checked = true;
    }
  };
}

/**
 * Generates a slider input element.
 */
function range(bind, el, param, value) {
  value = value !== undefined ? value : ((+param.max) + (+param.min)) / 2;

  var min = param.min || Math.min(0, +value) || 0,
      max = param.max || Math.max(100, +value) || 100,
      step = param.step || tickStep(min, max, 100);

  var node = element('input', {
    type:  'range',
    name:  param.signal,
    min:   min,
    max:   max,
    step:  step
  });
  node.value = value;

  var label = element('label', {}, +value);

  el.appendChild(node);
  el.appendChild(label);

  function update() {
    label.textContent = node.value;
    bind.update(+node.value);
  }

  // subscribe to both input and change
  node.addEventListener('input', update);
  node.addEventListener('change', update);

  bind.elements = [node];
  bind.set = function(value) {
    node.value = value;
    label.textContent = value;
  };
}

function valuesEqual(a, b) {
  return a === b || (a+'' === b+'');
}
