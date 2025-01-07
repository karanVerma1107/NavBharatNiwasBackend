import express from 'express';

import { isAuthenticatedUser } from '../middleware/auth.js';
import {  getUserFromToken, getValidFormIds, logout, otpSendToVerify, sendLoginOtp, verifyOtpAndCreateAccount, verifyOtpAndLogin } from '../controllers/UserControllers.js';
import { createForm, createIsAllowForm, getIsallowLatest, getUserFormFilledWithOpeningDate} from '../controllers/drawControllers.js';
import { upload } from '../middleware/helper/multer.js';

const Urouter = express.Router();

Urouter.route('/sendSignupotp').post(otpSendToVerify);
Urouter.route('/verifySignupOtp').post(verifyOtpAndCreateAccount);
Urouter.route('/sendLoginOtp').post(sendLoginOtp);
Urouter.route('/verifyLoginOtp').post(verifyOtpAndLogin);
Urouter.route('/logout').post(isAuthenticatedUser, logout);
Urouter.route('/filldraw').post(isAuthenticatedUser, createForm);
Urouter.route('/create-draw').post(isAuthenticatedUser,upload.single('image'), createForm);
Urouter.route('/isAllowLatest').get(getIsallowLatest);
Urouter.route('/user-valid-id').get(isAuthenticatedUser,getValidFormIds);
Urouter.route('/me').get(isAuthenticatedUser, getUserFromToken);
Urouter.route('/getApplications').get(isAuthenticatedUser,getUserFormFilledWithOpeningDate);

export default Urouter;