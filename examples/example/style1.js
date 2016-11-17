import {style, merge, $} from 'glamor'

export default merge(
  style({
    width: '95%',
    maxWidth: '20rem',
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
    display: 'block',
    height: '2rem',
    width: '100%',
    padding: '0 .5rem',
    marginBottom: '1rem',
    borderRadius: '.25rem',
    border: '1px solid #ddd',
    boxSizing: 'border-box',
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
    display: 'block',
    color: '#444',
    float: 'left',
    marginBottom: '.5rem',
    fontSize: '0.9rem',
    paddingLeft: '.4rem',
  }),
  $(' span', {
    color: '#d22424',
    float: 'right',
    display: 'block',
    fontSize: '0.9rem',
    paddingRight: '.4rem',
  })
)
