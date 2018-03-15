import { extend } from 'underscore';
import { Events } from 'backbone';

const noop = () => {};

export default function Binding(model, key, options = {}) {
  const { oneway = false } = options;

  this.get = () => (key ? model.get(key) : model.attributes);
  this.set = oneway
    ? noop
    : (value, options) => {
        return key ? model.set(key, value, options) : model.set(value, options);
      };

  this.listenTo(model, key ? `change:${key}` : 'change', () => {
    this.trigger('change', this.get());
  });

  this._binding = { type: oneway ? 'oneway' : 'binding', model, key };
}

extend(Binding.prototype, Events);

export function isBinding(binding) {
  return !!(binding && binding._binding);
}

export function getValue(binding) {
  return isBinding(binding) ? binding.get() : binding;
}

export function setValue(binding, value) {
  return isBinding(binding) && binding.set(value);
}

export function bound(model, key) {
  return new Binding(model, key);
}

export function oneway(model, key) {
  return new Binding(model, key, { oneway: true });
}
