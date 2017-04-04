import {
  extend,
  isFunction,
} from 'underscore';
import {
  Events,
} from 'backbone';

export default function Computed(model, keys, fn, options) {
  let events;
  let has_cached = false;
  let cached;

  if (isFunction(keys)) {
    options = fn;
    fn = keys;
    events = 'change';
  } else if (Array.isArray(keys)) {
    events = keys.map(key => `change:${key}`).join(' ');  
  } else {
    events = keys.split(' ').map(key => `change:${key}`).join(' ');
  }

  // For now, cache is opt-in
  const should_cache = options && options.cache;

  // TODO Ran into issues when computed is updated, but bound in component initialize
  // Needs deeper fix with bindings in component.update to alleviate
  
  this.get = () => {
    if (!has_cached || !should_cache) {
      cached = fn();
      has_cached = true;
    }

    return cached;
  };

  this.listenTo(model, events, () => {
    cached = fn();
    has_cached = true;

    this.trigger('change', cached);
  });
}

extend(Computed.prototype, Events, {_binding: true});
