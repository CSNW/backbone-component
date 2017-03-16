import {View as BackboneView} from 'backbone';
import {each} from 'underscore';

var View = BackboneView.extend({
  constructor: function View() {
    BackboneView.apply(this, arguments);

    this._components = {};
  },

  render() {
    // First, mark all components for removal and clean subview rendering slate
    // (added components will remove this mark)
    each(this._components, component => {
      component._to_be_removed = true;
    });
    this._rendered = {};

    const data = this.templateData ? this.templateData() : this;
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

  template() { return ''; },

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
    each(this._components, component => {
      component.remove();
    });
  },
});
export default View;
