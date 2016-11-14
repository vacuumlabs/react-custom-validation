import {style, merge, $} from 'glamor'

export default merge(
  style({
    width: '100%',
    margin: '0 auto',
    fontFamily: 'Helvetica, Arial, sans-serif',
    boxSizing: 'border-box',
    textAlign: 'center',
  }),
  $(' h1', {
    marginTop: '0',
    color: '#444',
  }),
  $(' input', {
    boxSizing: 'border-box',
    display: 'block',
    width: '1rem',
    margin: '0 auto .5rem auto',
  }),
  $(' input[type=text]', {
    display: 'block',
    height: '2rem',
    width: '100%',
    padding: '0 .5rem',
    marginTop: '1rem',
    marginBottom: '1rem',
    borderRadius: '.25rem',
    border: '1px solid #ddd',
    boxSizing: 'border-box',
    maxWidth: '60%',
  }),
  $(' input:focus', {
    outline: 'none',
    borderColor: '#aaa',
  }),
  $(' button', {
    height: '2rem',
    width: '5rem',
    textTransform: 'uppercase',
    borderRadius: '.25rem',
    border: '0',
    backgroundColor: '#dc0067',
    color: 'white',
  }),
  $(' label', {
    display: 'inline-block',
    color: '#444',
    marginBottom: '.5rem',
    marginRight: '1rem',
    fontSize: '0.9rem',
    paddingLeft: '.4rem',
  }),
  $(' .error', {
    color: '#d22424',
    display: 'block',
    fontSize: '0.9rem',
    margin: '1rem auto',
    maxWidth: '60%',
  })
)
