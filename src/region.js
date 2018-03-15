import Component from './component';

const Region = Component.extend({
  defaultProps: {
    binding: null,
    bindings: [],
    class: '',
    style: '',
    inline: false
  },
  template: () => '<script data-outlet></script>',

  initialize() {
    if (this.model) {
      this.listenTo(this.model, 'change', this.render);
    }

    this.listenTo(this.props, 'change:binding', this.render);
    this.props.get('bindings').forEach(binding => {
      this.listenTo(binding, 'change', this.render);
    });
  },

  render() {
    let style = this.props.style;
    if (this.props.inline) {
      style = `display: inline-block;${style ? ` ${style}` : ''}`;
    }

    this.$el.attr('style', style);
    this.$el.removeClass().addClass(this.props.get('class'));

    Component.prototype.render.call(this);
    return this;
  }
});
export default Region;

Region.registerAs('region');
