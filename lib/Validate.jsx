import React from 'react';
import Promise from 'bluebird';
import Rx from 'rx';

export function validationSuccessful(result) {
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

function wrapToList(obj) {
    return obj instanceof Array ? obj : [obj];
}

function stripNull(arr) {
    return arr.filter((e) => e != null);
}

export class Validate extends React.Component {

    static defaultProps = {
        onValidation: (v) => {}
    }

    constructor(props) {
        super(props);
        // Collect rules (functions) & promisify
        // Rule functions should have signature (value, callback)
        this.rules = this.children.slice(1).map((elem) => (value) => elem.type(value, elem.props));
        if ((this.input.props.value || this.input.props.onChange) != null) {
            console.error(`Properties "value" and "onChange" should be defined on the wrapping "Validate" component.`);
        }
        this.userInteracted = false;
    }

    componentDidUpdate(prevProps, prevState) {
        const [oldRules, newRules] = [prevProps, this.props].map((p) => stripNull(wrapToList(p.children)).slice(1));
        let rulesChanged = !this.rulesEqual(oldRules, newRules);
        if (rulesChanged) {
            // Rules have changed, validate immediately with (possibly new) value in props
            this.rules = stripNull(wrapToList(this.props.children)).slice(1).map((elem) => (value) => elem.type(value, elem.props));
            this.propsChanged.onNext(this.props.value);
        } else if (prevProps.value !== this.props.value) {
            // Input value has changed, validate
            prevProps.onValidation(this.buildValidationResponse(null, null, false));
            this.inputChanged.onNext(this.props.value);
        }
    }

    componentDidMount() {
        this.inputChanged = new Rx.Subject();
        this.propsChanged = new Rx.Subject();
        this.subscription = Rx.Observable
            .merge(
                this.inputChanged
                .debounce(500)
                .startWith(this.props.value),
                this.propsChanged)
            .flatMapLatest(
                (value) => Rx.Observable.fromPromise(this.validate(value)))
            .subscribe(
                (validationResult) => this.props.onValidation(validationResult));
    }

    componentWillUnmount() {
        this.inputChanged.dispose();
    }

    rulesEqual(rules1, rules2) {
        if (rules1.length !== rules2.length) {
            return false;
        }
        let ruleEqual = (rule1, rule2) => {
            if ((rule1.type !== rule2.type) || (rule1.props.length !== rule2.props.length)) {
                return false;
            }
            for (let prop in rule1.props) {
                if (rule1.props[prop] !== rule2.props[prop]) {
                    return false;
                }
            }
            return true;
        };
        return rules1.every((rule, ind) => ruleEqual(rule, rules2[ind]));
    }

    buildValidationResponse(valid, error, showValidation) {
        return {valid, error, showValidation};
    }

    onInputChange = (e) => {
        // Input has changed -> user interacted. Propagate event
        this.userInteracted = true;
        this.props.onChange(e);
    }

    get children() {
        return stripNull(wrapToList(this.props.children));
    }

    get input() {
        return this.children[0];
    }

    validate(value) {
        this.props.onValidation(this.buildValidationResponse(null, null, this.userInteracted));
        return and(this.rules)(value).then((result) => {
            if (validationSuccessful(result)) {
                // successfully (null, undefined, true)
                return this.buildValidationResponse(true, null, this.userInteracted);
            } else {
                // There is a rule, which was broken, but all rules prior to it
                // were followed => we found the breaking rule
                return this.buildValidationResponse(false, result, this.userInteracted);
            }
        });
    }

    render() {
        return React.cloneElement(
            this.input,
            {
                'onChange': this.onInputChange,
                'value': this.props.value
            },
            this.input.props.children);
    }
}
