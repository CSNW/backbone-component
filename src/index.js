import './helpers';
import './region';

export {
  default as Binding,
  isBinding,
  getValue,
  setValue
} from './binding';
export {default as Computed} from './computed';
export {default as View} from './view';
export {default as Component} from './component';

export {version as VERSION} from '../package.json';
