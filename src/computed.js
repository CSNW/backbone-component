import { extend, unique } from 'underscore';
import { Events } from 'backbone';
import { isBinding, getValue } from './binding';

const noop = () => {};

export default function Computed(args, fn) {
  if (!args) args = [];
  if (!Array.isArray(args)) args = [args];

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

export function computed(bindings, fn) {
  return new Computed(bindings, fn);
}
