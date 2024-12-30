import LuckyDraw from "../DataModels/LuckyDraw.js";
import User from "../DataModels/userSchema.js";
import asyncHandler from "../middleware/helper/asyncHandler.js";
import ErrorHandler from "../middleware/apiError.js";
import sendEmail from "../middleware/helper/sendEmail.js";
import fs from 'fs';
import {v2 as cloudinary} from 'cloudinary';


cloudinary.config({
    cloud_name: "dwpdxuksp",
    api_key: "611646721796323",
    api_secret: "ejsJOwHcdFugMNDFy88WXPtPMd8"
});

// Create a new form
export const createForm = asyncHandler(async (req, res, next) => {
    const { name, phoneNo, siteName, fatherName, AdhaarNo, PANno, status } = req.body;
    const image = req.file; // Assuming single image upload

    try {
        // Get user ID from req.user
        const userId = req.user._id;

        // Find the user by ID to get their email and name
        const user = await User.findById(userId);
        if (!user) {
            return next(new ErrorHandler('User not found', 404));
        }

        // Check if image was uploaded
        if (!image) {
            return next(new ErrorHandler('No image uploaded for the form', 400));
        }

        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(image.path);
        const imageUrl = result.secure_url; // Store the Cloudinary URL

        // Delete local file after upload to Cloudinary
        fs.unlink(image.path, (err) => {
            if (err) {
                console.error(`Failed to delete file: ${image.path}`, err);
            } else {
                console.log(`File deleted from local server: ${image.path}`);
            }
        });

        // Create a new form
        const newForm = new LuckyDraw({
            userId,
            name,
            phoneNo,
            siteName,
            fatherName,
            AdhaarNo,
            PANno,
            status,
            image: imageUrl // Store the Cloudinary URL in the form
        });

        // Save the form
        await newForm.save();

        user.formFilled.push(newForm._id);
        await user.save();


        // Compose the email text
        const text = `Your application for lucky draw for <b>${siteName}</b> has been submitted but is in <b>PENDING</b> state. To approve it, contact 9696581944.`;

        // Send email to the user
        await sendEmail({
            email: user.email,
            subject: 'Application Form PENDING State Submitted',
            html: text // Use the html field to send HTML content
        });

        res.status(201).json({
            success: true,
            message: 'Form created successfully',
            form: newForm
        });
    } catch (error) {
        console.log('Error while creating form:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});




// Get all forms with pagination (admin only)
export const getAllForms = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    try {
        // Check if the requesting user is an admin
        if (req.user.role !== 'admin') {
            return next(new ErrorHandler('You are not authorized to perform this action', 403));
        }

        // Find all forms with pagination
        const forms = await LuckyDraw.find()
            .sort({ createdAt: -1 }) // Sort in reverse order by creation date
            .skip(skip)
            .limit(limit);

        const totalForms = await LuckyDraw.countDocuments();

        res.status(200).json({
            success: true,
            count: forms.length,
            totalForms,
            totalPages: Math.ceil(totalForms / limit),
            currentPage: page,
            forms
        });
    } catch (error) {
        console.log('Error while fetching forms:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});


// Delete forms before a specified month and year
export const deleteFormsBeforeDate = asyncHandler(async (req, res, next) => {
    const { year, month } = req.body;

    try {
        // Validate year and month
        const yearInt = parseInt(year);
        const monthInt = parseInt(month);

        if (isNaN(yearInt) || isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
            return next(new ErrorHandler('Invalid year or month', 400));
        }

        // Create a date object for the first day of the specified month and year
        const date = new Date(yearInt, monthInt - 1, 1);

        // Delete forms created before the specified date
        const result = await LuckyDraw.deleteMany({ createdAt: { $lt: date } });

        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} forms created before ${date.toLocaleString('default', { month: 'long' })} ${yearInt}`
        });
    } catch (error) {
        console.log('Error while deleting forms:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});



// Get LuckyDraw form by ID (admin only)
export const getLuckyDrawById = asyncHandler(async (req, res, next) => {
    const { id } = req.body;

    try {
        // Check if the requesting user is an admin
        if (req.user.role !== 'admin') {
            return next(new ErrorHandler('You are not authorized to perform this action', 403));
        }

        // Find the LuckyDraw form by ID
        const luckyDraw = await LuckyDraw.findById(id).populate('name');
        if (!luckyDraw) {
            return next(new ErrorHandler('LuckyDraw form not found', 404));
        }

        res.status(200).json({
            success: true,
            luckyDraw
        });
    } catch (error) {
        console.log('Error while fetching LuckyDraw form:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});


// Get LuckyDraw form by ID
export const getLuckyDrawByIdFromParams = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    try {

 // Check if the requesting user is an admin
 if (req.user.role !== 'admin') {
    return next(new ErrorHandler('You are not authorized to perform this action', 403));
}

        // Find the LuckyDraw form by ID
        const luckyDraw = await LuckyDraw.findById(id);
        if (!luckyDraw) {
            return next(new ErrorHandler('LuckyDraw form not found', 404));
        }

        res.status(200).json({
            success: true,
            luckyDraw
        });
    } catch (error) {
        console.log('Error while fetching LuckyDraw form:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});


// Edit LuckyDraw form status (admin only)
export const editLuckyDrawStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        // Check if the requesting user is an admin
        if (req.user.role !== 'admin') {
            return next(new ErrorHandler('You are not authorized to perform this action', 403));
        }

        // Find the LuckyDraw form by ID
        const luckyDraw = await LuckyDraw.findById(id);
        if (!luckyDraw) {
            return next(new ErrorHandler('LuckyDraw form not found', 404));
        }

        // Update the status
        luckyDraw.status = status;

        // Save the updated form
        await luckyDraw.save();

        res.status(200).json({
            success: true,
            message: 'LuckyDraw form status updated successfully',
            luckyDraw
        });
    } catch (error) {
        console.log('Error while updating LuckyDraw form status:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});