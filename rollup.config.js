const buble = require('rollup-plugin-buble');
const json = require('rollup-plugin-json');
const pkg = require('./package.json');
const banner = `/*!
 * ${pkg.name} - ${pkg.description}
 * v${pkg.version} - ${pkg.homepage} - @license: ${pkg.license}
 */`

module.exports = {
  input: 'src/index.js',
  external: ['handlebars', 'underscore', 'backbone'],

  output: {
    file: 'dist/backbone-component.js',
    format: 'umd',
    name: 'BackboneComponent',
    globals: {
      handlebars: 'Handlebars',
      underscore: '_',
      backbone: 'Backbone'
    },
    banner
  },
  
  plugins: [
    json(),
    buble()
  ]
};
