import { extend, defaults, result, uniqueId, each, isString } from 'underscore';
import { registerHelper, helpers, createFrame } from 'handlebars';
import View from './view';
import BoundModel from './bound-model';

var Component = View.extend(
  {
    defaultProps: {},

    constructor: function Component(options = {}) {
      this.props = new BoundModel();
      this.state = new BoundModel();

      this.update(options.props);

      // Pass model and collection through directly to view
      // (there are other properties that could be set directly, but they are less intuitive)
      if (options.props.model && !options.model)
        options.model = options.props.model;
      if (options.props.collection && !options.collection)
        options.collection = options.props.collection;

      View.call(this, options);
    },

    render() {
      View.prototype.render.apply(this, arguments);

      // Render children to outlet (if specified)
      const children = this.props.get('children');
      if (children) {
        this.$('[data-outlet]').replaceWith(children());
      }

      // If component has child components, they may have been in outlet,
      each(this._components, (component, id) => {
        if (component._to_be_removed) {
          // (already removed by View render)
          return;
        }

        this.$('[data-placeholder="' + id + '"]').replaceWith(component.el);
        component.render();
      });

      // Render active subviews
      each(this._rendered, (view, id) => {
        this.$('[data-placeholder="' + id + '"]').replaceWith(view.el);
        view.render();
      });

      return this;
    },

    update(props) {
      this.props.connect(defaults(props, result(this, 'defaultProps')));
    }
  },
  {
    registerAs: function(name) {
      var Type = this;
      registerHelper(name, function(id, view, options) {
        if (!view) {
          options = id;
          view =
            (options && options.data && options.data.parent_component) || this;
          id = uniqueId(name);
        }
        if (!options) {
          options = view;
          view =
            (options && options.data && options.data.parent_component) || this;
        }
        options = options || {};

        var context = this;
        var props = extend(
          {
            id,
            children
          },
          options.hash || {}
        );
        var data = options.fn && options.data ? createFrame(options.data) : {};

        var component = view._components[id];
        if (!component) component = view._components[id] = new Type({ props });
        else component.update(props);

        component._to_be_removed = false;
        data.parent_component = component;

        return helpers.placeholder(id);

        function children() {
          const html =
            options.fn &&
            options.fn(context, { data, blockParams: [component] });

          if (isSafestring(html)) return html.string;

          return html;
        }
      });
    }
  }
);
export default Component;

export function isSafestring(value) {
  if (!value || isString(value)) return false;

  return 'string' in value;
}
