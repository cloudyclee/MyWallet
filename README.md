# 記帳程式

此專案是我給自己的一個挑戰。自學前後端技能一段時間後，想瞭解自己究竟能做出怎樣的東西。

日常生活中我常需要記帳，因此決定自己做一個記帳程式。目前市面上的記帳 app 雖仍滿足我大部分的需求，但仍有一些點我不太滿意：
- 無法整合信用卡與錢包的消費
- 查看帳務分析報表時無法自由選擇想要分析的項目

由於第一點需要串接銀行的API，考量到這並非能夠輕易獲得資格之事，因此對於本專案的需求草擬如下：
1. 基本記帳功能 (包括在同使用者帳戶中開設子帳戶，模擬一個人擁有許多帳戶需要記錄)
2. 適合行動裝置使用
3. 在帳務分析方面，能夠選擇想要查看的分析項目

## 架構規劃與使用工具

為使前端透過自行開設的 API 操作資料庫的使用者以及帳務資料，選擇使用 MEVN ( MongoDB、Express.js、Vue.js、Node.js ) 架構，如此達成前後端分離。

- 前端
	- 使用 Vue3 並搭配 Vue CLI 部署開發環境，搭配使用 element-plus 框架打造元件與頁面
	- 使用 Vuex 管理資料流
	- 使用 Vue Router 實作前端路由
	- 使用 axios 套件呼叫後端 API
	- 使用 echarts 與 vue-echarts 套件繪製分析圖表

- 後端
	- 使用 Node.js 搭配 Express 框架，打造後端 API
	- 使用 MongoDB 的雲端服務 MongoDB Atlas，開設一個新的資料庫，並建立 2 個 collection，一個儲存使用者資料，另一個儲存帳務資料
	- 使用 mongoose 套件串接 express 與 MongoDB Atlas
	- 使用 passport.js 與 jsonwebtoken 套件處理使用者的登入驗證
	- 使用 bcrypt 套件進行使用者的密碼加密程序
	- 使用 joi 套件驗證 post 進來的資料
	- 將 API 部署至 Heroku 上


## 後端實作與技術細節

- model 設定
	- 製作 `user` 與 `wallet` 兩個 mongoose mmodel，並在 `index.js` 統一輸出模組
	
	- user model 設定
		- 建立 `userSchema`
			1. `userName`：長度介於 2 到 50 字元的字串，必要值
			2. `userEmail`：字串，必要值
			3. `date`：時間，預設值為現在時間
			4. `password`：本地註冊之使用者自設的密碼，長度介於 6 至 1024 字元的字串
			5. `googleID`：字串，以 google 登入之使用者的 google ID
			6. `accountType`：字串，為 user 或 admin 其中之一，管理操作權限
			7. `mainWallet`：objectId，使用者的主錢包
			8. `expenseType`：陣列，使用者的支出類型，擁有預設項目
			9. `incomeType`：陣列，使用者的收入類型，擁有預設項目
			
		- 建立 `userschema` 的方法
			1. `isUser`：判斷 `accountType` 欄位是否為 user
			2. `isAdmin`：判斷 `accountType` 欄位是否為 admin
			3. `comparePassword`：使用 `bycrypt.compare`，檢查傳進來的參數與 `password` 欄位值是否相符，並回傳結果
			
		- 建立 `userSchema` 的 middleware：在資料進行 save 動作之前，判斷使用者為非以 google 登入 ( google ID 為空 )，且是新使用者或密碼有經過修改，使用 bcrypt 套件將 `password` 欄位資料進行加密後再儲存
	
	- wallet model 設定
		- 建立 `userSchema`
			1. `walletUserID`：objectId，為該錢包的使用者 ID，必要值
			2. `walletName`：長度 2 至 30 字元的字串，使用者設定之錢包名稱，必要值
			3. `initialTotal`：數字，錢包初始餘額，必要值
			4. `transaction`：為一陣列，陣列每一項為一筆交易記錄，並為一個 mongoose schema
				* `date`：日期，預設為現在時間，必要值
				* `amount`：數字，此筆交易金額，必要值
				* `transType`：字串，為 expense 或 income 其中之一，必要值
				* `consumeType`：字串，為 `userSchema` 中 `expenseType` 或 `incomeType` 陣列中的其中一項，必要值
				* `note`：字串，交易備註，最大長度 100 字元

- 後端路由設定
	- 製作 `user` 與 `wallet` 兩個 express router，並在 `index.js` 統一輸出模組
	
	- `/api/auth` ( user route )
		1. **post** `/register`：提供使用者註冊。先使用 joi 套件進行驗證，必須有 `userName`、`userEmail`、`password`、`accountType`等 4 個欄位。通過驗證後儲存使用者資訊
		2. **post** `/login`：提供使用者登入。先使用 joi 套件進行驗證，必須有 `userEmail` 與 `password` 欄位。通過驗證後，先尋找是否有此信箱，若無則返回 401 錯誤；若有則使用 `comparePassword` 方法比對使用者提供之密碼與資料庫中找到的該筆資料的密碼是否一致。若不一致返回 401 錯誤，若一致則將找尋到的該筆資料中的 `_id` 與 `userEmail` 利用 jsonwebtoken 套件打包成 JSON web token，並返回給前端
		3. **post** `/google`：提供使用者使用 google 帳號登入。前端 post 進來的資料為一串 token ，解密後可得到該使用者相關的 google 資訊。先尋找資料庫中是否有提供之 googleID，若無則儲存該使用者資料。接著將該筆儲存的資料 ( 或找到的資料 ) 中的 `_id` 與 `userEmail` 利用 jsonwebtoken 套件打包成 JSON web token，並返回給前端
		4. **patch** `/user`： 提供使用者修改資料。需先用 JSON web token 進行驗證，若有符合的使用者才有權使用此 API。權限驗證通過後接著使用 joi 進行資料驗證，通過後使用 `findOneAndUpdate` 方法改變資料並儲存。
		5. **delete** `/user/:_id`：提供系統管理者刪除某一使用者。使用 isAdmin 方法驗證是否擁有權限，否則不可使用此 API。前端沒有實作此功能，僅為練習撰寫 RESTful API 而開設此 route
		6. **delete** `/user`：提供系統管理者刪除所有使用者。使用 isAdmin 方法驗證是否擁有權限，否則不可使用此 API。前端沒有實作此功能，僅為練習撰寫 RESTful API 而開設此 route
	
	- `/api/wallet` ( wallet route )：所有子 route 都需需先用 JSON web token 進行驗證，若有符合的使用者才有權使用下列 API
		1. **post** `/`：提供使用者新增錢包帳戶。若資料通過 joi 驗證，則可於資料庫建立新錢包
		2. **get** `/`： 取得某一使用者所有的錢包帳戶
		3. **get** `/:_id`： 取得某一使用者的某一錢包帳戶
		4. **patch** `/:_id`：修改某一使用者的某一錢包帳戶中的資訊。包括新增、讀取、修改、刪除錢包帳戶中的交易記錄也是使用此 route
		5. **delete** `/:_id`：提供使用者刪除某一錢包帳戶，其中該錢包帳戶的 `walletUserID` 需與使用者的 `_id` 相符
		6. **delete** `/`：提供系統管理者刪除使用者的所有錢包帳戶。使用 isAdmin 方法驗證是否擁有權限，否則不可使用此 API。前端沒有實作此功能，僅為練習撰寫 RESTful API 而開設此 route
	
	- `/`：首頁
	
	- `/*`：不匹配上述任一 route 者，則返回 404 錯誤

- joi 設定
	- 在根目錄下建立 `validation.js` 檔
	- 引入 `joi` 套件，並建立 joi object 以驗證前端傳遞之資料，包括註冊用、登入用、修改使用者資訊用、新增或修改錢包資訊用。並將這些驗證模組個別輸出，使其可以在 route 檔中引入

- passport 設定
	- 根目錄下建立 `config` 資料夾，並於其中建立 `passport_jwt.js` 檔
	- 首先引入 `passport-jwt` 套件中的相關方法：
	
	```
const JwtStrategy = require( "passport-jwt" ).Strategy;
const ExtractJwt = require( "passport-jwt" ).ExtractJwt;
	```
	
	- 也需要引入 user model
	- 使用 `ExtractJwt.fromAuthHeaderWithScheme()` 方法，便可驗證夾帶在 Header 中的 jwt tokenm。相關使用方式可參考[官方文件](http://www.passportjs.org/packages/passport-jwt/)

## 前端功能實現與技術細節

- 前端引入 Element-plus 框架

	- 全局引入 Element-plus，首先
	
	```
import { createApp } from 'vue';
import App from './App.vue';
import ElementPlus from 'element-plus';
import 'element-plus/lib/theme-chalk/index.css';
	```
	
	接著
	
	```
const app = createApp( App );
app.use( ElementPlus ).mount( "#app" )
	```
	
	- ElementPlus 本地化設定
	
	```
import 'dayjs/locale/zh-tw';
...
dayjs.locale( 'tw' );
app.use( ElementPlus, { locale } ).mount( "#app" )
	```
	
- API 模組化與攔截器
	- 在 `/src` 目錄中新增 `api` 資料夾
	- 資料夾內新增 `index.js`，作為存取 API 服務的統一進入點
	- 另外新增 `userRequest.js` 與 `walletRequest.js`，模組化 API 服務。例如：
	
	```
import axios from "axios";
const userRequest = axios.create( {...} );
export const apiUserLogin = ( data ) => userRequest.post( URI, data );
	```
	
	接著在 `index.js`：
	
	```
import { apiUserLogin } from "./userRequest";
export const postApiUserLogin = apiUserLogin;
	```
	
	在需使用 API 服務之處即可引入 ( 例如`store/user/index.js` 內 )：
	
	```
	import { postApiUserLogin } from "../../api";
	```
	
	- 實作 API 攔截器，統一 API 的錯誤處例與等待資料回傳
		- 統一錯誤處理
		
		首先定義錯誤處理函式：
			```
const errorHandling = ( err ) => {
	let errObj;
	if ( err.response ) {
		// 接受到 response 但 response 回應錯誤時
		...
		errObj = err.response.data;
	} else if ( err.request ) {
		// 已發出 request 但沒有收到 response
		...
		errObj = err.request;
	} else {
		// 發出 request 的過程中遭遇錯誤
		...
		errObj = err.message;
	}
	return errObj;
};
			```
		
		接著在 `axios.create` 創造出來的實體中，註冊攔截器 `interceptors`，並使用此函式
		
			```
const Request = axios.create( {...} );
Request.interceptors.request.use(
	( config ) => {
		...
	},
	( error ) => {
		const e = errorHandling( error );
		return Promise.reject( e );
	}
);
			```
			```
userRequest.interceptors.response.use(
	( response ) => {
		...
	},
	( error ) => {
		const e = errorHandling( error );
		return Promise.reject( e );
	}
);
			```
		
		- 處理等待資料回傳時的畫面：引入 element-plus 中的 loading 服務，在送出 requset 時開啟loading frame，並於錯誤發生時或接受到回傳資料時關閉。相關使用方式可參照[官方文件](https://element-plus.org/#/zh-CN/component/loading)
- Vuex
- Vue Router
- component
- views
- 輸出設定





