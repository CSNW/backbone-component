import './helpers';
import './region';

export {
  default as Binding,
  bound,
  oneway,
  isBinding,
  getValue,
  setValue
} from './binding';
export { default as Computed, computed } from './computed';
export { default as BoundModel } from './bound-model';
export { default as View } from './view';
export { default as Component } from './component';

export { version as VERSION } from '../package.json';
