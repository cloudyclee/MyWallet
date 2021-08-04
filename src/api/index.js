import {
    apiUserRegister,
    apiUserLogin,
    apiUserLoginWithGoogle,
    apiUserUpdate,
    apiUsersDelete,
    apiUserDelete
} from "./userRequest";
import {
    apiWalletCreate,
    apiWalletsRead,
    apiWalletRead,
    apiWalletUpdate,
    apiWalletsDelete,
    apiWalletDelete
} from "./walletRequest";

export const postApiUserRegister = apiUserRegister;
export const postApiUserLogin = apiUserLogin;
export const postApiUserLoginWithGoogle = apiUserLoginWithGoogle;
export const patchApiUserUpdate = apiUserUpdate;
export const deleteApiUsersDelete = apiUsersDelete;
export const deleteApiUserDelete = apiUserDelete;

export const postApiWalletCreate = apiWalletCreate;
export const getApiWalletsRead = apiWalletsRead;
export const getApiWalletRead = apiWalletRead;
export const patchApiWalletUpdate = apiWalletUpdate;
export const deleteApiWalletsDelete = apiWalletsDelete;
export const deleteApiWalletDelete = apiWalletDelete;