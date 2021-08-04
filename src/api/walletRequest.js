import axios from "axios";
const localURL = "http://localhost:3000/api/wallet";
const url = "https://my-wallet-by-jin.herokuapp.com/api/wallet";

const walletRequest = axios.create( {
    baseURL: url
} );
const headerObj = ( token ) => {
    return { headers: { Authorization: token } };
};

export const apiWalletCreate = ( data, token ) => walletRequest.post( "/", data, headerObj( token ) );
export const apiWalletsRead = ( token ) => walletRequest.get( "/", headerObj( token ) );
export const apiWalletRead = ( token, _id ) => walletRequest.get( `/${ _id }`, headerObj( token ) );
export const apiWalletUpdate = ( data, token, _id ) => walletRequest.patch( `/${ _id }`, data, headerObj( token ) );
export const apiWalletsDelete = ( token ) => walletRequest.delete( "/", headerObj( token ) );
export const apiWalletDelete = ( token, _id ) => walletRequest.delete( `/${ _id }`, headerObj( token ) );

