import User from "../DataModels/userSchema.js";
import jwt from "jsonwebtoken";
import asyncHandler from "./helper/asyncHandler.js";
import ErrorHandler from "./apiError.js";


 

const verifyAccess =  async (token) =>{
    try {

        if(!token){
            throw new ErrorHandler('loggin to access this resource', 401);
        }

       const decodedData = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET );
       
if(!decodedData || decodedData === undefined){
    throw new ErrorHandler('user not found, login to access this resource', 401)
}

       const user = await User.findById(decodedData._id);

       if(!user || user == undefined){
throw new ErrorHandler('user not found', 401)
       }

       return { user, decodedData };
    } catch (error) {
        console.log('ultimate error: ', error)
    
     throw new ErrorHandler('invalidToken', 402)
    }
}

export const isAuthenticatedUser = asyncHandler(async (req, res, next) => {
    const token = req.cookies.accessToken;
    
    if (!token) {
        return next(new ErrorHandler('Login to access this resource', 401));
    }

    try {
        const { user, decodedData } = await verifyAccess(token);
       
        if (!user || !decodedData) {
            return next(new ErrorHandler('Login to access this resource', 401));
        }

        req.user = user;
        req.tokenData = decodedData;
     
        next();
    } catch (error) {
        console.log('Auth error:', error);
        return next(new ErrorHandler('Login to access this resource', 401));
    }
});