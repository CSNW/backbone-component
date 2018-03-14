/*!
 * backbone-component - Backbone + Handlebars components
 * v0.3.5 - https://github.com/CSNW/backbone-component - @license: MIT
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('underscore'), require('handlebars'), require('backbone')) :
	typeof define === 'function' && define.amd ? define(['exports', 'underscore', 'handlebars', 'backbone'], factory) :
	(factory((global.BackboneComponent = global.BackboneComponent || {}),global._,global.Handlebars,global.Backbone));
}(this, (function (exports,underscore,handlebars,backbone) { 'use strict';

var noop = function () {};

function Binding(model, key, options) {
  var this$1 = this;
  if ( options === void 0 ) options = {};

  var oneway = options.oneway; if ( oneway === void 0 ) oneway = false;

  this.get = function () {
    return key ? model.get(key) : model.attributes;
  };
  this.set = oneway ? noop : function (value) {
    return key ? model.set(key, value) : model.set(value);
  };

  this.listenTo(model, key ? ("change:" + key) : 'change', function () {
    this$1.trigger('change', this$1.get());
  });
}

underscore.extend(Binding.prototype, backbone.Events, {_binding: true});

function isBinding(binding) {
  return !!(binding && binding._binding);
}

function getValue(binding) {
  return isBinding(binding) ? binding.get() : binding;
}

function setValue(binding, value) {
  return isBinding(binding) && binding.set(value);
}

function Computed(model, keys, fn, options) {
  var this$1 = this;

  var events;
  var has_cached = false;
  var cached;

  if (underscore.isFunction(keys)) {
    options = fn;
    fn = keys;
    events = 'change';
  } else if (Array.isArray(keys)) {
    events = keys.map(function (key) { return ("change:" + key); }).join(' ');  
  } else {
    events = keys.split(' ').map(function (key) { return ("change:" + key); }).join(' ');
  }

  // For now, cache is opt-in
  var should_cache = options && options.cache;

  // TODO Ran into issues when computed is updated, but bound in component initialize
  // Needs deeper fix with bindings in component.update to alleviate
  
  this.get = function () {
    if (!has_cached || !should_cache) {
      cached = fn();
      has_cached = true;
    }

    return cached;
  };

  this.listenTo(model, events, function () {
    cached = fn();
    has_cached = true;

    this$1.trigger('change', cached);
  });
}

underscore.extend(Computed.prototype, backbone.Events, {_binding: true});

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

function bound(model, key) {
  if (!underscore.isString(key)) {
    key = undefined;
  }

  return new Binding(model, key);
}

function oneway(model, key) {
  return new Binding(model, key, {oneway: true});
}

function computed(binding, fn) {
  if (!isBinding(binding))
    { return fn(binding); }

  return new Computed(binding, function () { return fn(binding.get()); });
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
handlebars.registerHelper('bound', bound);
handlebars.registerHelper('oneway', oneway);
handlebars.registerHelper('computed', computed);
handlebars.registerHelper('eq', eq);
handlebars.registerHelper('not', not);
handlebars.registerHelper('array', array);
handlebars.registerHelper('object', object);

var View$1 = backbone.View.extend({
  constructor: function View$$1() {
    backbone.View.apply(this, arguments);

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

    var data = this.templateData ? this.templateData() : this;
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

  template: function template() { return ''; },

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
  },
});

var Component = View$1.extend({
  defaultProps: {},

  constructor: function Component(options) {
    if ( options === void 0 ) options = {};

    this.update(options.props);

    // Pass model and collection through directly to view
    // (there are other properties that could be set directly, but they are less intuitive)
    if (this.props.model && !options.model) { options.model = this.props.model; }
    if (this.props.collection && !options.collection) { options.collection = this.props.collection; }

    View$1.call(this, options);
  },

  render: function render() {
    var this$1 = this;

    View$1.prototype.render.apply(this, arguments);

    // Render children to outlet (if specified)
    if (this.props.children) {
      this.$('[data-outlet]').replaceWith(this.props.children());
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
    this.props = underscore.defaults(props, underscore.result(this, 'defaultProps'));
  },

  remove: function remove() {
    // Stop listening to any bound props
    underscore.each(this.props, function (prop) {
      if (prop && prop.stopListening)
        { prop.stopListening(); }
    });

    View$1.prototype.remove.call(this);
  },
}, {
  registerAs: function(name) {
    var Type = this;
    handlebars.registerHelper(name, function(id, view, options) {
      if (!view) {
        options = id;
        view = (options && options.data && options.data.parent_component) || this;
        id = underscore.uniqueId(name);
      }
      if (!options) {
        options = view;
        view = (options && options.data && options.data.parent_component) || this;
      }
      options = options || {};

      var context = this;
      var props = underscore.extend({
        id: id,
        children: children,
      }, options.hash || {});
      var data = (options.fn && options.data) ? handlebars.createFrame(options.data) : {};

      var component = view._components[id];
      if (!component)
        { component = view._components[id] = new Type({ props: props }); }
      else
        { component.update(props); }

      component._to_be_removed = false;
      data.parent_component = component;

      return handlebars.helpers.placeholder(id);

      function children() {
        var html = options.fn && options.fn(context, {data: data, blockParams: [component]});

        if (isSafestring(html))
          { return html.string; }

        return html;
      }
    });
  }
});
function isSafestring(value) {
  if (!value || underscore.isString(value))
    { return false; }

  return 'string' in value;
}

var Region = Component.extend({
  defaultProps: {
    binding: null,
    bindings: [],
    className: '',
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
      style = 'display: inline-block;' + (style ? ' ' + style : '');
    }

    this.$el.attr('style', style);
    this.$el.removeClass().addClass(this.props.className);

    return Component.prototype.render.call(this);
  }
});
Region.registerAs('region');

var version = "0.3.5";

exports.Binding = Binding;
exports.isBinding = isBinding;
exports.getValue = getValue;
exports.setValue = setValue;
exports.Computed = Computed;
exports.View = View$1;
exports.Component = Component;
exports.VERSION = version;

Object.defineProperty(exports, '__esModule', { value: true });

})));
