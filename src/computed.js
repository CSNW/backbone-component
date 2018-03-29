import { extend, unique, isFunction, isString } from 'underscore';
import { Events } from 'backbone';
import { isObservable, getValue } from './observable';
import { bound } from './binding';

const noop = () => {};

export default function Computed(model, key, fn) {
  // Overload argments:
  let args;
  if (isString(key)) {
    // (model, key, fn)
    args = [bound(model, key)];
  } else if (Array.isArray(key)) {
    // (model, keys, fn)
    args = key.map(key => bound(model, key));
  } else if (!Array.isArray(model) && !isObservable(model)) {
    // (model, fn)
    fn = key;
    args = [bound(model)];
  } else {
    // (binding(s), fn)
    fn = key;
    args = !model ? [] : !Array.isArray(model) ? [model] : model;
  }

  const values = args.map(getValue);
  let initialized = false;
  let get, set, result;
  if (isFunction(fn)) {
    get = () => fn.apply(null, values);
    set = noop;
  } else {
    get = () => fn.get.apply(null, values);
    set = value => (result = fn.set(value));
  }

  this.get = () => {
    if (!initialized) {
      initialized = true;
      result = get();
    }

    return result;
  };
  this.set = set;

  let models = [];
  const bindings = [];

  args.forEach((binding, index) => {
    if (!isObservable(binding)) return;

    const { model, models: _models } = binding._binding;
    if (model) {
      models.push(model);
    } else if (_models) {
      models = models.concat(_models);
    }
    bindings.push(binding);

    this.listenTo(binding, 'change', () => {
      values[index] = getValue(binding);
      result = get();

      this.trigger('change', result);
    });
  });

  this._binding = { type: 'computed', models: unique(models), bindings };
}

extend(Computed.prototype, Events);

export function computed(model, key, fn) {
  return new Computed(model, key, fn);
}
