'use strict';

var React = require('react');
var Validate = require('../lib/Validate.jsx');

module.exports = React.createClass({
    render: function() {
        return (
            <Validate onValidation={(val) => console.log("Res: " + val)} >
                <input type="text" />
                {(value, callback) => {
                    if (value.length < 5) {
                        callback(null, 'Too short');
                    } else if (value.length > 10) {
                        callback(null, 'Too long');
                    } else {
                        callback(null, null);
                    }
                }}
                {(value) => {
                    if (value.slice(-7) !== 'awesome') {
                        return 'Your suffix should be awesome !';
                    }
                }}
            </Validate>
        );
    }
});
