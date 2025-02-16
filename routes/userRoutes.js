import express from 'express';

import { isAuthenticatedUser } from '../middleware/auth.js';
import {  getUserFromToken, getValidCompanyFillIds, getValidFormIds, logout, otpSendToVerify, sendLoginOtp, verifyOtpAndCreateAccount, verifyOtpAndLogin } from '../controllers/UserControllers.js';
import { createCompanyFill, createForm, createIsAllowForm, getIsallowLatest, getUserCompanyFillWithStatusDate, getUserFormFilledWithOpeningDate} from '../controllers/drawControllers.js';
import { upload } from '../middleware/helper/multer.js';


const Urouter = express.Router();

Urouter.route('/sendSignupotp').post(otpSendToVerify);
Urouter.route('/verifySignupOtp').post(verifyOtpAndCreateAccount);
Urouter.route('/sendLoginOtp').post(sendLoginOtp);
Urouter.route('/verifyLoginOtp').post(verifyOtpAndLogin);
Urouter.route('/logout').post(isAuthenticatedUser, logout);
Urouter.route('/filldraw').post(isAuthenticatedUser, createIsAllowForm);
Urouter.route('/create-draw')
  .post(
    isAuthenticatedUser, // Ensure user is authenticated
    upload.fields([       // Handle multiple files (profile, Aadhaar, PAN images)
      { name: 'image', maxCount: 1 }, // Profile image
      { name: 'adhaarPhoto', maxCount: 1 }, // Aadhaar image
      { name: 'panPhoto', maxCount: 1 } // PAN image
    ]),
    createForm // Call the createForm function to handle form creation
  );

  
Urouter.route('/company-fill').post(isAuthenticatedUser, upload.fields([
  { name: 'panPhoto', maxCount: 1 }, // PAN image
  { name: 'passportPhoto', maxCount: 1 } // Passport image
]), createCompanyFill);



Urouter.route('/isAllowLatest').get(getIsallowLatest);
Urouter.route('/user-valid-id').get(isAuthenticatedUser,getValidFormIds);
Urouter.route('/user-Cvalid-id').get(isAuthenticatedUser,getValidCompanyFillIds);

Urouter.route('/me').get(isAuthenticatedUser, getUserFromToken);
Urouter.route('/getApplications').get(isAuthenticatedUser,getUserFormFilledWithOpeningDate);
Urouter.route('/getCApplications').get(isAuthenticatedUser, getUserCompanyFillWithStatusDate);

export default Urouter;