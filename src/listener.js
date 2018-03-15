import { extend } from 'underscore';
import { Events } from 'backbone';

const noop = () => {};

export default function Listener(model, keys) {
  if (keys && !Array.isArray(keys)) keys = [keys];
  const events = !keys ? 'change' : keys.map(key => `change:${key}`).join(' ');

  this.get = noop;
  this.set = noop;
  this.listenTo(model, events, () => this.trigger('change'));

  this._binding = { type: 'listener', model, keys };
}

extend(Listener.prototype, Events);

export function listener(model, keys) {
  return new Listener(model, keys);
}
