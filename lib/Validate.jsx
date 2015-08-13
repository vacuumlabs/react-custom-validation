'use strict';

var Promise = require('bluebird');
var React = require('react');
var Rx = require('rx');

module.exports = React.createClass({

    rules: [],
    subjectStream: null,
    subscription: null,

    getInitialState: function() {
        return {
            'value': ''
        };
    },

    buildValidationResponse: function(valid, error, showValidation) {
        return {
            'valid': valid,
            'error': error,
            'showValidation': showValidation
        };
    },

    onInputChange: function(e) {
        this.setState({
            'value': e.target.value
        }, function() {
            this.subjectStream.onNext(this.state.value);
        });
    },

    hasAnyRules: function() {
        return 'length' in this.props.children;
    },

    getInputValue: function() {
        return this.state.value;
    },

    componentDidMount: function() {
        // Collect rules (functions) & promisify
        // Rule functions should have signature (value, callback)
        if (this.hasAnyRules()) {
            this.rules = this.props.children.slice(1);
            this.rules = this.rules.map((func) => {
                if (func.length === 1) {
                    // func has 1 argument => doesnt have callback defined
                    return Promise.promisify((arg, callback) => {
                        callback(null, func(arg));
                    });
                } else {
                    return Promise.promisify(func);
                }
            });
            // Init array fields with null
            this.validationResults = Array.apply(null, new Array(this.rules.length)).map((x) => null);
        }
        this.subjectStream = new Rx.Subject();
        this.subscription = this.subjectStream
            .debounce(500)
            .flatMapLatest(
                (value) => Rx.Observable.fromPromise(this.validate(value)))
            .subscribe(
                (validationResult) => this.props.onValidation(validationResult));
    },

    validate: function(value) {
        return new Promise((resolve, reject) => {
            console.log('validation began');
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
    },

    renderInjectedElement: function(element, propsToInject) {
        return React.cloneElement(element, propsToInject, element.props.children);
    },

    render: function() {
        return this.renderInjectedElement(
            this.hasAnyRules() ? this.props.children[0] : this.props.children,
            {
                'onChange': this.onInputChange,
                'value': this.state.value
            });
    }
});
