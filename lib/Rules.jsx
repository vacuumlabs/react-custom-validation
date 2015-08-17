import Promise from 'bluebird';
import validator from 'validator';

export function IsEmail(value, {msg}) {
    return Promise.resolve(validator.isEmail(value) || msg || 'Please enter a valid email.');
}

export function IsRequired(value, {msg}) {
    return Promise.resolve(value.length > 0 || msg || 'This field is required.');
}

export function HasNumber(value, {msg}) {
    return Promise.resolve(value.match(/.*[0-9]+.*/i) === null ?
            (msg || 'This field should contain at least one number.')
        :
            true);
}

export function HasLength(value, {msg, min, max}) {
    return Promise.resolve(
        (!value || (((min == null) || (value.length >= min)) && ((max == null) || (value.length <= max))))
        || msg
        || `Length should be between ${min} and ${max}`);
}
