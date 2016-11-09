import css from 'next/css'

export default css.merge(
  css({
    width: '95%',
    maxWidth: '20rem',
    margin: '0 auto',
    fontFamily: 'Helvetica, Arial, sans-serif',
    boxSizing: 'border-box',
    textAlign: 'center',
  }),
  css.$(' h1', {
    marginTop: '0',
    color: '#444',
  }),
  css.$(' input', {
    display: 'block',
    height: '2rem',
    width: '100%',
    padding: '0 .5rem',
    marginBottom: '1rem',
    borderRadius: '.25rem',
    border: '1px solid #ddd',
    boxSizing: 'border-box',
  }),
  css.$(' input:focus', {
    outline: 'none',
    borderColor: '#aaa',
  }),
  css.$(' button', {
    height: '2rem',
    width: '5rem',
    textTransform: 'uppercase',
    borderRadius: '.25rem',
    border: '0',
    backgroundColor: '#dc0067',
    color: 'white',
  }),
  css.$(' label', {
    display: 'block',
    color: '#444',
    float: 'left',
    marginBottom: '.5rem',
    fontSize: '0.9rem',
    paddingLeft: '.4rem',
  }),
  css.$(' span', {
    color: '#d22424',
    float: 'right',
    display: 'block',
    fontSize: '0.9rem',
    paddingRight: '.4rem',
  })
)
