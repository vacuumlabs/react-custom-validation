// Keeps track of field actions (change, blur, submit) to provide information
// about which fields have been touched.
export class FieldObserver {

  constructor() {
    this.changed = new Set()
    this.blurred = new Set()
    this.submitted = new Set()
  }

  handleEvent({type, fields}) {
    for (let f of fields) {
      if (type === 'change') {
        this.changed.add(f)
      } else if (type === 'blur') {
        this.blurred.add(f)
      } else if (type === 'submit') {
        this.submitted.add(f)
      }
    }
  }

  _touchedOne(field) {
    return this.changed.has(field) ||
      this.blurred.has(field) ||
      this.submitted.has(field)
  }

  _touchedAll(fields) {
    for (let f of fields) {
      if (!this._touchedOne(f)) {
        return false
      }
    }
    return true
  }

  touched(fields) {
    if (typeof fields === 'string') {
      return this._touchedOne(fields)
    } else {
      return this._touchedAll(fields)
    }
  }
}
