# React Validation Library

Client-side validation library providing excellent user experience. The main
features include:
- Automatic re-calculation of validity when user changes the input value
- Suggestions on show/hide the validation result
  - Hide validity while the user is typing
  - Hide validity if the field was not touched yet
  - Show the validity if the user finished typing
- Easy definition and usage of custom validation rules
- Flexibility and extensibility: can be easily combined with other validation approaches

This library is intended to be used with React. It also plays well with Redux,
but it can be used without Redux as well.

## Try it out

To run the examples locally:
- Clone the repository: `git clone git@github.com:vacuumlabs/validation.git`
- Build the example: `gulp build-example1` or `gulp build-example2`
- The directory `/path/to/validation-repo/public` will be created that includes all html and js code needed to run the example.
- Open the file `/path/to/validation-repo/public/index.html` in your browser. You do not need to run any server.

It is highly recommended to review and understand the code of both examples, as
it can help to understand the documentation and all features of this library.

## Basic Usage

Let us start with a simple registration form that contains three validated
fields: email, password and repeated password. The corresponding React component
code without validations could be as follows:

```javascript
class RegistrationForm extends React.Component {

  render() {
    let {email, password, rePassword} = this.props.fields
    return (
      <form>
        <input
          type="text"
          id="email"
          onChange={(e) => {
            this.props.dispatch({type: 'changeEmail', payload: e.target.value})
          }}
          value={email}
        />
        { /* similar code for password and re-password inputs */ }
      </form>
    )
  }
}
```

To add some validations for this React component, we need to define a function
that calculate validation config from component's props:

```javascript
function validationConfig(props) {
  let {
    fields, 
    fields: {email, password, rePassword},
    validations,
    dispatch
  } = props

  return {
    fields, // key-value pairs for all fields that require validation
    formValid: validity(validations),
    // specify what should happen when new validation data is available
    onValidation: (name, data) => {
      // save new validation data for validation with name `name` to the app
      // state
      dispatch({
        fn: (state) => {
          // create new state with updated validation data, while keeping the old state the same
          return ramda.assocPath(['validations', name], {...state.validations[name], ...data}, state)
        },
        description: `Got data for ${name} validation: ${JSON.stringify(data)}`
      })
    },
    validations: {
      email: {
        rules: {
          isRequired: {fn: isRequired, args: {value: email}},
          isEmail: {fn: isEmail, args: {value: email}},
          isUnique: {fn: isUnique, args: {time: 1000, value: email}}
        },
        fields: 'email', // field(s) validated by this set of rules
      },
      password: {
        rules: {
          isRequired: {fn: isRequired, args: {value: password}},
          hasLength: {fn: hasLength, args: {value: password, min: 6, max: 10}},
          hasNumber: {fn: hasNumber, args: {value: password}}
        },
        fields: 'password',
      },
      passwordsMatch: {
        rules: {
          areSame: {fn: areSame, args: {value1: password, value2: rePassword}},
        },
        fields: ['password', 'rePassword'],
      },
    },
  }
}

@validated(validationConfig)
class Registration extends React.Component {
...
```
This function provides all necessary configuration for the validation library.

To make the show/hide validity recommendations work properly, one also needs to
notify the validation library about some user actions. For this purpose,
`handleEvent` prop is provided to the React component which should be used for
this purpose (see more
[here](https://github.com/vacuumlabs/validation/tree/change-api#handleevent)).

In return, the validation library provides one with data on validity and
show/hide behavior. This data is provided via `onValidation` handler. It is
recommended to save the data to the app state.

The data can then be used in the `render` function in any desired way, for
example:
```javascript
render() {
  // validation data were saved to app state and are available here
  let {
    email: {result: {valid: emailValid, error: emailError, rule: emailRule}, show: emailShow}
    ...
  } = this.props.validations

  return (
    <div>
      ...
        {emailShow ? `Invalid email (${emailError})` : 'Valid email!'}
      ...
    </div>
  )
}
```

### Multiple-field validation

It is extremely easy to validate multiple fields. For example, see the
`passwordsMatch` validation above. Note that you have to specify all fields that
the validation depends on. This is used to provide correct show/hide
recommendations (we want to show the result only if all fields have been touched
already).


## API

### `validationConfig(props)`

The `validationConfig` function that is used to annotate the validated React
component takes in one argument, the props of that React component, and returns a
config, which is a plain javascript object containing the keys specified below.

#### `validations`

The most important part of the config. Value is an object containing key-value
pairs of all validations. The key serves as an identifier for the validation and
is referred to as validation `name` throughout this documentation. Each value is
a javascript object with the following structure:
```
{
  rules: {
    ruleName: { // used as an identifier for this rule
      fn: function // see below
      args: javascript object // arguments for `fn`
    },
    anotherRuleName {
      //...
    }
  },
  fields: String | Array(Strings), // field(s) validated by this set of rules
}
```

The `fn` function is any rule function (see the specification
[here](https://github.com/vacuumlabs/validation/tree/change-api#defining-custom-rules))
and `args` is the single argument that is provided to this function when it is
called (i.e. `fn(args)` is called internally).

Note that the `fn` argument associated with a given rule name has to be constant
(lambda functions are not allowed).

Example of usage:
```
validations: {
   email: {
     rules: {
       isRequired: {fn: isRequired, args: {value: email}},
       isEmail: {fn: isEmail, args: {value: email}},
       isUnique: {fn: isUnique, args: {time: 1000, value: email}}
     },
     fields: 'email',
   },
   password: {
     rules: {
       isRequired: {fn: isRequired, args: {value: password}},
       hasLength: {fn: hasLength, args: {value: password, min: 6, max: 10}},
       hasNumber: {fn: hasNumber, args: {value: password}}
     },
     fields: 'password',
   },
   passwordsMatch: {
     rules: {
       areSame: {fn: areSame, args: {value1: password, value2: rePassword}},
     },
     fields: ['password', 'rePassword'],
   },
 },
```

#### `onValidation`

Handler function that is called by the validation library whenever new
validation data is available.

The validation library does not do any auto-magic. Instead, it just calculates
the validitation results and recommendations for showing/hiding these validation
results and calls the `onValidation` handler when new data is available. This
way the application developer has full control and responsibility for handling
the calculated validation data provided by the validation library.

The `onValidation` handler takes in two arguments:
- `name`: name of the corresponding validation as defined in `validations` object
- `data`: newly calculated validation data; javascript object with the following structure

```
{
  result: {
    // valid or invalid or unknown validity
    valid: true | false | null
    // name of the rule that failed
    rule: null | String
    // data returned by the rule function providing more specific info on error
    error: null | any javascipt object
  },
  // whether the validation result should be displayed to the user
  show: true | false
}
```

Both `result` and `show` can be undefined, meaning that their values have not
changed since the last call of `onValidation` handler. Note that `rule` and
`error` are not null only if `valid` is `false`.

The recommended implementation of the `onValidation` handler should simply save
the provided data in the application state so that they can be accessed there
from the `render` method. Example:
```
onValidation: (name, data) => dispatch(
  // We dispatch a function that defines how app state should be modified
  fn: (state) => {
    // create new state with updated validation data, while keeping the old state the same
    return ramda.assocPath(['validations', name], {...state.validations[name], ...data}, state)
  },
  description: `Got data for ${name} validation: ${JSON.stringify(data)}`
)
```

#### `fields`

Key-value pairs of all form fields that require validation. Object keys should
be field names and object values should be the respective field values currently
entered in the form. Example:

```
  fields: {
    email: 'my.email@example.com',
    password: 'verysecret123',
    rePassword: 'verysecr',
  }
```

#### `formValid`

Validity of the whole form. This information is used to provide the
`onFormValid` function.

The value can be
- `true`: all fields are valid
- `false`: at least one field is invalid
- `null`: validity is unknown (some validations are pending)

There is a [helper
function](https://github.com/vacuumlabs/validation/tree/change-api#validityvalidationdata)
in the validation library for calculating overall form validity, so the usage
should usually look as follows:

```
  formValid: validity(props.validations)
```

#### `onDestroy` (optional)

Function that takes in one argument:
- `name`: name of the validation as defined in `validations` object

The validation config is dynamically calculated from `props`, so the list of all
validations can change over time. To avoid memory leaks and weird unexpected
behavior, it is necessary to handle removal of validations that are removed from
the config.

The `onDestroy` handler is called when a validation with specified `name` is no
longer found among `validations` in the config.

If not provided, the following default implementation will be used:

```
  (name) => handleValidation({result: {valid: true}, show: false}) 
```

#### `debounce` (optional)

Throttling for validity computations, in milliseconds. If not specified, default
value of 100 is used.

### Provided props

The validated React component gets two new props (apart from all props that were
passed to it) from the validation library.

#### `onFormValid`

Can be used to prevent invalid data submission. The function takes in one
argument, a function that specifies what should happen based on form validity.

Example of usage:
```
class RegistrationForm extends React.Component {
  myOnSubmitHandler = (valid, props) => {
    if (valid) {
      let {fields: {email}} = props.appState
      alert(`Registration successful! Email=${email}`)
    }
  }

  render() {
   ...
    <form onSubmit={
      (e) => {
        e.preventDefault()
        this.props.onFormValid(this.myOnSubmitHandler)
      }
    }>
    ...
  }
}
```
It is recommended to keep the submit button always enabled and use the
`onFormValid` handler to avoid invalid data submission. When user clicks on the
submit button, the `onFormValid` handler is called, which calls the provided
`myOnSubmitHandler` right away if the form validity is known already.
Otherwise, it waits and calls the `myOnSubmitHandler` once the validity
calculation is finished. The validity of the form is provided as an argument
`valid` to `myOnSubmitHandler`.

Note that the `myOnSubmitHandler` takes also a second argument `props`. One
should always use provided `props` (as opposed to `this.props`) from within the
`myOnSubmitHandler`. If the user continues typing after submitting the form (and
while the validation calculation is in progress), `this.props` might not be up
to date. Field values in `props` are guaranteed to be valid and most recently
submitted.

#### `handleEvent`

Handler used to notify the validation library about user actions which are used
in show validation calculations. Takes in two arguments:
- `type`: `'blur'` or `'change'` or `'submit'`
- `field`: `String`, field name as reffered to in `fields` in the validation
  config; if not specified (usually for `'submit'` event), all fields specified in
  validation config are assumed

Examples of usage:
```
<input
  type="text"
  id="email"
  onChange={(e) => {
    this.handleEmailChange(e.target.value)
    handleEvent('change', 'email')
  }}
  onBlur={(e) => handleEvent('blur', 'email')}
  value={this.props.fields.email}
/>
```

```
<form onSubmit={
  (e) => {
    e.preventDefault()
    this.props.handleEvent('submit')
    //...
```

### Helper Functions

#### `validity(validationData)`

Returns validity of multiple validation results. The result is false if any
single validation contains valid = false, null if any validation contains valid
= null (and none is false) and true otherwise. The argument `validationData`
should be a dict of validation results as provided by the validation library.

#### `initValidation()`

Returns initial status of validation data as provided by this library. Can be
used to initialize the app state. It is recommended (but not necessary) to keep
the validation data in the app state structured in the same way.

#### `valid()`

Returns valid validation result, that is `{valid: true, reason: null}`. Useful
for writing custom rule functions.

#### `invalid(reason)`

Returns invalid validation result with specified reason, that is `{valid: false,
reason: reason}`. Useful for writing custom rule functions.

## Defining Custom Rules

Rules are ordinary javascript functions, so it is extremely easy to add new
rules.

The rule function can be any function that:
- takes in one argument
- returns object with keys `valid` and `reason` (`reason == null` if `valid` is
  `true`) or a Promise of such object

For example:

```javascript
function areSame({value1, value2}) {
  if (value1 === value2) return {valid: true}
  else return {valid: false, reason: 'Values are different'}
}

function isUnique({value}) {
  let isValid = value.indexOf('used') === -1
  let response = isValid ? {valid: true} : {valid: valse, reason: 'The value is not unique.'}
  return Promise.delay(10).then(() => response)
}
```

To write a custom rule, you just need to implement the function and use it in
your validation config.

### Custom messages and internationalization

In larger and more serious projects one might need to translate the validation
messages to other languages, or one might want to provide very specific
validation messages. The recommended way of achieving this is outlined below.

Write rule functions that return object as a reason:
```
function hasLength({value, min, max}) {
  if (min != null && value.length < min) {
    return invalid({code: 'too short', args: {min}, msg: `Length should be at least ${min}.`}})
  }
  if (max != null && value.length > max) {
    return invalid({code: 'too long', args: {max}, msg: `Length should be at most ${max}.`}})
  }
  return valid()
}
```

Write a `displayMessage` function that can handle all types of reasons that you
are using, for example:
```
function displayMessage(reason, dictionary) {
  if (typeof reason === 'string') {
    return string
  }
  {code, min, msg} = reason
  if (dictionary.code != null) {
    return dictionary.code(args)
  } else {
    return msg // falling back to provided message
  }
}

```
The dictionary in this case might be something like:
```
{
  'too short': ({min}) => `The provided value is very short. Please enter at
  least ${min} characters`,
  ...
}
```
