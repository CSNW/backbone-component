import {
  isString,
} from 'underscore';
import {
  registerHelper,
  SafeString,
} from 'handlebars';
import Binding, {
  isBinding,
  getValue,
} from './binding';
import Computed from './computed';

function placeholder(id) {
  return new SafeString('<script data-placeholder="' + id + '"></script>');
}

function outlet() {
  return new SafeString('<script data-outlet></script>');
}

function render(view, subview, options) {
  if (!options) {
    subview = view;
    view = this;
  }

  view._rendered[subview.cid] = subview;

  return placeholder(subview.cid);
}

function get(model, key) {
  model = getValue(model);

  if (!isString(key) || !model) {
    return model;
  }

  if (model.get) {
    return model.get(key);
  } else {
    return model[key];
  }
}

function bound(model, key) {
  if (!isString(key)) {
    key = undefined;
  }

  return new Binding(model, key);
}

function oneway(model, key) {
  return new Binding(model, key, {oneway: true});
}

function computed(binding, fn) {
  if (!isBinding(binding))
    return fn(binding);

  return new Computed(binding, () => fn(binding.get()));
}

function eq(a, b) {
  return a == b;
}

function not(value) {
  return !value;
}

function array() {
  // Remove options from arguments
  const items = Array.prototype.slice.call(arguments, 0, -1);
  return items;
}

function object(options) {
  return options && options.hash || {};
}

registerHelper('placeholder', placeholder);
registerHelper('outlet', outlet);
registerHelper('render', render);
registerHelper('get', get);
registerHelper('bound', bound);
registerHelper('oneway', oneway);
registerHelper('computed', computed);
registerHelper('eq', eq);
registerHelper('not', not);
registerHelper('array', array);
registerHelper('object', object);
