import {style, merge, $} from 'glamor'

export default merge(
  style({
    width: '100%',
    margin: '0 auto',
    fontFamily: 'Helvetica, Arial, sans-serif',
    boxSizing: 'border-box',
  }),
  $(' h1', {
    marginTop: '0',
    color: '#444',
  }),
  $(' input[type=text]', {
    height: '2rem',
    padding: '0 .5rem',
    margin: '.5rem',
    borderRadius: '.25rem',
    border: '1px solid #ddd',
    boxSizing: 'border-box',
    textAlign: 'center',
  }),
  $(' input:focus', {
    outline: 'none',
    borderColor: '#aaa',
  }),
  $(' button', {
    height: '2rem',
    textTransform: 'uppercase',
    borderRadius: '.25rem',
    border: '0',
    backgroundColor: '#dc0067',
    color: 'white',
    cursor: 'pointer',
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
    fontSize: '0.9rem',
    margin: '1rem auto',
    marginLeft: '1rem',
  }),
  $(' .buttons', {
    display: 'flex',
  }),
  $(' .buttons button', {
    marginLeft: '.5rem',
  })
)
