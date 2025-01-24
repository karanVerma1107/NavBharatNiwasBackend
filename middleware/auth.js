import User from "../DataModels/userSchema.js";
import jwt from "jsonwebtoken";
import asyncHandler from "./helper/asyncHandler.js";
import ErrorHandler from "./apiError.js";

// Function to verify access token and fetch user from DB
const verifyAccess = async (token) => {
    try {
        if (!token) {
            throw new ErrorHandler('Login to access this resource', 401);
        }

        // Verify the JWT token
        const decodedData = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        if (!decodedData || decodedData === undefined) {
            throw new ErrorHandler('User not found, login to access this resource', 401);
        }

        // Fetch user from DB based on the decoded _id
        const user = await User.findById(decodedData._id);

        if (!user || user == undefined) {
            throw new ErrorHandler('User not found', 401);
        }

        return { user, decodedData };
    } catch (error) {
        console.log('Ultimate error: ', error);
        throw new ErrorHandler('Invalid token', 402);
    }
};

// Middleware to check if the user is authenticated
export const isAuthenticatedUser = asyncHandler(async (req, res, next) => {
    let token;

    const userAgent = req.headers['user-agent'];
    const isIphone = /iPhone/i.test(userAgent);  // Check for iPhone
    const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);  // Check for Safari browser

    // If device is iPhone or Safari, get the token from the session
    if (isIphone || isSafari) {
        token = req.session.accessToken;
        console.log("Access token from session:", token);
    } else {
        // Otherwise, get the token from cookies
        token = req.cookies.accessToken;
        console.log("Access token from cookies:", token);
    }

    // If no token is found, return error
    if (!token) {
        return next(new ErrorHandler('Login to access this resource', 401));
    }

    try {
        // Verify the access token (from session or cookie)
        const { user, decodedData } = await verifyAccess(token);

        // If user or decoded data is not found, return error
        if (!user || !decodedData) {
            return next(new ErrorHandler('Login to access this resource', 401));
        }

        // Attach user and decodedData to the request object
        req.user = user;
        req.tokenData = decodedData;
        console.log("Decoded data:", decodedData);
        console.log("User is:", user);

        // Proceed to next middleware or route handler
        next();
    } catch (error) {
        console.log('Auth error:', error);
        return next(new ErrorHandler('Login to access this resource', 401));
    }
});
