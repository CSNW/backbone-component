import { extend } from 'underscore';
import { Events } from 'backbone';

export default function Observable(value) {
  this.get = () => value;
  this.set = _value => {
    value = _value;
    this.trigger('change', value);
  };

  this._binding = { type: 'observable', models: [] };
}
extend(Observable.prototype, Events);

export function observable(value) {
  return new Observable(value);
}

export function isObservable(binding) {
  return !!(binding && binding._binding);
}

export function getValue(binding) {
  return isObservable(binding) ? binding.get() : binding;
}

export function setValue(binding, value) {
  return isObservable(binding) && binding.set(value);
}
