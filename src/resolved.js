import { extend } from 'underscore';
import { Events } from 'backbone';
import { isObservable, getValue } from './observable';

const noop = () => {};

export default function Resolved(binding) {
  let current;
  const handle = value => {
    return Promise.resolve(value).then(
      result => {
        current = result;
        this.trigger('change', current);
      },
      error => {
        this.trigger('error', error);
      }
    );
  };

  handle(getValue(binding));

  this.get = () => current;
  this.set = noop;

  let models = [];
  if (isObservable(binding)) {
    if (binding._binding.model) models = [binding._binding.model];
    else if (binding._binding.models) models = binding._binding.models;

    this.listenTo(binding, 'change', () => {
      handle(getValue(binding));
    });
  }

  this._binding = { type: 'resolved', models };
}
extend(Resolved.prototype, Events);

export function resolved(value) {
  return new Resolved(value);
}
