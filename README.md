# validation

React Validation Library
=========================

Work on this documentation is in progress, it will be finished soon.

Usage
-----------

Example of usage (form with an input for username and a validation for
username):

```javascript
render () {
  let username = this.state.username
  return (...
    <input
      id="username"
      onChange={this.handleUsernameChange}
      type="text"
      value={username.value} />

    <div>{username.showValidation ? username.message : null}</div>

    <Validate onValidation={this.handleUsernameValidation} >
      <IsRequired key="is-required" value={username.value} />
      <HasLength key="has-length" min={6} value={username.value} />
      <IsAlphanumeric key="is-alphanumeric" value={username.value} />
      <IsUnique key="is-unique" value={username.value} />
    </Validate>
  ...)
}
```

The onValidation handler has to be provided, typically it should update
component state or dispatch the data, so that the validation result is present
in component state or app state:


```javascript
handleUsernameValidation({validationResult, showValidation}) {
  // update state with new validation data
}
```

To add validation for multiple fields:

```javascript
<Validate onValidation={this.handleRePasswdValidation} >
  <AreSame key='are-same' value1={this.state.password} value2={this.state.rePassword} />
</Validate>
```

Rules are functions, for example:

```javascript
function AreSame({value1, value2}) {
  if (value1 === value2) return {valid: true}
  else return {valid: false, reason: 'Values are different'}
}
```

Rule can also return a Promise:

```javascript
function IsUnique({value}) {
  let isValid = value.indexOf('used') === -1
  let response = isValid ? {valid: true} : {valid: valse, reason: 'The value is not unique.'}
  return Promise.delay(10).then(() => response)
}
```

To write a custom rule, you just need to implement the function and make it
accessible from the render method where the validation is.
