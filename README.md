# backbone-component

Backbone + Handlebars component system.

## Installation

1. To install with `npm`, add to project's package.json
    
    ```json
    "dependencies": {
      "backbone-component": "git+https://github.com/CSNW/backbone-component.git#v0.1.0"
    }
    ```

2. Require or import backbone-component

    ```js
    var BackboneComponent = require('backbone-component');
    // BackboneComponent.Component, .View, .Computed, ...

    import {Component, View, Computed, ...} from 'backbone-component';
    ```

## Usage

### Define Component

```js
import {Component} from 'backbone-component';

const template = Handlebars.compile(`Hello {{props.name}}`); 

const SayHiComponent = Component.extend({
  template,

  // Component receives props from parent view
  // (defaultProps will be merged into these props)
  defaultProps: {
    name: 'World',
  }
});

// Register component as helper for usage from Handlebars
SayHiComponent.registerAs('say-hi');
```

```js
import {View} from 'backbone-component';

const template = Handlebars.compile(`Message: {{say-hi name="Universe"}}`)

export default View.extend({
  template
});
```

### Bindings

```js
import {Component, isBinding, getValue, setValue} from 'backbone-component';

const InputComponent = Component.extend({
  tagName: 'input',
  defaultProps: {
    value: null
  },

  events: {
    'change': 'handleChange'
  },

  initialize() {
    if (isBinding(this.props.value)) {
      this.listenTo(this.props.value, 'change', this.render);
    }
  },

  render() {
    this.el.value = getValue(this.props.value);
  },

  handleChange(e) {
    setValue(this.props.value, e.target.value);
  }
});
InputComponent.registerAs('input');
```

```js
import {View} from 'backbone-component';

const template = Handlebars.compile(`Name: {{input value=(bound model "name")}}`);

export default View.extend({
  template,

  initialize() {
    this.model = new Backbone.Model({
      name: 'Tim'
    });
  }
});
```

### Computed

```js
import {View, Component, Computed, isBinding} from 'backbone-component';

const DisplayMessage = Component.extend({
  template: Handlebars.compile(`{{get props.message}}`),
  //                              ^ get helper is used to get the underlying value
  
  initialize() {
    //  v computed's are bindings + fn, so use binding approach
    if (isBinding(this.props.message)) {
      this.listenTo(this.props.message, 'change', this.render);
    }
  }
});
DisplayMessage.registerAs('display-message');
```

```js
import {View} from 'backbone-component';

const template = Handlebars.compile(`
  Quiet: {{display-message message=quiet}}
  Yelling: {{display-message message=(computed (bound model "message") toUpperCase)}}
  {{!                                 ^ computed can be used inline in combination with bound}}
`);

export default View.extend({
  template,

  initialize() {
    this.model = new Backbone.Model({
      message: 'Hello World'
    });

    this.quiet = new Computed(this.model, 'message', this.toLowerCase);
  },

  toLowerCase: message => message.toLowerCase(),
  toUpperCase: message => message.toUpperCase()
});
```

### Outlet

```js
import {Component} from 'backbone-component';

const template = Handlebars.compile(`
  <dt>{{title}}</dt>
  <dd>{{outlet}}</dd>
`);

const DetailsComponent = Component.extend({
  template
});
DetailsComponent.registerAs('details');
```

```js
import {View} from 'backbone-component';

const template = Handlebars.compile(`
  {{#details title="Information"}}
    <p>Info...</p>
  {{/details}}
`);

export default View.extend({
  template
});
```