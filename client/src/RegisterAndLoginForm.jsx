import axios from 'axios';
import React, { useContext, useState } from 'react'
import { UserContext } from './UserContext';

function RegisterAndLoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [profilePhoto, setProfilePhoto] = useState(null);

    const [isLoginOrRegister, setIsLoginOrRegister] = useState('login');

    const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);


    // async function handleSubmit(ev) {
    //     ev.preventDefault();
    //     const url = (isLoginOrRegister === 'register') ? 'register' : 'login';
    //     const formData = new FormData();
    //     formData.append('username', username);
    //     formData.append('password', password);
    //     formData.append('profilePhoto', profilePhoto);
    //     try {
    //         const { data } = await axios.post(url, formData, {
    //             headers: {
    //                 'Content-Type': 'multipart/form-data', // Ensure the correct content-type header
    //             },
    //         });
    //         setLoggedInUsername(username);
    //         setId(data.id);
    //     }
    //     catch (error) {
    //         console.error('Error sending registration data:', error);
    //     }

    //     // const { data } = await axios.post(url, { username, password, profilePhoto });
    // }

    async function handleSubmit(ev) {
        ev.preventDefault();
        // if(isLoginOrRegister === 'register'){
        //     const url = 'register';
        //     // const url = (isLoginOrRegister === 'register') ? 'register' : 'login';
        //     console.log(profilePhoto);
        //     const { data } = await axios.post(url, { username, password, profilePhoto });
        //     setLoggedInUsername(username);
        //     setId(data.id);
        // }
        // else{
        //     handleLogin(ev);
        // }
        if (isLoginOrRegister === 'register') {
            const url = '/register';

            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);
            formData.append('profilePhoto', profilePhoto);

            try {
                const { data } = await axios.post(url, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data', // Important to set the correct content type
                    },
                });

                setLoggedInUsername(username);
                setId(data.id);
            } catch (error) {
                // Handle the error
                console.error('Error:', error);
            }
        } else {
            handleLogin(ev);
        }
    }
    async function handleLogin(ev) {
        const { data } = await axios.post('login', { username, password });
        setLoggedInUsername(username);
        setId(data.id);
    }

    function handleProfilePhoto(ev) {
        const image = ev.target.files[0];
        setProfilePhoto(image);
        // const reader = new FileReader();
        // reader.readAsDataURL(image);
        // reader.onload = () => {
        //     setProfilePhoto({
        //         name: image.name,
        //         data: reader.result,
        //     });
        // };
    }

    return (
        <div className='bg-blue-50 h-screen flex items-center'>
            <form className='w-64 mx-auto mb-12' onSubmit={handleSubmit}>

                <input
                    value={username} onChange={ev => setUsername(ev.target.value)}
                    type="text" placeholder='username' className='block w-full rounded-sm p-2 mb-5 border' />

                <input
                    value={password} onChange={ev => setPassword(ev.target.value)}
                    type="password" placeholder='password' className='block w-full rounded-sm p-2 mb-5 border' />

                {isLoginOrRegister === "register" && (
                    <div className="block mb-5 mt-5">
                        Upload Profile Photo
                        <input type="file" accept="image/*" className='mt-2' onChange={handleProfilePhoto} />
                    </div>
                )}
                <button className='bg-blue-500 text-white block w-full rounded-sm p-2'>
                    {isLoginOrRegister === 'register' ? 'Register' : "Login"}
                </button>

                <div className='text-center mt-2'>
                    {isLoginOrRegister === 'register' && (
                        <div>
                            Already a member?&nbsp;

                            <button className="text-blue-600" onClick={() => setIsLoginOrRegister('login')}>
                                Login here
                            </button>
                        </div>
                    )}
                    {isLoginOrRegister === 'login' && (
                        <div>
                            Don't have an account?&nbsp;
                            <button className="text-blue-600" onClick={() => setIsLoginOrRegister('register')}>
                                Register
                            </button>
                        </div>
                    )}

                </div>
            </form>
        </div>
    )
}

export default RegisterAndLoginForm