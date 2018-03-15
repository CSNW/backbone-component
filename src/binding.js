import { extend } from 'underscore';
import { Events } from 'backbone';

const noop = () => {};

const cache = (() => {
  if (typeof WeakMap === 'undefined') return { get: noop, set: noop };

  const cache = new WeakMap();
  return {
    get(model, key) {
      return cache.has(model) && cache.get(model)[key];
    },
    set(model, key, value) {
      if (!cache.has(model)) cache.set(model, {});
      cache.get(model)[key] = value;
    }
  };
})();

const _cache = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

export default function Binding(model, key, options = {}) {
  const cached = cache.get(model, key);
  if (cached) return cached;

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
  cache.set(model, key, this);
}

extend(Binding.prototype, Events);

export function bound(model, key) {
  return new Binding(model, key);
}

export function oneway(model, key) {
  return new Binding(model, key, { oneway: true });
}
