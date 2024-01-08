import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
    const [username, setUsername] = useState(null);
    const [profilePhoto, setProfilePhoto] = useState("");
    const [id, setId] = useState(null);

    useEffect(() => {
        try{
            axios.get('/profile').then(response => {
                setId(response.data.userId);
                setUsername(response.data.username);
                setProfilePhoto(response.data.profilePhoto);
            });
        }
        catch (error){
            console.error("An error occured", error);
        }
    }, []);

    return (
        <UserContext.Provider value={{ username, setUsername, id, setId, profilePhoto, setProfilePhoto }}>
            {children}
        </UserContext.Provider>
    )
}
