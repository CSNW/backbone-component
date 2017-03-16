import {
  extend,
} from 'underscore';
import {
  Events,
} from 'backbone';

const noop = () => {};

export default function Binding(model, key, options = {}) {
  const {
    oneway = false,
  } = options;

  this.get = () => {
    return key ? model.get(key) : model.attributes;
  };
  this.set = oneway ? noop : (value) => {
    return key ? model.set(key, value) : model.set(value);
  };

  this.listenTo(model, key ? `change:${key}` : 'change', () => {
    this.trigger('change', this.get());
  });
}

extend(Binding.prototype, Events, {_binding: true});

export function isBinding(binding) {
  return !!(binding && binding._binding);
}

export function getValue(binding) {
  return isBinding(binding) ? binding.get() : binding;
}

export function setValue(binding, value) {
  return isBinding(binding) && binding.set(value);
}
