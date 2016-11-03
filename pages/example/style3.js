import css from 'next/css'

export default css.merge(
  css({
    width: '100%',
    margin: '0 auto',
    fontFamily: 'Helvetica, Arial, sans-serif',
    boxSizing: 'border-box',
  }),
  css.$(' h1', {
    marginTop: '0',
    color: '#444',
  }),
  css.$(' input[type=text]', {
    height: '2rem',
    padding: '0 .5rem',
    margin: '.5rem',
    borderRadius: '.25rem',
    border: '1px solid #ddd',
    boxSizing: 'border-box',
    textAlign: 'center',
  }),
  css.$(' input:focus', {
    outline: 'none',
    borderColor: '#aaa',
  }),
  css.$(' button', {
    height: '2rem',
    textTransform: 'uppercase',
    borderRadius: '.25rem',
    border: '0',
    backgroundColor: '#dc0067',
    color: 'white',
    cursor: 'pointer',
  }),
  css.$(' label', {
    display: 'inline-block',
    color: '#444',
    marginBottom: '.5rem',
    marginRight: '1rem',
    fontSize: '0.9rem',
    paddingLeft: '.4rem',
  }),
  css.$(' .error', {
    fontSize: '0.9rem',
    margin: '1rem auto',
    marginLeft: '1rem',
  }),
  css.$(' .buttons', {
    display: 'flex',
  }),
  css.$(' .buttons button', {
    marginLeft: '.5rem',
  })
)
