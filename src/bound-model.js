import { isString, each } from 'underscore';
import { Model } from 'backbone';
import { isBinding, getValue } from './binding';

// TODO This could use intelligent grouping to group listening and setting by underlying model

export default Model.extend({
  constructor: function BoundModel(values = {}, options) {
    const toConnect = {};
    each(values, (key, value) => {
      if (!isBinding(value)) return;

      toConnect[key] = value;
      values[key] = getValue(value);
    });

    Model.call(this, values, options);

    this._bindings = {};
    this.connect(toConnect);
  },

  set(key, value, options) {
    options = isString(key) ? options : value;
    const setBinding = (key, value) => {
      if (!this._bindings[key]) return;

      // Set silently for bindings on this model
      const { binding, internal } = this._bindings[key];
      const silent = (options && options.silent) || internal;

      binding.set(value, { silent });
    };

    // Set binding(s)
    if (isString(key)) {
      setBinding(key, value);
    } else {
      each(key, (value, key) => setBinding(key, value));
    }

    return Model.prototype.set.call(this, values, options);
  },

  connect(key, binding) {
    const addBinding = (key, binding) => {
      if (!isBinding(binding)) {
        Model.prototype.set.call(this, key, binding, { silent: true });
        return;
      }

      // Check if already bound and stop listening for mismatch
      if (this._bindings[key]) {
        const existing = this._bindings[key].binding;
        if (existing === binding) return;

        this.stopListening(existing);
      }

      const { model, models } = binding._binding;
      const internal = model === this || every(models, model => model === this);
      this._bindings[key] = { binding, internal };

      this.listenTo(binding, 'change', () => {
        Model.prototype.set.call(this, key, getValue(binding));
      });

      Model.prototype.set.call(this, key, getValue(binding), { silent: true });
    };

    if (isString(key)) {
      addBinding(key, binding);
    } else {
      each(key, (binding, key) => addBinding(key, binding));
    }
  }
});
