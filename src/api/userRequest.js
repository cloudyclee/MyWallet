import axios from "axios";
const url = "http://localhost:3000/api/auth";

const userRequest = axios.create( {
    baseURL: url
} );
const headerObj = ( token ) => {
    return { headers: { Authorization: token } };
};

export const apiUserRegister = data => userRequest.post( "/register", data );
export const apiUserLogin = data => userRequest.post( "/login", data );
export const apiUserLoginWithGoogle = ( data ) => userRequest.post( "/google", data );
export const apiUserUpdate = ( data, token ) => userRequest.patch( "/user", data, headerObj( token ) );
export const apiUsersDelete = ( token ) => userRequest.delete( "/user", headerObj( token ) );
export const apiUserDelete = ( token, _id ) => userRequest.delete( `/user/${ _id }`, headerObj( token ) );