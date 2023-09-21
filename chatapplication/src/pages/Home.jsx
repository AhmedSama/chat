import GoogleSignButton from '../components/GoogleSignButton'

const Home = () => {
  console.log(process.env.REACT_APP_SERVER_URL)
  return (
    <div className='center'>
        <div className='form'>
            <h1>Sign in please</h1>
            <GoogleSignButton />
        </div>
    </div>
  )
}

export default Home