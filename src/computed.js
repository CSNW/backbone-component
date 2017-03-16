import {
  extend,
  isFunction,
} from 'underscore';
import {
  Events,
} from 'backbone';

export default function Computed(model, keys, fn) {
  var events;
  if (isFunction(keys)) {
    fn = keys;
    events = 'change';
  } else if (Array.isArray(keys)) {
    events = keys.map(key => `change:${key}`).join(' ');  
  } else {
    events = 'change:' + keys;
  }  

  // TODO Caching
  // Ran into issues when computed is updated, but bound in component initialize
  // Needs deeper fix with bindings in component.update to alleviate
  this.get = () => fn();

  this.listenTo(model, events, () => {
    this.trigger('change', this.get());
  });
}

extend(Computed.prototype, Events, {_binding: true});
