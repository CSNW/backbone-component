import { isString, isFunction } from 'underscore';
import { registerHelper, SafeString } from 'handlebars';
import { isObservable, getValue } from './observable';
import Binding from './binding';
import Computed from './computed';

function placeholder(id) {
  return new SafeString('<script data-placeholder="' + id + '"></script>');
}

function outlet() {
  return new SafeString('<script data-outlet></script>');
}

function render(view, subview, context, options) {
  if (!context) {
    options = subview;
    context = this;
    subview = view;
    view = this;
  } else if (!options) {
    options = context;
    context = this;
  }

  if (isFunction(subview)) {
    return new SafeString(subview(context));
  }

  view._rendered[subview.cid] = subview;

  return placeholder(subview.cid);
}

function get(model, ...keys) {
  const options = keys.pop();
  model = getValue(model);

  if (!model) {
    return undefined;
  }
  if (!keys.length) {
    return model;
  }

  return keys.reduce((memo, key) => {
    memo = getValue(memo);
    if (!memo) return undefined;

    if (memo.get) {
      return memo.get(key);
    } else {
      return memo[key];
    }
  }, model);
}

function bound(model, key) {
  if (!isString(key)) {
    key = undefined;
  }

  return new Binding(model, key);
}

function oneway(model, key) {
  return new Binding(model, key, { oneway: true });
}

function computed(binding, fn) {
  if (!isObservable(binding)) return fn(binding);

  return new Computed(binding, fn);
}

function eq(a, b) {
  return a == b;
}

function not(value) {
  if (!isObservable(value)) return !value;
  return computed(value, value => !value);
}

function array() {
  // Remove options from arguments
  const items = Array.prototype.slice.call(arguments, 0, -1);
  return items;
}

function object(options) {
  return (options && options.hash) || {};
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
