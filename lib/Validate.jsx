import React from 'react';
import Promise from 'bluebird';
import Rx from 'rx';

function validationSuccessful(result) {
    // Successful if result is (undefined, null or true)
    return ((result == null) || (result === true));
}

export function and(rules) {
    return (value) => {
        return new Promise((resolve, reject) => {
            if (rules.length === 0) {
                // Trivial case, there are no rules
                resolve(null);
            }
            // Beginning to validate
            const valResults = rules.map((rule) => rule(value));
            valResults.forEach((resPromise) => {
                resPromise.then((result) => {
                    let index = 0;
                    while ((index < valResults.length) && (valResults[index].isFulfilled()) && validationSuccessful(valResults[index].value())) {
                        index++;
                    }
                    let firstRelevant = (index < valResults.length ? valResults[index] : valResults[valResults.length - 1]);
                    if (firstRelevant.isFulfilled()) {
                        // The promise is completed
                        resolve(firstRelevant.value());
                    } else { // eslint-disable-line 
                        // We don't know yet, if it's valid or which rule is first failed
                        // so just continue waiting
                    }
                });
            });
        });
    };
}


export class Validate extends React.Component {

    static defaultProps = {
        onValidation: (v) => {}
    }

    constructor(props) {
        super(props);
        // Collect rules (functions) & promisify
        // Rule functions should have signature (value, callback)
        this.rules = this.children.slice(1);
        this.subjectStream = new Rx.Subject();
        this.isInitialValidation = true;
    }

    componentDidMount() {
        this.subscription = this.subjectStream
            .debounce(500)
            .startWith(this.input.props.value)
            .flatMapLatest(
                (value) => Rx.Observable.fromPromise(this.validate(value)))
            .subscribe(
                (validationResult) => this.props.onValidation(validationResult));
    }

    componentWillUnmount() {
        this.subjectStream.dispose();
    }

    buildValidationResponse(valid, error, showValidation) {
        return {
            'valid': valid,
            'error': error,
            'showValidation': showValidation
        };
    }

    onInputChange = (e) => {
        // Input has changed -> fire event, should not show validation
        this.props.onValidation(this.buildValidationResponse(null, null, false));
        this.subjectStream.onNext(e.target.value);
    }

    get children() {
        const c = this.props.children;
        return c instanceof Array ? c : [c];
    }

    get input() {
        return this.children[0];
    }

    validate(value) {
        let shouldShowValidation = true;
        if (this.isInitialValidation) {
            shouldShowValidation = false;
            this.isInitialValidation = false;
        }
        this.props.onValidation(this.buildValidationResponse(null, null, shouldShowValidation));
        return and(this.rules)(value).then((result) => {
            if (validationSuccessful(result)) {
                // successfully (null, undefined, true)
                return this.buildValidationResponse(true, null, shouldShowValidation);
            } else {
                // There is a rule, which was broken, but all rules prior to it
                // were followed => we found the breaking rule
                return this.buildValidationResponse(false, result, shouldShowValidation);
            }
        });
    }

    mergeFunctions(...fns) {
        return (value) => fns
            .filter((f) => f != null)
            .forEach((f)=> f(value));
    }

    render() {
        return React.cloneElement(
            this.input,
            {
                'onChange': this.mergeFunctions(this.input.props.onChange, this.onInputChange)
            },
            this.input.props.children);
    }
}
