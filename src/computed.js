import { extend, unique } from 'underscore';
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
  let result = fn(values);

  this.get = () => result;
  this.set = noop;

  let models = [];
  const bindings = [];

  args.forEach((binding, index) => {
    if (!isBinding(binding)) return;    

    if (binding._binding.model) {
      models.push(binding._binding.model);
    } else if (binding._binding.models) {
      models = models.concat(binding._binding.models);
    }
    bindings.push(binding);

    this.listenTo(binding, 'change', () => {
      values[index] = getValue(binding);
      result = fn(values);

      this.trigger('change', result);
    });
  });

  this._binding = { type: 'computed', models: unique(models), bindings };
}

extend(Computed.prototype, Events);

export function computed(model, keys, fn) {
  return new Computed(model, keys, fn);
}
