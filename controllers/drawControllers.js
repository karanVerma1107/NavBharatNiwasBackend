import LuckyDraw from "../DataModels/LuckyDraw.js";
import User from "../DataModels/userSchema.js";
import asyncHandler from "../middleware/helper/asyncHandler.js";
import ErrorHandler from "../middleware/apiError.js";

// Create a new form
export const createForm = asyncHandler(async (req, res, next) => {
    const { name, phoneNo, siteName } = req.body;

    try {
        // Get user ID from req.user
        const userId = req.user._id;

        // Create a new form
        const newForm = new LuckyDraw({
            userId,
            name,
            phoneNo,
            siteName
        });

        // Save the form
        await newForm.save();

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