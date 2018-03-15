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
