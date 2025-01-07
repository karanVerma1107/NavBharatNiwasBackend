import LuckyDraw from "../DataModels/LuckyDraw.js";
import User from "../DataModels/userSchema.js";
import asyncHandler from "../middleware/helper/asyncHandler.js";
import ErrorHandler from "../middleware/apiError.js";
import sendEmail from "../middleware/helper/sendEmail.js";
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import IsAllow from "../DataModels/allowForm.js";

cloudinary.config({
    cloud_name: "dwpdxuksp",
    api_key: "611646721796323",
    api_secret: "ejsJOwHcdFugMNDFy88WXPtPMd8"
});

// Create a new form
export const createForm = asyncHandler(async (req, res, next) => {
    const { name, phoneNo, occupation, fatherName, AdhaarNo, PANno, address } = req.body;
    const image = req.file; // Assuming single image upload
    

    try {
        // Get user ID from req.user
        const userId = req.user._id;

        if(!userId){
            return next(new ErrorHandler('login to access this resource', 401))
        }

        // Find the user by ID to get their email and name
        const user = await User.findById(userId);
        if (!user) {
            return next(new ErrorHandler('User not found', 404));
        }

        // Check if image was uploaded
        if (!image) {
            return next(new ErrorHandler('No image uploaded for the form', 400));
        }

        // Fetch the latest IsAllow document to check if the form is enabled and open
        const isAllowDoc = await IsAllow.findOne({ userId }).sort({ createdAt: -1 });

        // If no IsAllow document found or form is not enabled
        if (!isAllowDoc || !isAllowDoc.isEnabled) {
            return next(new ErrorHandler('Form is not enabled yet', 403));
        }

        // Check if today's date is before the formOpeningDate
        const today = new Date();
        const openingDate = new Date(isAllowDoc.formOpeningDate);

        // If the opening date is later than today, allow the user to fill the form
        if (today < openingDate) {
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
                occupation,
                fatherName,
                AdhaarNo,
                PANno,
                address,
                openingDate,
                image: imageUrl // Store the Cloudinary URL in the form
            });

            // Save the form
            await newForm.save();

            user.formFilled.push(newForm._id);
            await user.save();

            isAllowDoc.luckydraw.push(newForm._id); 
            await isAllowDoc.save();

            // Compose the email text
            const text = `Your application for lucky draw with ticket_id <b>${newForm._id}</b> has been submitted and is in <b>PENDING</b> state. To approve it, contact 9696581944.`;

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
        } else {
            return next(new ErrorHandler('Form is not open yet. Please wait until the opening date.', 403));
        }

    } catch (error) {
        console.log('Error while creating form:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});




// Create a new IsAllow entry (for enabling the form)
export const createIsAllowForm = asyncHandler(async (req, res, next) => {
    const { formName, formOpeningDate, isEnabled } = req.body;

    try {
        // Get user ID from req.user
        const userId = req.user._id;

        
        // Find the user by ID to check their role
        const user = await User.findById(userId);
        if (!user) {
            return next(new ErrorHandler('User not found', 404));
        }

        // Check if the user is an admin
        if (user.role !== 'admin') {
            return next(new ErrorHandler('You are not authorized to create this form', 403));
        }

        // Create the IsAllow document
        const newIsAllow = new IsAllow({
            formName,
            formOpeningDate,
            isEnabled,
            userId,
        });

        // Save the new IsAllow document
        await newIsAllow.save();

        res.status(201).json({
            success: true,
            message: 'Form permissions created successfully',
            isAllow: newIsAllow,
        });

    } catch (error) {
        console.log('Error while creating IsAllow form:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});





// Edit the IsAllow entry (for changing the form opening date)
export const editIsAllowForm = asyncHandler(async (req, res, next) => {
    const { id, formOpeningDate, isEnabled } = req.body;

    try {
        // Get user ID from req.user
        const userId = req.user._id;

        // Find the user by ID to check their role
        const user = await User.findById(userId);
        if (!user) {
            return next(new ErrorHandler('User not found', 404));
        }

        // Check if the user is an admin
        if (user.role !== 'admin') {
            return next(new ErrorHandler('You are not authorized to edit this form', 403));
        }

        // Find the existing IsAllow document by ID
        const isAllowDoc = await IsAllow.findById(id);
        if (!isAllowDoc) {
            return next(new ErrorHandler('IsAllow form not found', 404));
        }

        // Update the form opening date and isEnabled flag
        isAllowDoc.formOpeningDate = formOpeningDate || isAllowDoc.formOpeningDate;
        isAllowDoc.isEnabled = isEnabled !== undefined ? isEnabled : isAllowDoc.isEnabled;

        // Save the updated document
        await isAllowDoc.save();

        res.status(200).json({
            success: true,
            message: 'Form permissions updated successfully',
            isAllow: isAllowDoc,
        });

    } catch (error) {
        console.log('Error while editing IsAllow form:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});



// Delete IsAllow form and associated LuckyDraw documents with Cloudinary image deletion
export const deleteIsAllowForm = asyncHandler(async (req, res, next) => {
    const { id } = req.params; // ID of the IsAllow form to delete

    try {
        // Get user ID from req.user
        const userId = req.user._id;

        // Find the user by ID to check their role
        const user = await User.findById(userId);
        if (!user) {
            return next(new ErrorHandler('User not found', 404));
        }

        // Check if the user is an admin
        if (user.role !== 'admin') {
            return next(new ErrorHandler('You are not authorized to delete this form', 403));
        }

        // Find the IsAllow document to delete
        const isAllowDoc = await IsAllow.findById(id);
        if (!isAllowDoc) {
            return next(new ErrorHandler('IsAllow form not found', 404));
        }

        // Get the associated LuckyDraw IDs from the IsAllow form
        const luckyDrawIds = isAllowDoc.luckydraw;

        // Find all associated LuckyDraw documents
        const luckyDraws = await LuckyDraw.find({ '_id': { $in: luckyDrawIds } });
        
        // If there are any LuckyDraw documents, delete their images from Cloudinary
        if (luckyDraws.length > 0) {
            for (const luckyDraw of luckyDraws) {
                // Extract the public ID from the image URL
                const imagePublicId = luckyDraw.image.split('/').pop().split('.')[0]; // Assuming URL structure
                await cloudinary.uploader.destroy(imagePublicId);

                // Delete the LuckyDraw document
                await luckyDraw.remove();
            }
        }

        // Delete the IsAllow form document
        await isAllowDoc.remove();

        res.status(200).json({
            success: true,
            message: 'IsAllow form and associated LuckyDraws deleted successfully',
        });

    } catch (error) {
        console.log('Error while deleting IsAllow form:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});



// Approve or Reject the LuckyDraw
export const updateLuckyDrawStatus = asyncHandler(async (req, res, next) => {
    const { id, action } = req.body;  // Extract 'id' and 'action' from the request body

    try {
        // Get the logged-in user ID from req.user
        const userId = req.user._id;

        // Find the user by ID to check if the user is an admin
        const user = await User.findById(userId);
        if (!user) {
            return next(new ErrorHandler('User not found', 404));
        }

        // Check if the logged-in user is an admin
        if (user.role !== 'admin') {
            return next(new ErrorHandler('You are not authorized to approve or reject this LuckyDraw form', 403));
        }

        // Find the LuckyDraw form by its ID
        const luckyDraw = await LuckyDraw.findById(id);
        if (!luckyDraw) {
            return next(new ErrorHandler('LuckyDraw form not found', 404));
        }

        // Determine the new status based on the action
        let newStatus;
        if (action === 'approve') {
            newStatus = 'approved';
        } else if (action === 'reject') {
            newStatus = 'rejected';
        } else {
            return next(new ErrorHandler('Invalid action. Use "approve" or "reject".', 400));
        }

        // Update the LuckyDraw status
        luckyDraw.status = newStatus;
        await luckyDraw.save();

        // Fetch the user to whom the LuckyDraw belongs
        const luckyDrawUser = await User.findById(luckyDraw.userId);
        if (!luckyDrawUser) {
            return next(new ErrorHandler('User associated with this LuckyDraw not found', 404));
        }

        // If the action is approve, push the latest IsAllow document ID to the user's history
        if (newStatus === 'approved') {
            // Fetch the latest IsAllow document
            const latestIsAllow = await IsAllow.findOne({ userId }).sort({ createdAt: -1 });
            if (latestIsAllow) {
                // Push the latest IsAllow _id to the user's history
                luckyDrawUser.history.push(latestIsAllow._id);
                await luckyDrawUser.save();
            }
        }

        // Compose the email text
        const subject = `Your LuckyDraw form has been ${newStatus}`;
        const text = `Dear ${luckyDrawUser.name},<br><br>Your application for the LuckyDraw has been ${newStatus}.<br><br>Thank you for participating!`;

        // Send an email to the user notifying them of the approval/rejection
        await sendEmail({
            email: luckyDrawUser.email,
            subject,
            html: text // Use the html field to send HTML content
        });

        res.status(200).json({
            success: true,
            message: `LuckyDraw form has been ${newStatus} and an email has been sent to the user.`,
            luckyDraw: luckyDraw
        });

    } catch (error) {
        console.log('Error while updating LuckyDraw status:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});



// Function to search LuckyDraw by ID
export const searchLuckyDrawById = asyncHandler(async (req, res, next) => {
    const { id } = req.body; // Extract 'id' from the request body

    try {
        // Get the logged-in user ID from req.user
        const userId = req.user._id;

        // Find the user by ID to check if the user is an admin
        const user = await User.findById(userId);
        if (!user) {
            return next(new ErrorHandler('User not found', 404));
        }

        // Check if the logged-in user is an admin
        if (user.role !== 'admin') {
            return next(new ErrorHandler('You are not authorized to search this LuckyDraw form', 403));
        }

        // Find the LuckyDraw form by its ID
        const luckyDraw = await LuckyDraw.findById(id);
        if (!luckyDraw) {
            return next(new ErrorHandler('LuckyDraw form not found', 404));
        }

        // Return the LuckyDraw details
        res.status(200).json({
            success: true,
            message: 'LuckyDraw form found',
            luckyDraw
        });

    } catch (error) {
        console.log('Error while searching for LuckyDraw:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});



// Get all LuckyDraws with pagination (15 per page)
export const getLuckyDraws = asyncHandler(async (req, res, next) => {
    const { page = 1, limit = 15 } = req.query; // Default limit is now 15

    try {
        // Convert page and limit to integers
        const pageNumber = parseInt(page, 10);
        const pageLimit = parseInt(limit, 10);

        // Validate page and limit
        if (pageNumber < 1 || pageLimit < 1) {
            return next(new ErrorHandler('Page number and limit must be greater than 0.', 400));
        }

        // Calculate the starting index for pagination
        const skip = (pageNumber - 1) * pageLimit;

        // Get total count of documents in LuckyDraw collection
        const totalLuckyDraws = await LuckyDraw.countDocuments();

        // Fetch the lucky draws with pagination
        const luckyDraws = await LuckyDraw.find()
            .skip(skip)       // Skip the records before the page
            .limit(pageLimit) // Limit the number of records per page (15 items per page)
            .sort({ createdAt: -1 }); // Optionally, sort by creation date (descending)

        // Calculate total pages
        const totalPages = Math.ceil(totalLuckyDraws / pageLimit);

        res.status(200).json({
            success: true,
            totalLuckyDraws,
            totalPages,
            currentPage: pageNumber,
            luckyDraws
        });

    } catch (error) {
        console.log('Error while fetching LuckyDraws:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});



// Fetch the latest IsAllow document
export const getIsallowLatest = asyncHandler(async (req, res, next) => {
    try {
        // Query the database for the latest IsAllow document by sorting by createdAt in descending order
        const latestIsAllow = await IsAllow.findOne().sort({ createdAt: -1 });

        // If no IsAllow document is found, return an error response
        if (!latestIsAllow) {
            return next(new ErrorHandler('No IsAllow documents found', 404));
        }

        // Send the latest IsAllow document in the response
        res.status(200).json({
            success: true,
            isAllow: latestIsAllow
        });
    } catch (error) {
        console.log('Error while fetching latest IsAllow:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});



export const getUserFormFilledWithOpeningDate = asyncHandler(async (req, res, next) => {
    const userId = req.user._id; // Getting userId from req.user._id (assuming it's set by auth middleware)

    // Find the user by userId
    const user = await User.findById(userId);

    // If user doesn't exist, throw an error
    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    // Fetch LuckyDraw documents for each ID in formFilled
    const luckyDrawData = await Promise.all(
        user.formFilled.map(async (formId) => {
            const luckyDraw = await LuckyDraw.findById(formId).select('openingDate _id');

            // If LuckyDraw doesn't exist, we ignore it (or handle accordingly)
            if (!luckyDraw) return null;

            return {
                _id: luckyDraw._id,
                openingDate: luckyDraw.openingDate
            };
        })
    );

    // Remove any null results (for the case where a LuckyDraw wasn't found)
    const validLuckyDrawData = luckyDrawData.filter(item => item !== null);

    // Reverse the array to return it in reverse order
    const reversedLuckyDrawData = validLuckyDrawData.reverse();

    // Send the response with the reversed formFilled data
    res.status(200).json({
        success: true,
        formFilled: reversedLuckyDrawData
    });
});