// Provide onFormValid method, which waits until the form validity is known
// (i.e. it is not null) and then calls the provided callback.
export class OnFormValidProvider {
  constructor(getConfig, props) {
    this.getConfig = getConfig
    this._reset()
    this.update(props)
  }

  _reset() {
    this.submitting = false
    this.handler = null
  }

  handleEvent({type, fields}) {
    // Cancel submitting if user is still changing data in the form
    if (type === 'change') {
      this._reset()
    }
  }

  update(props) {
    let {formValid} = this.getConfig(props)
    if (this.submitting && formValid != null) {
      this.handler(formValid, props)
      this._reset()
    }
  }

  onFormValid = (handler, props) => {
    this.submitting = true
    this.handler = handler
    this.update(props)
  }
}
