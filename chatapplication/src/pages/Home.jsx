import GoogleSignButton from '../components/GoogleSignButton'

const Home = () => {
  return (
    <div className='center h-100'>
        <div className='form'>
            <h1>Sign in please</h1>
            <p>
            we won't post anything anywhere.
            </p>
            <GoogleSignButton />
        </div>
    </div>
  )
}

export default Home