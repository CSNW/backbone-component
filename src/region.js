import Component from './component';

const Region = Component.extend({
  defaultProps: {
    binding: null,
    bindings: [],
    className: '',
    style: '',
    inline: false
  },
  template: () => '<script data-outlet></script>',

  initialize() {
    if (this.model) {
      this.listenTo(this.model, 'change', this.render);
    }
    if (this.props.binding) {
      this.listenTo(this.props.binding, 'change', this.render);
    }

    this.props.bindings.forEach(binding => {
      this.listenTo(binding, 'change', this.render);
    });
  },

  render() {
    let style = this.props.style;
    if (this.props.inline) {
      style = 'display: inline-block;' + (style ? ' ' + style : '');
    }

    this.$el.attr('style', style);
    this.$el.removeClass().addClass(this.props.className);

    return Component.prototype.render.call(this);
  }
});
export default Region;

Region.registerAs('region');
