import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import React from 'react'
import { auth } from '../firebase';
import { useDispatch } from 'react-redux';
import { setUserData } from '../slices/userSlice';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';

const GoogleSignButton = () => {
    const provider = new GoogleAuthProvider();

    const dispatch = useDispatch()
    const navigate = useNavigate()
    const signin = () => {
        signInWithPopup(auth, provider)
            .then((result) => {
                // This gives you a Google Access Token. You can use it to access the Google API.
                // const credential = GoogleAuthProvider.credentialFromResult(result);
                // const token = credential.accessToken;
                // The signed-in user info.
                const user = result.user;
                dispatch(setUserData({
                    id : user.uid,
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL
                }))
                axiosInstance.post("/adduser",{
                    id : user.uid,
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL
                })
                .then((response) => {
                    console.log('POST request successful:', response.data);
                })
                .catch((error) => {
                    console.error('Error making POST request:', error);
                });
                navigate("/chat")
            }).catch((error) => {
                // Handle Errors here.
                const errorCode = error.code;
                const errorMessage = error.message;
                // The email of the user's account used.
                const email = error.customData.email;
                // The AuthCredential type that was used.
                const credential = GoogleAuthProvider.credentialFromError(error);
                // ...
            });
    }
    return (
        <button onClick={signin} className='google-btn'>Sign in with google</button>
    )
}

export default GoogleSignButton