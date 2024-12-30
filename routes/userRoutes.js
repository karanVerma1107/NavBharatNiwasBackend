import express from 'express';

import { isAuthenticatedUser } from '../middleware/auth.js';
import {  getValidFormIds, logout, otpSendToVerify, sendLoginOtp, verifyOtpAndCreateAccount, verifyOtpAndLogin } from '../controllers/UserControllers.js';
import { createForm, deleteFormsBeforeDate, editLuckyDrawStatus, getAllForms, getLuckyDrawById, getLuckyDrawByIdFromParams } from '../controllers/drawControllers.js';

const Urouter = express.Router();

Urouter.route('/sendSignupotp').post(otpSendToVerify);
Urouter.route('/verifySignupOtp').post(verifyOtpAndCreateAccount);
Urouter.route('/sendLoginOtp').post(sendLoginOtp);
Urouter.route('/verifyLoginOtp').post(verifyOtpAndLogin);
Urouter.route('/logout').post(isAuthenticatedUser, logout);
Urouter.route('/filldraw').post(isAuthenticatedUser, createForm);
Urouter.route('/getDrawForms').get(isAuthenticatedUser, getAllForms);
Urouter.route('/deleteForms').delete(isAuthenticatedUser, deleteFormsBeforeDate);
Urouter.route('/searchForm').post(isAuthenticatedUser, getLuckyDrawById);
Urouter.route('/forms/:id').get(isAuthenticatedUser,getLuckyDrawByIdFromParams);
Urouter.route('/status-form').put(isAuthenticatedUser,editLuckyDrawStatus);
Urouter.route('/user-valid-id').get(isAuthenticatedUser,getValidFormIds);

export default Urouter;