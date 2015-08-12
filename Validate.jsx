'use strict';

var Promise = require('bluebird');
var React = require('react');
var Rx = require('rx');

module.exports = React.createClass({

    rules: [],
    validationResults: [],
    subjectStream: null,
    subscription: null,

    getInitialState: function() {
        return {
            'value': '',
            'error': '',
            'valid': null
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
        this.subscription = this.subjectStream.debounce(300).subscribe(
            (val) => this.validate(),
            (err) => console.log('Error: ' + err),
            () => console.log('Completed')
        );
    },

    validate: function() {
        this.rules.forEach((rule, ruleIndex) => {
            this.validationResults[ruleIndex] = rule(this.state.value).cancellable();
        });
        this.validationResults.forEach((resPromise) => {
            resPromise.then((result) => {
                let index = 0;
                while ((index < this.validationResults.length) && (this.validationResults[index].isFulfilled()) && (this.validationResults[index].value() == null)) {
                    index++;
                }
                let firstRelevant = (index < this.validationResults.length ? this.validationResults[index] : this.validationResults[this.validationResults.length - 1]);
                if (firstRelevant.isFulfilled()) {
                    // The promise is completed
                    if (firstRelevant.value() == null) {
                        // successfully
                        this.validationResults.map((e) => null);
                        if (this.state.valid !== true) {
                            // Validity has changed, trigger event
                            this.setState({
                                'valid': true,
                                'error' : ''
                            }, function() {
                                console.log('success');
                                this.props.onValidation(true);
                            });
                        }
                    } else {
                        // There is a rule, which was broken, but all rules prior to it
                        // were followed => we found the breaking rule
                        // We shall cancel all the running promises
                        this.validationResults.map((e) => null);
                        this.validationResults.forEach((res) => res.cancel());
                        if (this.state.error !== firstRelevant) {
                            // Validity has changed (different error), trigger event
                            this.setState({
                                'valid': false,
                                'error': firstRelevant
                            }, function() {
                                console.log('fail');
                                this.props.onValidation(firstRelevant.value());
                            });
                        }
                    }
                } else {
                    // We don't know yet, if it's valid or which rule is first failed
                    // so just continue waiting
                }
            });
        });
    },

    renderInjectedElement: function(element, propsToInject) {
        return React.cloneElement(element, propsToInject);
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
