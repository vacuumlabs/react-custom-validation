# React Validation Library

Client-side validation library that aims for the excellent user experience. Do
not expect cheap magic here; we will force you to write some amount of code.
It is the only way how to do really great validations.

## Rationale

With React and proper application state management system (for example, Redux)
it is simple to validate things. All the data is available in the application
state, hence obtaining the validity is as easy as applying validation functions
to the appropriate arguments. Multiple-field validations and asynchronous
validations do not complicate the story much.

The real challenge for top-notch validated component is not computing actual
validity of individual fields, but computing whether the validation result
should be shown to the user. We strongly believe that these two aspects are
completely orthogonal and should be treated so. Required field never touched?
Invalid, but do not show it. Email field does not look e-mail-ish at all?
Invalid, but do not show it if the user is still typing. If the user changes the
focus to another field, show it ASAP! You see the picture.

It turns out that whether the validation result should be presented to the user
depends on many details: what inputs were already touched, when the last
keystroke happened, whether the user already attempted to submit the form, etc.
Such details are 100% unimportant for anything else than showing validation
result, so you do not capture and store these data in any way. Therefore, the
validation library creates a higher order component (HOC) that stores this
information in its internal component state.

The contract is simple:

- you configure what validation rules exist and what fields affect what validations
- you inform the validation component about all changes, blurs and submits
  performed by the user
- validation component informs you what is the status of each individual
  validation: Whether the validation is OK / not OK and whether you should /
  should not display validation status

## Feature set

- Automatic re-calculation of validity when user changes the input value
- Suggestions on showing/hiding the validation result
  - Hide validity while the user is typing
  - Hide validity if the field was not touched yet
  - Show validity if the user finished typing
- Easy definition and usage of custom validation rules
- Multiple fields validation
- Async validations
- Debouncing / Throttling
- Conditional validations
- Flexibility and extensibility: can be easily combined with other validation approaches

This library is intended to be used with React. It also plays well with Redux,
but it can be used without Redux as well. It can be easily integrated with
React-Intl or other (custom?) i18n solution.

## Try it out

To run the examples locally:
* Clone the repository: `git clone git@github.com:vacuumlabs/react-validation.git`
* `npm install`
* `npm run example`
*  Navigate to `localhost:3000`

Code of the examples is located in `pages/example/` directory.

Examples 1 and 2 illustrate the usage of this library in very simple cases. It is
highly recommended to review and understand the code of these examples, as it can
help to understand this documentation and basic features of this library.

Example 3 is more complicated and is used to show that this library can be used
even when the requirements are more complex (e.g. when one wants to dynamically
add and remove fields). The user is encouraged to review the code of example 3
if they want to create more complex validated forms.

## Basic Usage

Let us start with a simple registration form that contains three validated
fields: email, password and repeated password. The corresponding React component
code without validations could be as follows:

```javascript
class RegistrationForm extends React.Component {

  render() {
    let {
      fields: {email, password, rePassword}
      changeEmail,
      // ...
    } = this.props

    return (
      <form>
        <input
          type="text"
          id="email"
          onChange={(e) => changeEmail(e.target.value)}
          value={email}
        />
        { /* similar code for password and re-password inputs */ }
      </form>
    )
  }
}
```

To add some validations for this React component, we need to define a function
that calculates validation config from component's props:

```javascript
function validationConfig(props) {
  let {
    // Key-value pairs of validated fields
    fields: {email, password, rePassword},
    // Function (name, data) => {...} used to handle data provided by
    // validation library
    onValidation,
  } = props

  return {
    // Names of all validated form fields
    fields: ['email', 'password', 'rePassword'],
    // Specify what should happen when new validation data is available.
    // For example, redux action creator, that will save the validation result
    // to the application state
    onValidation,
    // Configure the validations itself. Here we specify 3 validations, each
    // with different validation rules
    validations: {
      email: {
        rules: {
          // Lisp-like convention, first item in the list is function, all other
          // items are arguments. Note that the function has to be constant
          // (lambda functions are not allowed)
          isRequired: [isRequired, email],
          isEmail: [isEmail, email],
          isUnique: [isUnique, email, {time: 1000}]
        },
      },
      password: {
        rules: {
          isRequired: [isRequired, password],
          hasLength: [hasLength, password, {min: 6, max: 10}],
          hasNumber: [hasNumber, password],
        },
      },
      passwordsMatch: {
        rules: {
          areSame: [areSame, password, rePassword]
        },
        // Names of fields validated by this validation. Validation library uses
        // this to determine which field changes, blurs and submits have to be
        // tracked and then uses this data to calculate validation-showing info.
        // If not provided, the validation name (i.e. the key in this object) is
        // used.  For example, ['email'] and ['password'] are used for the email
        // and password validations above, respectively
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
`$fieldEvent` and `$field` props are provided to the React component which
should be used for this purpose (see more [here](#fieldevent) and
[here](#fieldfield-onchange-onblur)).

In return, the validation library provides one with data on validity and
show/hide behavior. This data is provided in two alternative ways: via
`onValidation` handler (so that they can be handled in any desired way - e.g.
dispatched to the app state) and as `props` to the React component (can save
some code if the validation data is needed only in that component).

The data can then be used in the `render` function in any desired way, for
example:
```javascript
render() {
  // validation data provided as props by the validated decorator
  let {
    email: {isValid: emailValid, error: {rule: emailRule, reason: emailReason}, show: emailShow}
    ...
  } = this.props.$validation

  return (
    <div>
      ...
        {emailShow ? `Invalid email (${emailReason})` : 'Valid email!'}
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

The most important part of the config is an object containing key-value pairs of
all validations. The key serves as an identifier for the validation and is
referred to as validation `name` throughout this documentation. Each value is a
javascript object with the following structure:
```
{
  rules: {
    ruleName: [ // used as an identifier for this rule
      fn, // first item in the list is the rule function, see below
      arg1, // first argument for `fn`
      arg2, // second argument for `fn`
      ...
    ],
    anotherRuleName: [
      //...
    ],
    ...
  },
  // Field(s) validated by this validation; optional.
  // Validation library uses this to determine which field changes, blurs and
  // submits have to be tracked and then uses this data to calculate
  // validation-showing info. If not provided, the validation name (i.e. the key
  // in this object) is used.
  fields: String | Array(Strings),
}
```

Each rule is defined by a list of items. The first item in the list `fn` is any
rule function (see the specification [here](#defining-custom-rules)). Other
items are provided to `fn` as arguments in the specified order (i.e. `fn(arg1,
arg2, ...)` is called internally).

Note that `fn` associated with a given rule name has to be constant (lambda
functions are not allowed).

Example of usage:
```
validations: {
  email: {
    rules: {
      isRequired: [isRequired, email],
      isEmail: [isEmail, email],
      isUnique: [isUnique, email, {time: 1000}]
    },
  },
  password: {
    rules: {
      isRequired: [isRequired, password],
      hasLength: [hasLength, password, {min: 6, max: 10}],
      hasNumber: [hasNumber, password],
    },
  },
  passwordsMatch: {
    rules: {
      areSame: [areSame, password, rePassword]
    },
    fields: ['password', 'rePassword'],
  },
```

#### `fields`

List of all field names that require validation, for example:

```
  fields: ['email', 'password', 'rePassword']
```


For convenience reasons, object with field names as keys is also accepted:

```
  fields: {
    email: 'my.email@example.com',
    password: 'verysecret123',
    rePassword: 'verysecr',
  }
```

#### `onValidation` (optional)

Handler function that is called by the validation library whenever new
validation data (i.e. validation results and recommendations for showing/hiding
these validation results) is available. It provides the application developer
with full control over handling the calculated validation data.

The implementation of this handler is optional and if not provided, it defaults
to empty function. If the validation data is needed only from within the React
form component, one can use the provided (`$validation` prop)[#validation] to
access the validation data. However, if the data is needed elsewhere in the
application, the `onValidation` handler needs to be implemented.

The `onValidation` handler takes in two arguments:
- `name`: name of the corresponding validation as defined in `validations` object
- `data`: newly calculated validation data; javascript object with the following structure

```
{
  // valid or invalid or unknown validity
  isValid: true | false | null
  error: {
    // name of the rule that failed
    rule: null | String
    // data returned by the rule function providing more specific info on error
    reason: null | any javascipt object
  },
  // whether the validation result should be displayed to the user
  show: true | false
}
```

Note that `rule` and `reason` are not undefined only if `isValid` is `false`.

The recommended implementation of the `onValidation` handler should simply save
the provided data in the application state so that they can be accessed there
from the `render` method when needed. Example:
```
onValidation: (name, data) => dispatch(
  // We dispatch a function that defines how app state should be modified
  fn: (state) => {
    // create new state with updated validation data, while keeping the old state the same
    return ramda.assocPath(['validations', name], data, state)
  },
  description: `Got data for ${name} validation: ${JSON.stringify(data)}`
)
```

#### `formValid` (optional)

Validity of the whole form. This information is used to provide the `$submit`
prop.

The value can be
- `true`: all fields are valid
- `false`: at least one field is invalid
- `null`: validity is unknown (some validations are pending)

This field is optional; if it is not specified, `isFormValid(validation)` is
used, where `validation` is validation data that is also provided as the prop
(`$validation`)[#validation] to the validated form component and `isFormValid`
is a [helper function](#isformvalidvalidation) for calculating overall form
validity.

#### `debounce` (optional)

Throttling for validity computations, in milliseconds. If not specified, default
value of 100 is used.

#### `typingDebounce` (optional)

Time to wait after last user's type before validation is shown, in milliseconds.
If not specified, default value of 1000 is used.

Note that setting this option to infinite (very long) time will result in the
validation results being shown only on blur or submit.

### Provided props

The validated React component gets four new props (apart from all props that
were passed to it) from the validation library. Prop names starting with `$`
were chosen to prevent name collisions. To further ensure that these prop names
do not collide with other prop names passed to the validated component, they
are checked during render and error is thrown if some collision is detected.

#### `$submit(onValid, onInvalid, fieldEvent = true)`

It is recommended to call this function on form submit. It internally waits
until the form validity calculation is finished and calls one of the provided
handlers: `onValid` in case the form validity is `true` or `onInvalid` in case
the form validity is `false`. If the validity of the form is known already when
user clicks on the submit button, the `onValid` (or `onInvalid`) handler is
called right away. Both, `onValid` and `onInvalid` arguments are optional,
defaulting to empty functions.

Since it is the desired behavior in most cases, calling `$submit` also calls
`$fieldEvent('submit')`. This default behavior can be turned off by passing
`false` as the third (`fieldEvent`) argument.

Example of usage:
```
class RegistrationForm extends React.Component {
  render() {
   ...
    <form onSubmit={
      (e) => {
        e.preventDefault()
        this.props.$submit(
          () => alert('Registration successful!'),
          () => alert('There are errors in the form!')
        )
      }
    }>
    ...
  }
}
```

Since invalid data submission can be easily avoided by using this `$submit`
function, it is recommended to keep the submit button enabled while the user is
filling out the form.

If the user submits the form while validity calculation is in progress and the
user continues typing (and thus changing the form field values), the
`onValid`/`onInvalid` handler call will be canceled. It will also be canceled if
anything in `validations` part of the validation config changes. This is to
prevent possible mismatch between validated and actually submitted fields.

Note that the validation library does not prevent multiple submits while
`onValid` handler is running; the submit button should be therefore disabled
while the `onValid` handler is running.

For information on form validity calculation see [here](#formvalid-optional).

#### `$fieldEvent`

Handler used to notify the validation library about user actions which are used
in show validation calculations. Takes in two arguments:
- `type`: `'blur'` or `'change'` or `'submit'` or `'reset'`
- `field`: `String`, field name as referred to in `fields` in the validation
  config; if not specified (usually for `'submit'` and `'reset`' events), all
  fields specified in validation config are assumed

The action type `'reset'` causes the validation library to "forget" all past
field events. For example, suppose that the field `'email'` was changed, blurred
and/or submitted and the user is not typing right now. One will thus get `{show:
true}` for this email validation. After `$fieldEvent('reset', 'email')` is
called, the email field will be considered untouched (all changes, blurs,
submits being forgotten) and one will get `{show: false}` for the email
validation. The most usual case is perhaps calling `$fieldEvent('reset')` which
is useful for resetting the whole form after successful submit.

Examples of usage:
```
<input
  type="text"
  id="email"
  onChange={(e) => {
    this.handleEmailChange(e.target.value)
    this.props.$fieldEvent('change', 'email')
  }}
  onBlur={() => this.props.$fieldEvent('blur', 'email')}
  value={this.props.fields.email}
/>
```

```
<form onSubmit={
  (e) => {
    e.preventDefault()
    this.props.$fieldEvent('submit')
    //...
```

#### `$field(field, onChange, onBlur)`

Syntactic sugar that saves manual calling of the `$fieldEvent` function. Takes in
three arguments:
- field name
- `onChange` handler
- `onBlur` handler

Provides modified `onChange` and `onBlur` that take care of calling the
`$fieldEvent` function. Both handlers can be null, empty functions are then used
as a default.

Example of usage:
```
<input
  type="text"
  id="email"
  {...this.props.$field('email', (e) => this.handleEmailChange(e.target.value))}
  value={this.props.fields.email}
/>
```

#### `$validation`

If one just needs to access the validation data (validation results and
show/hide recommendations) from within the validated form, one can read this
data from the `$validation` prop that is provided to this form. In such case one
does not have to implement the `onValidation` handler. However, whenever the
validation data are needed by some other react components, it is recommended to
implement the `onValidation` instead to save the validation data to the app
state, where the data can be used by any part of the application.

Example stucture of data:
```
let {
  email: {isValid, error: {reason, rule}},
  password: {...}
} = this.props.$validation
```

### Helper Functions

#### `isFormValid(validation)`

Returns validity of multiple validation results. The result is false if any
single validation contains valid = false, null if any validation contains valid
= null (and none is false) and true otherwise. The argument `validation` should
be a dict of validation results as provided by the validation library.

#### `initValidation()`

Returns initial status of validation data as provided by this library. Can be
used to initialize the app state. It is recommended (but not necessary) to keep
the validation data in the app state structured in the same way.


## Defining Custom Rules

Rules are ordinary javascript functions, so it is extremely easy to add new
rules.

The rule function can be any function that:
- returns `null` or a `Promise` that resolves to `null` if the arguments satisfy
  the rule
- returns some error description (`!= null`) or a `Promise` of such error
  description if the arguments do not satisfy the rule

For example:

```javascript
function areSame({value1, value2}) {
  return (value1 === value2) ? null : 'Values are different'
}

function isUnique({value}) {
  let isValid = value.indexOf('used') === -1
  let response = isValid ? null : 'The value is not unique.'
  return Promise.delay(10).then(() => response)
}
```

To write a custom rule, you just need to implement the function and use it in
your validation config.

### Custom messages and internationalization

In larger and more serious projects one might need to translate the validation
messages to other languages, or one might want to provide very specific
validation messages. The recommended way of achieving this is outlined below.

Write rule functions that return object:
```
function hasLength({value, min, max}) {
  if (min != null && value.length < min) {
    return {code: 'too short', args: {min}, msg: `Length should be at least ${min}.`}
  }
  if (max != null && value.length > max) {
    return {code: 'too long', args: {max}, msg: `Length should be at most ${max}.`}
  }
  return null
}
```

Write a `displayMessage` function that can handle all types of errors that you
are using, for example:
```
function displayMessage(error, dictionary) {
  if (typeof error === 'string') {
    return error
  }
  {code, args, msg} = error
  if (dictionary[code] != null) {
    return dictionary[code](args)
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
