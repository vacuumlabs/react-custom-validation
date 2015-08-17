'use strict';

import React from 'react';
import {Validate, IsEmail, IsRequired, HasNumber, HasLength} from '../lib/validation';

export class App extends React.Component {

    constructor(props) {
        super(props);
        let createState = (...fields) => {
            let state = {};
            fields.forEach((f) => {
                state[f + '_message'] = '';
                state[f + '_showValidation'] = false;
                state[f + '_value'] = '';
            });
            return state;
        };
        this.state = createState('email', 'password');
    }

    handleChange = (inputName) => (e) => {
        this.setState({
            [inputName + '_value']: e.target.value
        });
    }

    handleValidation = (inputName) => (validity) => {
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
            [inputName + '_message']: message,
            [inputName + '_showValidation']: validity.showValidation
        });
    }

    renderMessage(inputName) {
        return this.state[inputName + '_showValidation'] ? this.state[inputName + '_message'] : null;
    }

    render() {
        return (
            <div>
                <label htmlFor="email">Email: </label>
                <Validate onValidation={this.handleValidation('email')} >
                    <input id="email" onChange={this.handleChange('email')} type="text" value={this.state.email_value} />
                    <IsRequired />
                    <IsEmail msg="The E-mail you entered is invalid" />
                </Validate>
                <div>{this.renderMessage('email')}</div>
                <label htmlFor="password">Password: </label>
                <Validate onValidation={this.handleValidation('password')} >
                    <input id="password" onChange={this.handleChange('password')} type="text" value={this.state.password_value} />
                    <IsRequired />
                    <HasLength min={6} max={10} />
                    <HasNumber />
                </Validate>
                <div>{this.renderMessage('password')}</div>
            </div>
        );
    }
}
