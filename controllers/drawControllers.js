import LuckyDraw from "../DataModels/LuckyDraw.js";
import User from "../DataModels/userSchema.js";
import asyncHandler from "../middleware/helper/asyncHandler.js";
import ErrorHandler from "../middleware/apiError.js";
import sendEmail from "../middleware/helper/sendEmail.js";
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import moment from 'moment';
import FAQ from "../DataModels/FAQ.js";
import IsAllow from "../DataModels/allowForm.js";

cloudinary.config({
    cloud_name: "dwpdxuksp",
    api_key: "611646721796323",
    api_secret: "ejsJOwHcdFugMNDFy88WXPtPMd8"
});

// Create a new form
export const createForm = asyncHandler(async (req, res, next) => {
    const { name, phoneNo, occupation, fatherName, AdhaarNo, PANno, address, DOB, nationality, project } = req.body;
    const image = req.file; // Assuming single image upload

    try {
        // Get user ID from req.user
        const userId = req.user._id;

        if (!userId) {
            return next(new ErrorHandler('Login to access this resource', 401));
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
        const isAllowDoc = await IsAllow.findOne().sort({ createdAt: -1 });
        console.log('now, isallow', isAllowDoc);

        // If no IsAllow document found or form is not enabled
        if (!isAllowDoc || !isAllowDoc.isEnabled) {
            console.log('isallow', isAllowDoc);
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

            // Create a new form with additional fields: DOB, nationality, and project
            const newForm = new LuckyDraw({
                userId,
                name,
                phoneNo,
                occupation,
                fatherName,
                AdhaarNo,
                PANno,
                address,
                DOB,               // Added DOB
                nationality,       // Added nationality
                project,           // Added project
                openingDate,
                image: imageUrl // Store the Cloudinary URL in the form
            });

            // Save the form
            await newForm.save();

            // Link the form to the user and IsAllow documents
            user.formFilled.push(newForm._id);
            await user.save();

            isAllowDoc.luckydraw.push(newForm._id);

            await isAllowDoc.save().then(console.log('isallow now,', isAllowDoc));

            // Compose the email text
            const text = `
<p>Dear ${user.name},</p>
<p>Your application for the Lucky Draw with ticket ID <b>${newForm._id}</b> has been submitted and is currently in <b>PENDING</b> state.</p>
<p>To approve the application, please contact: <b>+917531027943</b></p>
<p><b>LINK:</b> <a href="https://navbharatniwas.in/draw/${newForm._id}">Click here to view your application</a></p>
<p>Thank you for participating!</p>
`;

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

        // If the action is reject, remove the latest IsAllow document ID from the user's history
        if (newStatus === 'rejected') {
            const latestIsAllow = await IsAllow.findOne({ userId }).sort({ createdAt: -1 });
            console.log('rejecting')
            if (latestIsAllow) {
                // Remove the latest IsAllow _id from the user's history
                const historyIndex = luckyDrawUser.history.indexOf(latestIsAllow._id);
                if (historyIndex > -1) {
                    luckyDrawUser.history.splice(historyIndex, 1);  // Remove the IsAllow ID from history array
                    await luckyDrawUser.save();
                }
            }
        }

        // If the action is approve, push the latest IsAllow document ID to the user's history
        if (newStatus === 'approved') {
            const latestIsAllow = await IsAllow.findOne({ userId }).sort({ createdAt: -1 });
            if (latestIsAllow) {
                luckyDrawUser.history.push(latestIsAllow._id);
                await luckyDrawUser.save();
            }
        }

        // Compose the email text
        const subject = `Your LuckyDraw form has been ${newStatus}`;
        const text = `Dear ${luckyDrawUser.name},<br><br>
Your application for the LuckyDraw with ticket_id: <b>${luckyDraw._id}</b> has been <b>${newStatus}</b>.<br><br>
Thank you for participating!<br><br>
<b>LINK:</b> <a href="https://navbharatniwas.in/draw/${luckyDraw._id}">https://navbharatniwas.in/draw/${luckyDraw._id}</a>`;


        // Send an email to the user notifying them of the approval/rejection
        await sendEmail({
            email: luckyDrawUser.email,
            subject,
            html: text // Use the html field to send HTML content
        });

        res.status(200).json({
            success: true,
            message: `LuckyDraw form has been ${newStatus} and an email has been sent to the user.`,
        });

    } catch (error) {
        console.log('Error while updating LuckyDraw status:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});




// Function to search LuckyDraw by ID
export const searchLuckyDrawById = asyncHandler(async (req, res, next) => {
    const { id } = req.params; // Extract 'id' from the request body

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
            luckyDraw
        });

    } catch (error) {
        console.log('Error while searching for LuckyDraw:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});


export const getLuckyDraws = asyncHandler(async (req, res, next) => {
    // Default values
    let page = req.query.page || 1;  // Default to page 1 if not provided
    const limit = 15; // Fixed limit per page

    try {
        // Convert page to an integer (if provided)
        page = parseInt(page, 10);

        // Validate page and limit
        if (page < 1) {
            return next(new ErrorHandler('Page number must be greater than 0.', 400));
        }

        // Calculate the starting index for pagination
        const skip = (page - 1) * limit;

        // Find the latest 'IsAllow' document
        const latestIsAllow = await IsAllow.findOne()
            .sort({ createdAt: -1 }); // Sorting by createdAt descending to get the latest document

        console.log('latestIsAllow', latestIsAllow);    

        if (!latestIsAllow) {
            return next(new ErrorHandler('No active form found.', 404));
        }

        // Get the list of LuckyDraw references from the latest IsAllow document
        const luckyDrawIds = latestIsAllow.luckydraw;

        // Initialize an array to store the valid LuckyDraw documents
        const validLuckyDraws = [];

        // Loop through the luckyDrawIds and fetch the corresponding LuckyDraw documents
        for (const luckyDrawId of luckyDrawIds) {
            const luckyDraw = await LuckyDraw.findById(luckyDrawId);
            console.log('drawji', luckyDraw)

            // If the LuckyDraw document is found and its state is 'approved', add it to the validLuckyDraws array
            if (luckyDraw && luckyDraw.status === 'approved') {
                validLuckyDraws.push(luckyDraw);
            }
        }

        // Paginate the validLuckyDraws array for the current page
        const paginatedLuckyDraws = validLuckyDraws.slice(skip, skip + limit);

        // Calculate total pages based on the valid lucky draw count
        const totalLuckyDraws = validLuckyDraws.length;
        const totalPages = Math.ceil(totalLuckyDraws / limit);

        // Return the result in response
        res.status(200).json({
            success: true,
            totalLuckyDraws,
            totalPages,
            currentPage: page,
            luckyDraws: paginatedLuckyDraws
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



// Get Lucky Draw by ID
export const getLuckyDrawById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
  
    // Find the lucky draw by ID
    const luckyDraw = await LuckyDraw.findById(id);
  
    if (!luckyDraw) {
      return next(new ErrorHandler('Lucky Draw not found', 404)); // If not found, throw a 404 error
    }
  
    res.status(200).json({
      success: true,
      draw: luckyDraw
    });
  });
  


  
  export const pushIdToResult = asyncHandler(async (req, res, next) => {
    const { id } = req.params; // Get the ID from the request params

    try {
        // Find the latest 'IsAllow' document based on the 'createdAt' field (most recent one)
        const latestIsAllow = await IsAllow.findOne().sort({ createdAt: -1 });

        // If no IsAllow document is found, return an error
        if (!latestIsAllow) {
            return next(new ErrorHandler('No active IsAllow form found', 404));
        }

        // Check if the provided ID is already in the result array to avoid duplicates
        if (latestIsAllow.result.includes(id)) {
            return next(new ErrorHandler(`ID ${id} is already in the result array`, 400));
        }

        // Push the provided ID to the 'result' array in the latest IsAllow document
        latestIsAllow.result.push(id);

        // Save the updated 'IsAllow' document
        await latestIsAllow.save();

        // Send a success message
        res.status(200).json({
            success: true,
            message: `Successfully pushed ${id} to result`,
            
        });

    } catch (error) {
        console.log('Error while pushing to result:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});





// Function to handle form opening date check and result fetching
export const checkFormAndFetchResults = async (req, res) => {
    try {
        const formId = req.params.formId; // Extract formId from request parameters

        // Find the form by ID
        const form = await IsAllow.findById(formId).populate('result'); // Populate result array
        
        if (!form) {
            return res.status(404).json({ message: "Form not found." }); // Form not found
        }

        const currentDate = moment(); // Get today's date
        const formOpeningDate = moment(form.formOpeningDate); // Convert formOpeningDate to moment object

        // Check if the form is not open yet
        if (formOpeningDate.isAfter(currentDate)) {
            const daysRemaining = formOpeningDate.diff(currentDate, 'days'); // Calculate days remaining
            return res.json({ message: `Wait for ${daysRemaining} day(s) until the form opens.` });
        }

        // If the form is open or the opening date is today or in the past, fetch the LuckyDraws in the result array
        const luckyDraws = await LuckyDraw.find({ '_id': { $in: form.result } });

        if (luckyDraws.length === 0) {
            return res.json({ message: "No lucky draw results available." });
        }

        // Return the found lucky draws
        return res.json({ luckyDraws });
    } catch (error) {
        console.error("Error checking form and fetching results:", error);
        return res.status(500).json({ message: "An error occurred while processing the request." });
    }
};







export const updateUserHistory = asyncHandler(async (req, res) => {
    try {
        // Access the user ID from req.user._id
        const userId = req.user._id;

        // Find the user by ID and populate the 'history' field with IsAllow documents
        const user = await User.findById(userId).populate('history');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Extract all history IDs
        const historyIds = user.history;

        // Find all IsAllow documents whose IDs are in the history array
        const validIsAllows = await IsAllow.find({ '_id': { $in: historyIds } });

        // Create an array to hold valid IsAllow documents
        const validIsAllowIds = validIsAllows.map(isAllow => isAllow._id.toString());

        // Filter out invalid IsAllow IDs from the user's history
        const updatedHistory = historyIds.filter(id => validIsAllowIds.includes(id._id.toString()));

        // If the history has changed, update the user's history field
        if (updatedHistory.length !== historyIds.length) {
            user.history = updatedHistory;
            await user.save(); // Save the updated user document
        }

        // If there were valid IsAllow documents, return them
        const updatedIsAllowDocs = validIsAllows;

        return res.json({
            message: 'History updated successfully',
            updatedIsAllowDocs // Return the full IsAllow documents
        });

    } catch (error) {
        console.error('Error updating user history:', error);
        return res.status(500).json({ message: 'An error occurred while updating user history' });
    }
});



export const createFaa = asyncHandler( async (req, res, next) => {
  try {
    // Extract data from request body
    const { city, name, phoneNo, budget } = req.body;
    console.log('Function executed');  // For debugging purposes

    // Validate if any required field is missing
    if (!city || !name || !phoneNo || !budget) {
      return next(new ErrorHandler('All fields are required', 400));
    }

    // Validate that the budget is one of the allowed values
    const allowedBudgets = [
      '10 lakh to 20 lakh',
      '30 lakh to 40 lakh',
      '3 crore to 4 crore'
    ];

    if (!allowedBudgets.includes(budget)) {
      return next(new ErrorHandler('Invalid budget value', 400));
    }

    // Create a new FAQ entry
    const faq = new FAQ({
      city,
      name,
      phoneNo,
      budget
    });

    // Save the new FAQ entry to the database
    await faq.save();

    // Send a success response
    res.status(201).json({
      success: true,
      message: 'You will get a call from us shortly',
      faq
    });

  } catch (error) {
    // Catching errors and passing to the next middleware
    console.error(error);
    return next(new ErrorHandler(error.message || 'Something went wrong', 500));
  }
});