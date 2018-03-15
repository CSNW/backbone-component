import { extend, unique, isFunction } from 'underscore';
import { Events } from 'backbone';
import { bound, isBinding, getValue } from './binding';

const noop = () => {};

export default function Computed(model, keys, fn) {
  let args;
  if (!fn) {
    fn = keys;
    args = !model ? [] : (!Array.isArray(model) ? [model] : model);
  } else {
    if (!Array.isArray(keys)) keys = [];
    args = keys.map(key => bound(model, key));
  }

  const values = args.map(getValue);
  let get, set;
  if (isFunction(fn)) {
    get = () => fn.apply(null, values);
    set = noop;
  } else {
    get = () => fn.get.apply(null, values);
    set = value => fn.set(value);
  }

  let result = get();
  this.get = () => result;
  this.set = set;

  let models = [];
  const bindings = [];

  args.forEach((binding, index) => {
    if (!isBinding(binding)) return;    

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

export function computed(model, keys, fn) {
  return new Computed(model, keys, fn);
}
