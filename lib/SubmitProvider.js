// Provide submit method, which waits until the form validity is known
// (i.e. it is not null) and then calls one of provided callbacks.
export class SubmitProvider {
  constructor(isFormValid) {
    this.reset()
    this.isFormValid = isFormValid
  }

  reset() {
    this.submitting = false
    this.onValid = null
    this.onInvalid = null
  }

  update() {
    if (!this.submitting) {
      return
    }
    let valid = this.isFormValid()
    if (valid != null) {
      if (valid === true && this.onValid != null) {
        this.onValid()
      } else if (this.onInvalid != null) {
        this.onInvalid()
      }
      this.reset()
    }
  }

  submit = (onValid, onInvalid) => {
    this.submitting = true
    this.onValid = onValid
    this.onInvalid = onInvalid
    this.update()
  }
}
