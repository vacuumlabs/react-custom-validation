import css from 'next/css'

export default css.merge(
  css({
    width: '90%',
  }),
  css.$(' input', {
    display: 'block',
    fontSize: '150%',
    width: '100%',
    marginBottom: '0.5ex',
  }),
  css.$(' button', {
    fontSize: '150%'
  }),
  css.$(' label', {
    marginTop: '2ex',
    display: 'block'
  }),
  css.$(' span', {
    color: 'red',
    display: 'block'
  })
)
