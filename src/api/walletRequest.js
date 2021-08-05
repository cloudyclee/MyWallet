import axios from "axios";
import { ElMessage, ElLoading } from "element-plus";

const localURL = "http://localhost:3000/api/wallet";
const url = "https://my-wallet-by-jin.herokuapp.com/api/wallet";

const walletRequest = axios.create( {
    baseURL: url
} );
const headerObj = ( token ) => {
    return { headers: { Authorization: token } };
};

let loadingInstance = null;
let needLoadingRequestCount = 0;

const startLoading = () => {
    loadingInstance = ElLoading.service( {
        fullscreen: true,
        lock: true,
        text: "Loading",
        spinner: "el-icon-loading",
        background: "rgba(0, 0, 0, 0.7)",
    } );
};
const endLoading = () => {
    loadingInstance.close();
};
const showFullScreenLoading = () => {
    if ( needLoadingRequestCount === 0 ) {
        startLoading();
    }
    needLoadingRequestCount++;
};
const tryHideFullScreenLoading = () => {
    if ( needLoadingRequestCount <= 0 ) return;
    needLoadingRequestCount--;
    if ( needLoadingRequestCount === 0 ) {
        endLoading();
    }
};

const errorHandling = ( err ) => {
    let errObj;
    if ( err.response ) {
        // Request made and server responded
        console.log( err.response.data );
        console.log( err.response.status );
        ElMessage.error( { message: err.response.data.msg, customClass: "maxWidth-90", center: true } );
        errObj = err.response.data;
    } else if ( err.request ) {
        // The request was made but no response was received
        console.log( err.request );
        ElMessage.error( { message: "系統錯誤，請洽客服人員", customClass: "maxWidth-90", center: true } );
        errObj = err.request;
    } else {
        // Something happened in setting up the request that triggered an Error
        console.log( 'Error', err.message );
        ElMessage.error( { message: "系統錯誤，請洽客服人員", customClass: "maxWidth-90", center: true } );
        errObj = err.message;
    }
    return errObj;
};

walletRequest.interceptors.request.use(
    ( config ) => {
        showFullScreenLoading();
        return config;
    },
    ( error ) => {
        tryHideFullScreenLoading();
        const e = errorHandling( error );
        return Promise.reject( e );
    }
);

walletRequest.interceptors.response.use(
    ( response ) => {
        tryHideFullScreenLoading();
        return response;
    },
    ( error ) => {
        tryHideFullScreenLoading();
        const e = errorHandling( error );
        return Promise.reject( e );
    }
);

export const apiWalletCreate = ( data, token ) => walletRequest.post( "/", data, headerObj( token ) );
export const apiWalletsRead = ( token ) => walletRequest.get( "/", headerObj( token ) );
export const apiWalletRead = ( token, _id ) => walletRequest.get( `/${ _id }`, headerObj( token ) );
export const apiWalletUpdate = ( data, token, _id ) => walletRequest.patch( `/${ _id }`, data, headerObj( token ) );
export const apiWalletsDelete = ( token ) => walletRequest.delete( "/", headerObj( token ) );
export const apiWalletDelete = ( token, _id ) => walletRequest.delete( `/${ _id }`, headerObj( token ) );

