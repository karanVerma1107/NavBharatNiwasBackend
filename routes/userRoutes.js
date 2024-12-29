import express from 'express';

import { isAuthenticatedUser } from '../middleware/auth.js';
import { addToLuckyDraw, logout, otpSendToVerify, sendLoginOtp, verifyOtpAndCreateAccount, verifyOtpAndLogin } from '../controllers/UserControllers.js';
import { createForm, deleteFormsBeforeDate, getAllForms } from '../controllers/drawControllers.js';

const Urouter = express.Router();

Urouter.route('/sendSignupotp').post(otpSendToVerify);
Urouter.route('/verifySignupOtp').post(verifyOtpAndCreateAccount);
Urouter.route('/sendLoginOtp').post(sendLoginOtp);
Urouter.route('/verifyLoginOtp').post(verifyOtpAndLogin);
Urouter.route('/logout').post(isAuthenticatedUser, logout);
Urouter.route('/luckydraw/:userName').post(isAuthenticatedUser,addToLuckyDraw);
Urouter.route('/filldraw').post(isAuthenticatedUser, createForm);
Urouter.route('/getDrawForms').get(isAuthenticatedUser, getAllForms);
Urouter.route('/deleteForms').delete(isAuthenticatedUser, deleteFormsBeforeDate);

export default Urouter;