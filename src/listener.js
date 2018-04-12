import { extend, unique } from 'underscore';
import { Events } from 'backbone';
import { isObservable } from './observable';

const noop = () => {};

export default function Listener(model, keys) {
  let sources = [];
  let models = [];
  let bindings = [];

  // Overload arguments:
  if (keys) {
    // (model, key(s))
    if (!Array.isArray(keys)) keys = [keys];
    const events = keys.map(key => `change:${key}`).join(' ');

    models.push(model);
    sources.push([model, events]);
  } else {
    // (Array<model | binding>)
    if (!Array.isArray(model)) model = [model];

    model.forEach(binding => {
      if (!isObservable(binding)) {
        models.push(binding);
      } else {
        const { model, models: _models } = binding._binding;
        if (model) {
          models.push(model);
        } else if (_models) {
          models = models.concat(_models);
        }
        bindings.push(binding);
      }

      sources.push([binding, 'change']);
    });
  }

  this.get = noop;
  this.set = noop;

  sources.forEach(([source, events]) => {
    this.listenTo(source, events, () => this.trigger('change'));
  });

  this._binding = { type: 'listener', models: unique(models), bindings };
}

extend(Listener.prototype, Events);

export function listener(model, keys) {
  return new Listener(model, keys);
}
