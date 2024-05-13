import { View as BackboneView } from 'backbone';
import { extend, each, isFunction } from 'underscore';
import BoundModel from './bound-model';

var View = BackboneView.extend({
  constructor: function View(options) {
    this.state = new BoundModel();

    BackboneView.call(this, options);
    this._components = {};
  },

  render() {
    // First, mark all components for removal and clean subview rendering slate
    // (added components will remove this mark)
    each(this._components, component => {
      component._to_be_removed = true;
    });
    this._rendered = {};

    const data = this.templateData();
    const html = this.template(data);
    this.$el.html(html);

    // Render active components and remove inactive
    each(this._components, (component, id) => {
      if (component._to_be_removed) {
        component.remove();
        delete this._components[id];
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

    this.delegateEvents();

    return this;
  },

  templateData() {
    // TODO Think about passing JS values of state, props, model, and collection
    // e.g. (get state "key") -> state.key
    //
    // could add __underlying key for use with binding

    return this;
  },
  template() {
    return '';
  },

  delegateEvents() {
    BackboneView.prototype.delegateEvents.call(this);
    each(this._components, component => {
      component.delegateEvents();
    });
    each(this._rendered, view => {
      view.delegateEvents();
    });
  },

  remove() {
    BackboneView.prototype.remove.call(this);

    each(this._components, component => {
      component.remove();
    });

    this.state.stopListening();
  }
});
export default View;
