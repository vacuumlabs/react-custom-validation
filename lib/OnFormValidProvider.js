// Provide onFormValid method, which waits until the form validity is known
// (i.e. it is not null) and then calls the provided callback.
export class OnFormValidProvider {
  constructor(isFormValid) {
    this.reset()
    this.isFormValid = isFormValid
  }

  reset() {
    this.submitting = false
    this.handler = null
  }

  update() {
    if (!this.submitting) {
      return
    }
    let valid = this.isFormValid()
    if (valid != null) {
      this.handler(valid)
      this.reset()
    }
  }

  onFormValid = (handler) => {
    this.submitting = true
    this.handler = handler
    this.update()
  }
}
