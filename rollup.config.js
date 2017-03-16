const buble = require('rollup-plugin-buble');
const json = require('rollup-plugin-json');
const pkg = require('./package.json');
const banner = `/*!
 * ${pkg.name} - ${pkg.description}
 * v${pkg.version} - ${pkg.homepage} - @license: ${pkg.license}
 */`

module.exports = {
  entry: 'src/index.js',
  dest: 'dist/backbone-component.js',
  format: 'umd',
  moduleName: 'BackboneComponent',
  external: ['handlebars', 'underscore', 'backbone'],
  globals: {
    handlebars: 'Handlebars',
    underscore: '_',
    backbone: 'Backbone'
  },
  banner,
  plugins: [
    json(),
    buble()
  ]
};
