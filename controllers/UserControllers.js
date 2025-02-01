import User from "../DataModels/userSchema.js";
import FAQ from "../DataModels/FAQ.js"; 
import {v2 as cloudinary} from 'cloudinary';
import ErrorHandler from "../middleware/apiError.js";
import asyncHandler from "../middleware/helper/asyncHandler.js";
import sendEmail from "../middleware/helper/sendEmail.js";
import fs from 'fs';    
import LuckyDraw from "../DataModels/LuckyDraw.js";
import session from "express-session";
import { Domain } from "domain";

cloudinary.config({
    cloud_name: "dwpdxuksp",
    api_key: "611646721796323",
    api_secret: "ejsJOwHcdFugMNDFy88WXPtPMd8"
});

//function that generate OTP
const generateOTP = ()=>{
    return Math.floor(100000 + Math.random()*900000).toString();
}



//generate and save tokens 
const generateAndsaveTokens = async(user, res)=>{
    console.log("chlra hu")
    try {
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;

        await user.save();


        const accessToken =  await user.generateAccessToken();
        
        res.cookie('accessToken',
            accessToken,{
                httpOnly: true,
                secure: true,
                sameSite: 'None',
                expires: new Date( Date.now() + 15*24*60*60*1000 ),
                //domain: '.navbharatniwas.in',
                path:'/',
                

            }
        )

        console.log('refreshToken: ', refreshToken);
        console.log('accessToken: ', accessToken);

        return {refreshToken, accessToken};


    } catch (error) {
        console.log('error of token is:', error)
        throw new Error('error in generating tokens')
    }
};









// OTP Send for Signup
export const otpSendToVerify = asyncHandler(async (req, res, next) => {
    const { name, email } = req.body;

    try {
        console.log('Email is:', email);

        // Check if the user already exists
        let existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return next(new ErrorHandler('User already exists with this email', 400));
        }

        // Generate OTP and set its expiration
        const otp = generateOTP();
        const otpExpire = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

        // Create a temporary user document for OTP verification
        const tempUser = new User({
            name: name,
            email: email,
            otp: otp,
            otpExpire: otpExpire,
            
        });

        
        const text = `
        <p>Your OTP for sign-up in Nav-Bharat-Niwas with Name: ${tempUser.name} is: ${otp}</p>
        <img src="https://navbharatniwas.in:3008/uploads/images/oo.jpg" width="194vmax" height="126.2vmax" style="margin: 2vmax;"  />
      `;

        // Send OTP email to the user
        await sendEmail({
            email: tempUser.email,
            subject: 'Nav-Bharat-Niwas Verification for Sign-Up',
            html: text
        });

        // Save the temporary user document
        await tempUser.save();

        // Respond back with success message
        return res.status(200).json({
            success: true,
            message: "OTP has been successfully sent to your email"
        });

    } catch (error) {
        console.log('Error while sending OTP:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});



// OTP Verification and Account Creation
export const verifyOtpAndCreateAccount = asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;
    console.log("runned here..");

    try {
        // Find the temporary user based on email
        const tempUser = await User.findOne({ email: email });
        if (!tempUser) {
            return next(new ErrorHandler('Invalid user or incorrect OTP', 400));
        }

        // Check if OTP has expired
        if (tempUser.otpExpire < Date.now()) {
            await tempUser.deleteOne(); // Optionally delete expired OTP
            return next(new ErrorHandler('OTP has expired, please try again', 400));
        }

        // Verify OTP
        const isOtpCorrect = await tempUser.isOtpCorrect(otp);
        if (!isOtpCorrect) {
            return next(new ErrorHandler('Invalid user or incorrect OTP', 400));
        }

        // Set role to 'admin' if email matches
        if (email === 'karanverma100po@gmail.com') {
            tempUser.role = 'admin';
        } else {
            tempUser.role = 'user';
        }

  // Generate username based on email (before the @ symbol)
  const username = email.split('@')[0];

  const accessToken = await generateAndsaveTokens(tempUser, res);

  tempUser.userName = username;

        // Save the updated user
        await tempUser.save();

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            user: tempUser,
            accessToken
        });
    } catch (error) {
        console.log('Error while verifying OTP and creating account:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});




//login otp send
export const sendLoginOtp = asyncHandler(async (req, res, next) => {
    const { email } = req.body;  // Get the email from the request body

    try {
        // Check if the user exists
        const user = await User.findOne({ email: email });
        if (!user) {
            return next(new ErrorHandler('User not found with this email', 404));
        }

        // Generate OTP and set its expiration time (10 minutes)
        const Otp = generateOTP();
        const OtpExpire = Date.now() + 10 * 60 * 1000;  // OTP expires in 10 minutes

        // Update the user's OTP and expiration time
        user.otp = Otp;
        user.otpExpire = OtpExpire;

        // Save the user document with the OTP information
        await user.save();

       // HTML content with the embedded image and margin
const text = `
<p>Your OTP for Login to Nav-Bharat-Niwas is: ${Otp}. This OTP is valid for 10 minutes.</p>
<img src="https://navbharatniwas.in:3008/uploads/images/oo.jpg" width="194vmax" height="126.2vmax" style="margin: 2vmax;" />
`;

        // Send the OTP email to the user
        await sendEmail({
            email: user.email,
            subject: 'Nav-Bharat-Niwas Login OTP',
            html: text
        });

        // Respond with a success message
        return res.status(200).json({
            success: true,
            message: 'OTP has been successfully sent to your email.'
        });

    } catch (error) {
        console.log('Error while sending login OTP:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});



// OTP Verification and Login
export const verifyOtpAndLogin = asyncHandler(async (req, res, next) => {
    const { email, Otp } = req.body;

    try {
        // Find the user based on email
        const user = await User.findOne({ email: email });
        if (!user) {
            return next(new ErrorHandler('User not found with this email', 400));
        }

        // Check if OTP has expired
        if (user.otpExpire < Date.now()) {
            // OTP expired, clear OTP and its expiration
            user.otp = null;
            user.otpExpire = null;
            await user.save();
            return next(new ErrorHandler('OTP has expired, please request a new one', 400));
        }

        // Verify if the provided OTP matches the stored OTP
        const isCorrect = await user.isOtpCorrect(Otp);
        if (!isCorrect) {
            // Clear OTP after incorrect attempt
            
            await user.save();
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP, please try again'
            });
        }

        // OTP is valid, now generate and return an access token
        const accessToken = await generateAndsaveTokens(user, res);  // Assuming tokens are generated and set via this function

        // Clear OTP after successful verification
       
        await user.save();

        // Respond with success message and the user's details
        return res.status(200).json({
            success: true,
            message: 'OTP verified successfully, login successful',
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                userName: user.userName,
            },
        });

    } catch (error) {
        console.log('Error during OTP verification and login:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});



// LogOut user by deleting the token from cookies
export const logout = asyncHandler(async (req, res, next) => {
    try {
        const user = req.user;

        if (!user) {
            return next(new ErrorHandler('User is not logged in', 400));
        }

        // Clear the access token from cookies
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: false,  // Set to true in production for HTTPS
            sameSite: 'Lax',
            path: '/'
        });

        // Optionally, clear refresh token from the user object
        user.refreshToken = null;
        await user.save();  // Save the user after clearing the refresh token

        

        // Return a successful response
        return res.status(200).json({
            success: true,
            message: 'User logged out successfully'
        });

    } catch (error) {
        console.log('Error during logout:', error);
        return next(new ErrorHandler('Logout failed', 500));
    }
});


// Get valid form IDs from user.formFilled
export const getValidFormIds = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    try {
        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return next(new ErrorHandler('User not found', 404));
        }

        // Filter valid form IDs
        const validFormIds = [];
        for (let i = 0; i < user.formFilled.length; i++) {
            const formId = user.formFilled[i];
            const form = await LuckyDraw.findById(formId);
            if (form) {
                validFormIds.push(formId);
            } else {
                // Remove invalid form ID from user.formFilled
                user.formFilled.splice(i, 1);
                i--; // Adjust index after removal
            }
        }

        // Save the updated user
        await user.save();

        res.status(200).json({
            success: true,
            validFormIds
        });
    } catch (error) {
        console.log('Error while fetching valid form IDs:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});


//get user from token
// Get user from token
export const getUserFromToken = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user.id; // Get user ID from req.user

        const user = await User.findById(userId); // Find user by ID

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized user'
            });
        }

        res.status(200).json({
            success: true,
            auth: true,
            user
        });
    } catch (error) {
        console.log('Error while fetching user from token:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});


