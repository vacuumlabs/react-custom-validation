'use strict';

var React = require('react');
var Validate = require('../lib/Validate.jsx');

module.exports = React.createClass({

    getInitialState: function() {
        return {
            'message': ''
        };
    },

    handleValidation: function(validity) {
        switch (validity.valid) {
            case null:
                this.setState({
                    'message': 'validating'
                });
                break;
            case true:
                this.setState({
                    'message': 'Valid !'
                });
                break;
            case false:
                this.setState({
                    'message': validity.error
                });
        }
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
                <div>{this.state.message}</div>
            </div>
        );
    }
});
