/*!
 * backbone-component - Backbone + Handlebars components
 * v0.4.0-beta.1 - https://github.com/CSNW/backbone-component - @license: MIT
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('underscore'), require('backbone'), require('handlebars')) :
	typeof define === 'function' && define.amd ? define(['exports', 'underscore', 'backbone', 'handlebars'], factory) :
	(factory((global.BackboneComponent = {}),global._,global.Backbone,global.Handlebars));
}(this, (function (exports,underscore,backbone,handlebars) { 'use strict';

var noop = function () {};

function Binding(model, key, options) {
  var this$1 = this;
  if ( options === void 0 ) options = {};

  var oneway = options.oneway; if ( oneway === void 0 ) oneway = false;

  this.get = function () { return (key ? model.get(key) : model.attributes); };
  this.set = oneway
    ? noop
    : function (value, options) {
        return key ? model.set(key, value, options) : model.set(value, options);
      };

  this.listenTo(model, key ? ("change:" + key) : 'change', function () {
    this$1.trigger('change', this$1.get());
  });

  this._binding = { type: oneway ? 'oneway' : 'binding', model: model, key: key };
}

underscore.extend(Binding.prototype, backbone.Events);

function isBinding(binding) {
  return !!(binding && binding._binding);
}

function getValue(binding) {
  return isBinding(binding) ? binding.get() : binding;
}

function setValue(binding, value) {
  return isBinding(binding) && binding.set(value);
}

function bound(model, key) {
  return new Binding(model, key);
}

function oneway(model, key) {
  return new Binding(model, key, { oneway: true });
}

var noop$1 = function () {};

function Computed(args, fn) {
  var this$1 = this;

  if (!args) { args = []; }
  if (!Array.isArray(args)) { args = [args]; }

  var values = args.map(getValue);
  var result = fn(values);

  this.get = function () { return result; };
  this.set = noop$1;

  var models = [];
  var bindings = [];

  args.forEach(function (binding, index) {
    if (!isBinding(binding)) { return; }    

    if (binding._binding.model) {
      models.push(binding._binding.model);
    } else if (binding._binding.models) {
      models = models.concat(binding._binding.models);
    }
    bindings.push(binding);

    this$1.listenTo(binding, 'change', function () {
      values[index] = getValue(binding);
      result = fn(values);

      this$1.trigger('change', result);
    });
  });

  this._binding = { type: 'computed', models: underscore.unique(models), bindings: bindings };
}

underscore.extend(Computed.prototype, backbone.Events);

function computed(bindings, fn) {
  return new Computed(bindings, fn);
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

function get(model, key) {
  model = getValue(model);

  if (!underscore.isString(key) || !model) {
    return model;
  }

  if (model.get) {
    return model.get(key);
  } else {
    return model[key];
  }
}

function bound$1(model, key) {
  if (!underscore.isString(key)) {
    key = undefined;
  }

  return new Binding(model, key);
}

function oneway$1(model, key) {
  return new Binding(model, key, {oneway: true});
}

function computed$1(binding, fn) {
  if (!isBinding(binding))
    { return fn(binding); }

  return new Computed(binding, fn);
}

function eq(a, b) {
  return a == b;
}

function not(value) {
  return !value;
}

function array() {
  // Remove options from arguments
  var items = Array.prototype.slice.call(arguments, 0, -1);
  return items;
}

function object(options) {
  return options && options.hash || {};
}

handlebars.registerHelper('placeholder', placeholder);
handlebars.registerHelper('outlet', outlet);
handlebars.registerHelper('render', render);
handlebars.registerHelper('get', get);
handlebars.registerHelper('bound', bound$1);
handlebars.registerHelper('oneway', oneway$1);
handlebars.registerHelper('computed', computed$1);
handlebars.registerHelper('eq', eq);
handlebars.registerHelper('not', not);
handlebars.registerHelper('array', array);
handlebars.registerHelper('object', object);

// TODO This could use intelligent grouping to group listening and setting by underlying model

var BoundModel = backbone.Model.extend({
  constructor: function BoundModel(values, options) {
    if ( values === void 0 ) values = {};

    var toConnect = {};
    underscore.each(values, function (key, value) {
      if (!isBinding(value)) { return; }

      toConnect[key] = value;
      values[key] = getValue(value);
    });

    backbone.Model.call(this, values, options);

    this._bindings = {};
    this.connect(toConnect);
  },

  set: function set(key, value, options) {
    var this$1 = this;

    options = underscore.isString(key) ? options : value;
    var setBinding = function (key, value) {
      if (!this$1._bindings[key]) { return; }

      // Set silently for bindings on this model
      var ref = this$1._bindings[key];
      var binding = ref.binding;
      var internal = ref.internal;
      var silent = (options && options.silent) || internal;

      binding.set(value, { silent: silent });
    };

    // Set binding(s)
    if (underscore.isString(key)) {
      setBinding(key, value);
    } else {
      underscore.each(key, function (value, key) { return setBinding(key, value); });
    }

    return backbone.Model.prototype.set.call(this, values, options);
  },

  connect: function connect(key, binding) {
    var this$1 = this;

    var addBinding = function (key, binding) {
      if (!isBinding(binding)) {
        backbone.Model.prototype.set.call(this$1, key, binding, { silent: true });
        return;
      }

      // Check if already bound and stop listening for mismatch
      if (this$1._bindings[key]) {
        var existing = this$1._bindings[key].binding;
        if (existing === binding) { return; }

        this$1.stopListening(existing);
      }

      var ref = binding._binding;
      var model = ref.model;
      var models = ref.models;
      var internal = model === this$1 || every(models, function (model) { return model === this$1; });
      this$1._bindings[key] = { binding: binding, internal: internal };

      this$1.listenTo(binding, 'change', function () {
        backbone.Model.prototype.set.call(this$1, key, getValue(binding));
      });

      backbone.Model.prototype.set.call(this$1, key, getValue(binding), { silent: true });
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
    // Create props and state before initialize is called
    this.props =
      options.props && underscore.isFunction(options.props.set)
        ? options.props
        : new BoundModel(options.props || {});
    this.state = new BoundModel();

    backbone.View.call(this, options);

    this._components = {};
  },

  render: function render() {
    var this$1 = this;

    // First, mark all components for removal and clean subview rendering slate
    // (added components will remove this mark)
    underscore.each(this._components, function (component) {
      component._to_be_removed = true;
    });
    this._rendered = {};

    var data = this.templateData();
    var html = this.template(data);
    this.$el.html(html);

    // Render active components and remove inactive
    underscore.each(this._components, function (component, id) {
      if (component._to_be_removed) {
        component.remove();
        delete this$1._components[id];
        return;
      }

      this$1.$('[data-placeholder="' + id + '"]').replaceWith(component.el);
      component.render();
    });

    // Render active subviews
    underscore.each(this._rendered, function (view, id) {
      this$1.$('[data-placeholder="' + id + '"]').replaceWith(view.el);
      view.render();
    });

    this.delegateEvents();

    return this;
  },

  templateData: function templateData() {
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
    underscore.each(this._components, function (component) {
      component.remove();
    });
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
      var this$1 = this;

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

        this$1.$('[data-placeholder="' + id + '"]').replaceWith(component.el);
        component.render();
      });

      // Render active subviews
      underscore.each(this._rendered, function (view, id) {
        this$1.$('[data-placeholder="' + id + '"]').replaceWith(view.el);
        view.render();
      });

      return this;
    },

    update: function update(props) {
      this.props.connect(underscore.defaults(props, underscore.result(this, 'defaultProps')));
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
        var data = options.fn && options.data ? handlebars.createFrame(options.data) : {};

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
    var this$1 = this;

    if (this.model) {
      this.listenTo(this.model, 'change', this.render);
    }
    if (this.props.binding) {
      this.listenTo(this.props.binding, 'change', this.render);
    }

    this.props.bindings.forEach(function (binding) {
      this$1.listenTo(binding, 'change', this$1.render);
    });
  },

  render: function render() {
    var style = this.props.style;
    if (this.props.inline) {
      style = "display: inline-block;" + (style ? (" " + style) : '');
    }

    this.$el.attr('style', style);
    this.$el.removeClass().addClass(this.props.className || this.props.class);

    Component.prototype.render.call(this);
    return this;
  }
});

Region.registerAs('region');

var version = "0.4.0-beta.1";

exports.Binding = Binding;
exports.bound = bound;
exports.oneway = oneway;
exports.isBinding = isBinding;
exports.getValue = getValue;
exports.setValue = setValue;
exports.Computed = Computed;
exports.computed = computed;
exports.BoundModel = BoundModel;
exports.View = View;
exports.Component = Component;
exports.VERSION = version;

Object.defineProperty(exports, '__esModule', { value: true });

})));
