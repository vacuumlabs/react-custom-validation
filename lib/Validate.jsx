import React from 'react';
import Promise from 'bluebird';
import Rx from 'rx';

export class Validate extends React.Component {

    constructor(props) {
        super(props);
        // Collect rules (functions) & promisify
        // Rule functions should have signature (value, callback)
        if (this.hasAnyRules()) {
            this.rules = this.props.children.slice(1);
            // Init array fields with null
            this.validationResults = Array.apply(null, new Array(this.rules.length)).map((x) => null);
        } else {
            this.rules = [];
        }
        this.onInputChange = this.onInputChange.bind(this);
        this.subjectStream = new Rx.Subject();
        this.subscription = this.subjectStream
            .debounce(500)
            .flatMapLatest(
                (value) => Rx.Observable.fromPromise(this.validate(value)))
            .subscribe(
                (validationResult) => this.props.onValidation(validationResult));
    }

    buildValidationResponse(valid, error, showValidation) {
        return {
            'valid': valid,
            'error': error,
            'showValidation': showValidation
        };
    }

    onInputChange(e) {
        this.props.onValidation(this.buildValidationResponse(null, '', false));
        this.subjectStream.onNext(e.target.value);
    }

    hasAnyRules() {
        return 'length' in this.props.children;
    }

    getInput() {
        if (this.hasAnyRules()) {
            return this.props.children[0];
        } else {
            return this.props.children;
        }
    }

    getInputValue() {
        return this.getInput().props.value;
    }

    validate(value) {
        return new Promise((resolve, reject) => {
            // Beginning to validate
            this.props.onValidation(this.buildValidationResponse(null, '', true));
            let valResults = Array.apply(null, new Array(this.rules.length)).map((x) => null);
            this.rules.forEach((rule, ruleIndex) => {
                valResults[ruleIndex] = rule(value);
            });
            valResults.forEach((resPromise) => {
                resPromise.then((result) => {
                    console.log('in Then callback');
                    let index = 0;
                    while ((index < valResults.length) && (valResults[index].isFulfilled()) && (valResults[index].value() == null)) {
                        index++;
                    }
                    let firstRelevant = (index < valResults.length ? valResults[index] : valResults[valResults.length - 1]);
                    if (firstRelevant.isFulfilled()) {
                        // The promise is completed
                        if (firstRelevant.value() == null) {
                            // successfully (null or undefined)
                            resolve(this.buildValidationResponse(true, '', true));
                        } else {
                            // There is a rule, which was broken, but all rules prior to it
                            // were followed => we found the breaking rule
                            resolve(this.buildValidationResponse(false, firstRelevant.value(), true));
                        }
                    } else {
                        // We don't know yet, if it's valid or which rule is first failed
                        // so just continue waiting
                    }
                });
            });
        });
    }

    mergeFunctions(f1, f2) {
        return (value) => {
            if (f1 != null) {
                f1(value);
            }
            if (f2 != null) {
                f2(value);
            }
        };
    }

    render() {
        return React.cloneElement(
            this.getInput(),
            {
                'onChange': this.mergeFunctions(this.getInput().props.onChange, this.onInputChange)
            },
            this.getInput().props.children);
    }
}
