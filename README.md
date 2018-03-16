# backbone-component

Backbone + Handlebars component system.

## Installation

1.  To install with `npm`, add to project's package.json

    ```json
    "dependencies": {
      "backbone-component": "git+https://github.com/CSNW/backbone-component.git#v0.3.5"
    }
    ```

2.  Require or import backbone-component

    ```js
    var BackboneComponent = require('backbone-component');
    // BackboneComponent.Component, .View, .Computed, ...

    import {Component, View, Computed, ...} from 'backbone-component';
    ```

## Usage

### Component + View

```js
import { Component } from 'backbone-component';

const template = Handlebars.compile(`Hello {{get props "name"}}`);
//                                           ^ get helpers is used to get value from model

const SayHiComponent = Component.extend({
  template,

  // Component receives props from parent view
  // (defaultProps will be merged into these props)
  defaultProps: {
    name: 'World'
  }
});

// Register component as helper for usage from Handlebars
SayHiComponent.registerAs('say-hi');
```

```js
import { View } from 'backbone-component';

const template = Handlebars.compile(`Message: {{say-hi name="Universe"}}`);

export default View.extend({
  template
});
```

### Bindings

```js
import { Component } from 'backbone-component';

const InputComponent = Component.extend({
  tagName: 'input',
  defaultProps: {
    value: null
  },

  events: {
    change: 'handleChange'
  },

  initialize() {
    // Binding is stored internally in props model,
    // so component treats this.props like standard Backbone Model
    this.listenTo(this.props, 'change:value', this.render);
  },

  render() {
    this.el.value = this.props.get('value');
  },

  handleChange(e) {
    this.props.set({ value: e.target.value });
  }
});
InputComponent.registerAs('input');
```

```js
import { View } from 'backbone-component';

const template = Handlebars.compile(
  `Name: {{input value=(bound model "name")}}`
);

export default View.extend({
  template,

  initialize() {
    this.model.set({ name: 'Tim' });
  }
});
```

### Computed

```js
import { Component } from 'backbone-component';

const template = Handlebars.compile(`{{get props "message"}}`);

const DisplayMessage = Component.extend({
  template,

  initialize() {
    // computed is binding + fn, so use binding approach
    this.listenTo(this.props, 'change:message', this.render);
  }
});
DisplayMessage.registerAs('display-message');
```

```js
import { View, computed } from 'backbone-component';

const template = Handlebars.compile(`
  Quiet: {{display-message message=quiet}}
  Yelling: {{display-message message=(computed (bound model "message") toUpperCase)}}
  {{!                                 ^ computed can be used inline in combination with bound}}
`);

export default View.extend({
  template,

  initialize() {
    this.model.set({ message: 'Hello World' });

    // Create computed value
    this.quiet = computed(this.model, 'message', this.toLowerCase);
  },

  toLowerCase: message => message.toLowerCase(),
  toUpperCase: message => message.toUpperCase()
});
```

### Outlet

```js
import { Component } from 'backbone-component';

const template = Handlebars.compile(`
  <dt>{{get props "title"}}</dt>
  <dd>{{outlet}}</dd>
`);

const DetailsComponent = Component.extend({
  template
});
DetailsComponent.registerAs('details');
```

```js
import { View } from 'backbone-component';

const template = Handlebars.compile(`
  {{#details title="Information"}}
    <p>In outlet...</p>
  {{/details}}
`);

export default View.extend({
  template
});
```

### Helpers

Models, Bindings, and Computed:

* `{{get model "key"}}` or `{{get binding}}` - Get underlying value for Backbone Model, Binding, or Computed
* `(bound model "key")` - Create a two-way binding to the given model and key
* `(oneway model "key")` - Create a one-way (get only) binding to the given model and key
* `(computed binding fn)` or `(computed value fn)` - Map the given binding/value through the given function

Components and Views:

* `{{outlet}}` - Outlet for block components
* `{{render view}}` - Render given view in template
* `{{placeholder "id"}}` - (internal) Insert placeholder to be replaced in render

Utilities:

* `(eq a b)` - Check if two values are equal (using `==`) (e.g. `{{#if (eq a b)}}...{{/if}}`
* `(not c)` - Get inverse of value (using `!`)
* `(array 1 2 3)` - Create array from values
* `(object a=1 b=2)` - Create array from key-values
