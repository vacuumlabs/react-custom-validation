'use strict';

var React = require('react');
var Validate = require('../lib/Validate.jsx');
var Promise = require('bluebird');

module.exports = React.createClass({

    getInitialState: function() {
        return {
            'message': '',
            'showValidation': false,
            'inputValue': ''
        };
    },

    handleInputChange: function(e) {
        this.setState({
            'inputValue': e.target.value
        });
    },

    handleValidation: function(validity) {
        let message = '';
        switch (validity.valid) {
            case null:
                message = 'validating';
                break;
            case true:
                message = 'Valid !';
                break;
            case false:
                message = validity.error;
                break;
        }
        this.setState({
            'message': message,
            'showValidation': validity.showValidation
        });
    },

    render: function() {
        return (
            <div>
                <Validate onValidation={this.handleValidation} >
                    <input onChange={this.handleInputChange} type="text" value={this.state.inputValue} />
                    {(value) =>
                        new Promise((resolve, reject) => {
                            if (value[0] !== 'a') {
                                resolve('It should begin with "a"');
                            } else {
                                resolve(null);
                            }
                        })
                    }
                    {(value) =>
                        new Promise((resolve, reject) => {
                            // This is an async rule, which takes 1s to evaluate
                            let message = null;
                            if (value.length < 5) {
                                message = 'Too short';
                            } else if (value.length > 10) {
                                message = 'Too long';
                            }
                            setTimeout(function() {
                                resolve(message);
                            }, 1000);
                        })
                    }
                    {(value) =>
                        new Promise((resolve, reject) => {
                            if (value.slice(-7) !== 'awesome') {
                                resolve('Your suffix should be awesome !');
                            } else {
                                resolve(null);
                            }
                        })
                    }
                </Validate>
                <div>{this.state.showValidation ? this.state.message : ''}</div>
            </div>
        );
    }
});
