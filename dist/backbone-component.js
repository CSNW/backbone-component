/*!
 * backbone-component - Backbone + Handlebars components
 * v0.5.13 - https://github.com/CSNW/backbone-component - @license: MIT
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('underscore'), require('handlebars'), require('backbone')) :
  typeof define === 'function' && define.amd ? define(['exports', 'underscore', 'handlebars', 'backbone'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.BackboneComponent = {}, global._, global.Handlebars, global.Backbone));
})(this, (function (exports, underscore, handlebars, backbone) { 'use strict';

  function Observable(value) {
    var this$1$1 = this;

    this.get = function () { return value; };
    this.set = function (_value) {
      value = _value;
      this$1$1.trigger('change', value);
    };

    this._binding = { type: 'observable', models: [] };
  }
  underscore.extend(Observable.prototype, backbone.Events);

  function observable(value) {
    return new Observable(value);
  }

  function isObservable(binding) {
    return !!(binding && binding._binding);
  }

  function getValue(binding) {
    return isObservable(binding) ? binding.get() : binding;
  }

  function setValue(binding, value) {
    return isObservable(binding) && binding.set(value);
  }

  var noop$3 = function () {};

  var cache = (function () {
    if (typeof WeakMap === 'undefined') { return { get: noop$3, set: noop$3 }; }

    var cache = new WeakMap();
    return {
      get: function get(model, key) {
        return cache.has(model) && cache.get(model)[key];
      },
      set: function set(model, key, value) {
        if (!cache.has(model)) { cache.set(model, {}); }
        cache.get(model)[key] = value;
      }
    };
  })();

  function Binding(model, key, options) {
    var this$1$1 = this;
    if ( options === void 0 ) options = {};

    if (!model) {
      throw new Error('No model passed to Binding');
    }

    var cached = cache.get(model, key);
    if (cached) { return cached; }

    var oneway = options.oneway; if ( oneway === void 0 ) oneway = false;

    this.get = function () { return (key ? model.get(key) : model.attributes); };
    this.set = oneway
      ? noop$3
      : function (value, options) {
          return key ? model.set(key, value, options) : model.set(value, options);
        };

    this.listenTo(model, key ? ("change:" + key) : 'change', function (_1, _2, options) {
      this$1$1.trigger('change', this$1$1.get(), options);
    });

    this._binding = { type: oneway ? 'oneway' : 'binding', model: model, key: key };
    cache.set(model, key, this);
  }

  underscore.extend(Binding.prototype, backbone.Events);

  function bound$1(model, key) {
    return new Binding(model, key);
  }

  function oneway$1(model, key) {
    return new Binding(model, key, { oneway: true });
  }

  var noop$2 = function () {};

  function Computed(model, key, fn) {
    var this$1$1 = this;

    // Overload argments:
    var args;
    if (underscore.isString(key)) {
      // (model, key, fn)
      args = [bound$1(model, key)];
    } else if (Array.isArray(key)) {
      // (model, keys, fn)
      args = key.map(function (key) { return bound$1(model, key); });
    } else if (!Array.isArray(model) && !isObservable(model)) {
      // (model, fn)
      fn = key;
      args = [bound$1(model)];
    } else {
      // (binding(s), fn)
      fn = key;
      args = !model ? [] : !Array.isArray(model) ? [model] : model;
    }

    var values = args.map(getValue);
    var initialized = false;
    var get, set, result;
    if (underscore.isFunction(fn)) {
      get = function () { return fn.apply(null, values); };
      set = noop$2;
    } else {
      get = function () { return fn.get.apply(null, values); };
      set = function (value) { return (result = fn.set(value)); };
    }

    this.get = function () {
      if (!initialized) {
        initialized = true;
        result = get();
      }

      return result;
    };
    this.set = set;

    var models = [];
    var bindings = [];

    args.forEach(function (binding, index) {
      if (!isObservable(binding)) { return; }

      var ref = binding._binding;
      var model = ref.model;
      var _models = ref.models;
      if (model) {
        models.push(model);
      } else if (_models) {
        models = models.concat(_models);
      }
      bindings.push(binding);

      this$1$1.listenTo(binding, 'change', function () {
        values[index] = getValue(binding);
        result = get();

        this$1$1.trigger('change', result);
      });
    });

    this._binding = { type: 'computed', models: underscore.unique(models), bindings: bindings };
  }

  underscore.extend(Computed.prototype, backbone.Events);

  function computed$1(model, key, fn) {
    return new Computed(model, key, fn);
  }

  function placeholder(id) {
    return new handlebars.SafeString('<script data-placeholder="' + id + '"></script>');
  }

  function outlet() {
    return new handlebars.SafeString('<script data-outlet></script>');
  }

  function render(view, subview, context, options) {
    if (!context) {
      options = subview;
      context = this;
      subview = view;
      view = this;
    } else if (!options) {
      options = context;
      context = this;
    }

    if (underscore.isFunction(subview)) {
      return new handlebars.SafeString(subview(context));
    }

    view._rendered[subview.cid] = subview;

    return placeholder(subview.cid);
  }

  function get(model) {
    var keys = [], len = arguments.length - 1;
    while ( len-- > 0 ) keys[ len ] = arguments[ len + 1 ];

    keys.pop();
    model = getValue(model);

    if (!keys.length) {
      return model;
    }
    if (!model) {
      return undefined;
    }

    return keys.reduce(function (memo, key) {
      memo = getValue(memo);
      if (!memo) { return undefined; }

      if (memo.get) {
        return memo.get(key);
      } else {
        return memo[key];
      }
    }, model);
  }

  function bound(model, key) {
    if (!underscore.isString(key)) {
      key = undefined;
    }

    return new Binding(model, key);
  }

  function oneway(model, key) {
    return new Binding(model, key, { oneway: true });
  }

  function computed(binding, fn) {
    if (!isObservable(binding)) { return fn(binding); }

    return new Computed(binding, fn);
  }

  function eq(a, b) {
    return a == b;
  }

  function not(value) {
    if (!isObservable(value)) { return !value; }
    return computed(value, function (value) { return !value; });
  }

  function array() {
    // Remove options from arguments
    var items = Array.prototype.slice.call(arguments, 0, -1);
    return items;
  }

  function object(options) {
    return (options && options.hash) || {};
  }

  handlebars.registerHelper('placeholder', placeholder);
  handlebars.registerHelper('outlet', outlet);
  handlebars.registerHelper('render', render);
  handlebars.registerHelper('get', get);
  handlebars.registerHelper('bound', bound);
  handlebars.registerHelper('oneway', oneway);
  handlebars.registerHelper('computed', computed);
  handlebars.registerHelper('eq', eq);
  handlebars.registerHelper('not', not);
  handlebars.registerHelper('array', array);
  handlebars.registerHelper('object', object);

  // TODO This could use intelligent grouping to group listening and setting by underlying model

  var BoundModel = backbone.Model.extend({
    constructor: function BoundModel(values, options) {
      if ( values === void 0 ) values = {};

      var toConnect = {};
      underscore.each(values, function (value, key) {
        if (!isObservable(value)) { return; }

        toConnect[key] = value;
        values[key] = getValue(value);
      });

      this._bindings = {};

      backbone.Model.call(this, values, options);
      this.connect(toConnect);
    },

    set: function set(key, value, options) {
      var this$1$1 = this;

      options = underscore.isString(key) ? options : value;
      var setBinding = function (key, value) {
        if (!this$1$1._bindings[key]) { return; }

        // Set silently for bindings on this model
        var ref = this$1$1._bindings[key];
        var binding = ref.binding;
        var internal = ref.internal;
        var silent = (options && options.silent) || internal;

        binding.set(value, underscore.assign(options, { silent: silent }));
      };

      // Set binding(s)
      if (underscore.isString(key)) {
        setBinding(key, value);
      } else {
        underscore.each(key, function (value, key) { return setBinding(key, value); });
      }

      return backbone.Model.prototype.set.call(this, key, value, options);
    },

    connect: function connect(key, binding) {
      var this$1$1 = this;

      var addBinding = function (key, binding) {
        if (!isObservable(binding)) {
          backbone.Model.prototype.set.call(this$1$1, key, binding, { silent: true });
          return;
        }

        // Check if already bound and stop listening for mismatch
        if (this$1$1._bindings[key]) {
          var existing = this$1$1._bindings[key].binding;
          if (existing === binding) { return; }

          this$1$1.stopListening(existing);
        }

        var ref = binding._binding;
        var model = ref.model;
        var models = ref.models;
        var internal = model
          ? model === this$1$1
          : underscore.every(models, function (model) { return model === this$1$1; });
        this$1$1._bindings[key] = { binding: binding, internal: internal };

        this$1$1.listenTo(binding, 'change', function (_, options) {
          backbone.Model.prototype.set.call(this$1$1, key, getValue(binding), options);
        });

        backbone.Model.prototype.set.call(this$1$1, key, getValue(binding), { silent: true });
      };

      if (underscore.isString(key)) {
        addBinding(key, binding);
      } else {
        underscore.each(key, function (binding, key) { return addBinding(key, binding); });
      }
    }
  });

  var View = backbone.View.extend({
    constructor: function View(options) {
      this.state = new BoundModel();

      backbone.View.call(this, options);
      this._components = {};
    },

    render: function render() {
      var this$1$1 = this;

      // First, mark all components for removal and clean subview rendering slate
      // (added components will remove this mark)
      underscore.each(this._components, function (component) {
        component._to_be_removed = true;
      });
      this._rendered = {};

      var data = this.templateData();
      // Second argument allows view to pass handlebars runtime options such as allowedProtoMethods and allowedProtoProperties
      // https://handlebarsjs.com/api-reference/runtime-options.html#options-to-control-prototype-access
      var html = this.template(data, data.handlebarsRuntimeOptions);
      this.$el.html(html);

      // Render active components and remove inactive
      underscore.each(this._components, function (component, id) {
        if (component._to_be_removed) {
          component.remove();
          delete this$1$1._components[id];
          return;
        }

        this$1$1.$('[data-placeholder="' + id + '"]').replaceWith(component.el);
        component.render();
      });

      // Render active subviews
      underscore.each(this._rendered, function (view, id) {
        this$1$1.$('[data-placeholder="' + id + '"]').replaceWith(view.el);
        view.render();
      });

      this.delegateEvents();

      return this;
    },

    templateData: function templateData() {
      // TODO Think about passing JS values of state, props, model, and collection
      // e.g. (get state "key") -> state.key
      //
      // could add __underlying key for use with binding

      return this;
    },
    template: function template() {
      return '';
    },

    delegateEvents: function delegateEvents() {
      backbone.View.prototype.delegateEvents.call(this);
      underscore.each(this._components, function (component) {
        component.delegateEvents();
      });
      underscore.each(this._rendered, function (view) {
        view.delegateEvents();
      });
    },

    remove: function remove() {
      backbone.View.prototype.remove.call(this);

      underscore.each(this._components, function (component) {
        component.remove();
      });

      this.state.stopListening();
    }
  });

  var Component = View.extend(
    {
      defaultProps: {},

      constructor: function Component(options) {
        if ( options === void 0 ) options = {};

        this.props = new BoundModel();
        this.state = new BoundModel();

        this.update(options.props);

        // Pass model and collection through directly to view
        // (there are other properties that could be set directly, but they are less intuitive)
        if (options.props.model && !options.model)
          { options.model = options.props.model; }
        if (options.props.collection && !options.collection)
          { options.collection = options.props.collection; }

        View.call(this, options);
      },

      render: function render() {
        var this$1$1 = this;

        View.prototype.render.apply(this, arguments);

        // Render children to outlet (if specified)
        var children = this.props.get('children');
        if (children) {
          this.$('[data-outlet]').replaceWith(children());
        }

        // If component has child components, they may have been in outlet,
        underscore.each(this._components, function (component, id) {
          if (component._to_be_removed) {
            // (already removed by View render)
            return;
          }

          this$1$1.$('[data-placeholder="' + id + '"]').replaceWith(component.el);
          component.render();
        });

        // Render active subviews
        underscore.each(this._rendered, function (view, id) {
          this$1$1.$('[data-placeholder="' + id + '"]').replaceWith(view.el);
          view.render();
        });

        return this;
      },

      update: function update(props) {
        this.props.connect(underscore.defaults(props, underscore.result(this, 'defaultProps')));
      },

      remove: function remove() {
        View.prototype.remove.call(this);

        // Force teardown of props and state
        this.props.stopListening();
        this.state.stopListening();
      }
    },
    {
      registerAs: function(name) {
        var Type = this;
        handlebars.registerHelper(name, function(id, view, options) {
          if (!view) {
            options = id;
            view =
              (options && options.data && options.data.parent_component) || this;
            id = underscore.uniqueId(name);
          }
          if (!options) {
            options = view;
            view =
              (options && options.data && options.data.parent_component) || this;
          }
          options = options || {};

          var context = this;
          var props = underscore.extend(
            {
              id: id,
              children: children
            },
            options.hash || {}
          );
          var data =
            options.fn && options.data ? handlebars.createFrame(options.data) : {};

          var component = view._components[id];
          if (!component) { component = view._components[id] = new Type({ props: props }); }
          else { component.update(props); }

          component._to_be_removed = false;
          data.parent_component = component;

          return handlebars.helpers.placeholder(id);

          function children() {
            var html =
              options.fn &&
              options.fn(context, { data: data, blockParams: [component] });

            if (isSafestring(html)) { return html.string; }

            return html;
          }
        });
      }
    }
  );

  function isSafestring(value) {
    if (!value || underscore.isString(value)) { return false; }

    return 'string' in value;
  }

  var Region = Component.extend({
    defaultProps: {
      binding: null,
      bindings: [],
      class: '',
      style: '',
      inline: false
    },
    template: function () { return '<script data-outlet></script>'; },

    initialize: function initialize() {
      var this$1$1 = this;

      if (this.model) {
        this.listenTo(this.model, 'change', this.render);
      }

      this.listenTo(this.props, 'change:binding', this.render);
      this.props.get('bindings').forEach(function (binding) {
        this$1$1.listenTo(binding, 'change', this$1$1.render);
      });
    },

    render: function render() {
      var style = this.props.style;
      if (this.props.get('inline')) {
        style = "display: inline-block;" + (style ? (" " + style) : '');
      }

      this.$el.attr('style', style);
      this.$el.removeClass().addClass(this.props.get('class'));

      Component.prototype.render.call(this);
      return this;
    }
  });

  Region.registerAs('region');

  var noop$1 = function () {};

  function Listener(model, keys) {
    var this$1$1 = this;

    var sources = [];
    var models = [];
    var bindings = [];

    // Overload arguments:
    if (keys) {
      // (model, key(s))
      if (!Array.isArray(keys)) { keys = [keys]; }
      var events = keys.map(function (key) { return ("change:" + key); }).join(' ');

      models.push(model);
      sources.push([model, events]);
    } else {
      // (Array<model | binding>)
      if (!Array.isArray(model)) { model = [model]; }

      model.forEach(function (binding) {
        if (!isObservable(binding)) {
          models.push(binding);
        } else {
          var ref = binding._binding;
          var model = ref.model;
          var _models = ref.models;
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

    this.get = noop$1;
    this.set = noop$1;

    sources.forEach(function (ref) {
      var source = ref[0];
      var events = ref[1];

      this$1$1.listenTo(source, events, function () { return this$1$1.trigger('change'); });
    });

    this._binding = { type: 'listener', models: underscore.unique(models), bindings: bindings };
  }

  underscore.extend(Listener.prototype, backbone.Events);

  function listener(model, keys) {
    return new Listener(model, keys);
  }

  var noop = function () {};

  function Resolved(binding) {
    var this$1$1 = this;

    var current;
    var handle = function (value) {
      return Promise.resolve(value).then(
        function (result) {
          current = result;
          this$1$1.trigger('change', current);
        },
        function (error) {
          this$1$1.trigger('error', error);
        }
      );
    };

    handle(getValue(binding));

    this.get = function () { return current; };
    this.set = noop;

    var models = [];
    if (isObservable(binding)) {
      if (binding._binding.model) { models = [binding._binding.model]; }
      else if (binding._binding.models) { models = binding._binding.models; }

      this.listenTo(binding, 'change', function () {
        handle(getValue(binding));
      });
    }

    this._binding = { type: 'resolved', models: models };
  }
  underscore.extend(Resolved.prototype, backbone.Events);

  function resolved(value) {
    return new Resolved(value);
  }

  var version = "0.5.13";

  exports.Binding = Binding;
  exports.BoundModel = BoundModel;
  exports.Component = Component;
  exports.Computed = Computed;
  exports.Listener = Listener;
  exports.Observable = Observable;
  exports.Resolved = Resolved;
  exports.VERSION = version;
  exports.View = View;
  exports.bound = bound$1;
  exports.computed = computed$1;
  exports.getValue = getValue;
  exports.isObservable = isObservable;
  exports.listener = listener;
  exports.observable = observable;
  exports.oneway = oneway$1;
  exports.resolved = resolved;
  exports.setValue = setValue;

}));
