'use strict';

var React = require('react');
var Validate = require('../lib/Validate.jsx');

module.exports = React.createClass({

    getInitialState: function() {
        return {
            'message': '',
            'showValidation': false
        };
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
                    <input type="text" />
                    {(value, callback) => {
                        // This is an async rule, which takes 1s to evaluate
                        let message = null;
                        if (value.length < 5) {
                            message = 'Too short';
                        } else if (value.length > 10) {
                            message = 'Too long';
                        }
                        setTimeout(function() {callback(null, message); }, 1000);
                    }}
                    {(value) => {
                        if (value.slice(-7) !== 'awesome') {
                            return 'Your suffix should be awesome !';
                        }
                    }}
                </Validate>
                <div>{this.state.showValidation ? this.state.message : ''}</div>
            </div>
        );
    }
});
