import './helpers';
import './region';

export {
  default as Observable,
  isObservable,
  getValue,
  setValue
} from './observable';
export { default as Binding, bound, oneway } from './binding';
export { default as Computed, computed } from './computed';
export { default as Listener, listener } from './listener';
export { default as BoundModel } from './bound-model';
export { default as View } from './view';
export { default as Component } from './component';

export { version as VERSION } from '../package.json';
