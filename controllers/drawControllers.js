import LuckyDraw from "../DataModels/LuckyDraw.js";
import User from "../DataModels/userSchema.js";
import asyncHandler from "../middleware/helper/asyncHandler.js";
import ErrorHandler from "../middleware/apiError.js";
import sendEmail from "../middleware/helper/sendEmail.js";
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import moment from 'moment';
import FAQ from "../DataModels/FAQ.js";
import Companyfill from "../DataModels/CompanyFill.js";
import Allotment from "../DataModels/allotment.js";

import IsAllow from "../DataModels/allowForm.js";

cloudinary.config({
    cloud_name: "dwpdxuksp",
    api_key: "611646721796323",
    api_secret: "ejsJOwHcdFugMNDFy88WXPtPMd8"
});



// Create a new form
// Create a new form
export const createForm = asyncHandler(async (req, res, next) => {
    
    const { 
        name, 
        phoneNo, 
        occupation, 
        fatherName, 
        AdhaarNo, 
        PANno, 
        address, 
        DOB, 
        nationality, 
        project, 
        paymentPlan, 
        plotSize,        // Added plotSize
        preference       // Added preference
    } = req.body;
    
    // Correctly accessing the uploaded files from req.files
    const image = req.files?.image ? req.files.image[0] : null;  // Profile image
    const adhaarPhoto = req.files?.adhaarPhoto ? req.files.adhaarPhoto[0] : null; // Aadhaar image
    const panPhoto = req.files?.panPhoto ? req.files.panPhoto[0] : null; // PAN image

    console.log('req.body', req.body);
    console.log('req.files', req.files);

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

        // Check if profile image was uploaded
        if (!image) {
            return next(new ErrorHandler('No profile image uploaded for the form', 400));
        }

        // Check if Aadhaar and PAN images are uploaded
        if (!adhaarPhoto || !panPhoto) {
            return next(new ErrorHandler('No Aadhaar or PAN image uploaded for the form', 400));
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
            // Upload images to Cloudinary
            const profileImageResult = await cloudinary.uploader.upload(image.path);
            const profileImageUrl = profileImageResult.secure_url;

            const adhaarPhotoResult = await cloudinary.uploader.upload(adhaarPhoto.path); // Upload Aadhaar photo
            const adhaarPhotoUrl = adhaarPhotoResult.secure_url;

            const panPhotoResult = await cloudinary.uploader.upload(panPhoto.path); // Upload PAN photo
            const panPhotoUrl = panPhotoResult.secure_url;

            // Delete local files after upload to Cloudinary
            [image, adhaarPhoto, panPhoto].forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) {
                        console.error(`Failed to delete file: ${file.path}`, err);
                    } else {
                        console.log(`File deleted from local server: ${file.path}`);
                    }
                });
            });

            // Create a new form with all the necessary fields
            const newForm = new LuckyDraw({
                userId,
                name,
                phoneNo,
                occupation,
                fatherName,
                AdhaarNo,
                adhaarPhoto: adhaarPhotoUrl,  // Store the Cloudinary URL for Aadhaar photo
                PANno,
                panPhoto: panPhotoUrl,        // Store the Cloudinary URL for PAN photo
                address,
                DOB,               // Added DOB
                nationality,       // Added nationality
                project,           // Added project
                paymentPlan,
                plotSize,          // Added plotSize
                preference,        // Added preference
                openingDate,
                image: profileImageUrl // Store the Cloudinary URL for profile image
            });


            // Save the form
            await newForm.save();

            // Link the form to the user and IsAllow documents
            user.formFilled.push(newForm._id);
            await user.save();

            isAllowDoc.luckydraw.push(newForm._id);
            await isAllowDoc.save().then(console.log('isallow now,', isAllowDoc));

            // Compose the email text with better formatting, user details, and an image
            const text = ` 
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px; font-size: 1.2vmax;">
                <h2 style="color: #2c3e52;">Dear ${newForm.name},</h2>
                <p style="font-size: 1.2vmax;">
                    Thank you for submitting your application for the Lucky Draw. We have successfully received your application, and it is currently in <strong>PENDING</strong> state. Our team will review it shortly.
                </p>

                <h3 style="color: #2c3e52;">Your Application Details:</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">Ticket ID:</td>
                        <td style="padding: 8px;">${newForm._id}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">Name:</td>
                        <td style="padding: 8px;">${newForm.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">Phone Number:</td>
                        <td style="padding: 8px;">${newForm.phoneNo}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">Occupation:</td>
                        <td style="padding: 8px;">${newForm.occupation}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">Father's Name:</td>
                        <td style="padding: 8px;">${newForm.fatherName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">Adhaar Number:</td>
                        <td style="padding: 8px;">${newForm.AdhaarNo}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">PAN Number:</td>
                        <td style="padding: 8px;">${newForm.PANno}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">Address:</td>
                        <td style="padding: 8px;">${newForm.address}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">Date of Birth:</td>
                        <td style="padding: 8px;">${newForm.DOB}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">Nationality:</td>
                        <td style="padding: 8px;">${newForm.nationality}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">Project:</td>
                        <td style="padding: 8px;">${newForm.project}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">Plot Size:</td>
                        <td style="padding: 8px;">${newForm.plotSize}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">Preference:</td>
                        <td style="padding: 8px;">${newForm.preference}</td>
                    </tr>
                </table>

                <p style="font-size: 1.2vmax;">
                    For any inquiries, you can also reach us at: <strong>+919971488477</strong>
                </p>

                <p style="font-size: 1.2vmax;">
                    You can view your application details at any time by clicking the link below:
                </p>

                <p>
                    <a href="https://navbharatniwas.in/draw/${newForm._id}" style="color: #3498db; text-decoration: none; font-size: 1.2vmax;">
                        <strong>Click here to view your application</strong>
                    </a>
                </p>

                <div style="margin: 2vmax 0.5vmax;">
                    <img src="https://navbharatniwas.in:3008/uploads/images/oo.jpg" alt="Lucky Draw" width="194vmax" height="126.3vmax" style="margin: 2vmax 0.5vmax;"/>
                </div>

                <p style="margin-top: 30px;">
                    Thank you for participating in the Lucky Draw! We wish you the best of luck.
                </p>

                <footer style="font-size: 1vmax; color: #777;">
                    <p>Nav Bharat Niwas</p>
                    <p>For any inquiries, contact us at: support@navbharatniwas.in</p>
                </footer>
            </div>
            `;

            await sendEmail({
                email: user.email,  // Email from the new form
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







export const createCompanyFill = asyncHandler(async (req, res, next) => {
    const { 
        companyName, 
        authorizedSignatory, 
        gstNumber, 
        panNumber, 
        companyAddress, 
        authorizedSignatoryAddress, 
        paymentPlan,
        project,       // Ensure 'project' is part of the body
        plotSize,      // Include the plotSize field
        preference     // Include the preference field
    } = req.body;

    // Access uploaded photos (passport and PAN photos)
    const panPhoto = req.files?.panPhoto ? req.files.panPhoto[0] : null;
    const passportPhoto = req.files?.passportPhoto ? req.files.passportPhoto[0] : null;

    console.log('req.body', req.body);
    console.log('req.files', req.files);

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

        // Check if both photos are uploaded
        if (!panPhoto || !passportPhoto) {
            return next(new ErrorHandler('Both PAN and Passport photos are required', 400));
        }

        // Upload the photos to Cloudinary
        const panPhotoResult = await cloudinary.uploader.upload(panPhoto.path);
        const passportPhotoResult = await cloudinary.uploader.upload(passportPhoto.path);

        const panPhotoUrl = panPhotoResult.secure_url;
        const passportPhotoUrl = passportPhotoResult.secure_url;

        // Delete local files after upload to Cloudinary
        [panPhoto, passportPhoto].forEach(file => {
            fs.unlink(file.path, (err) => {
                if (err) {
                    console.error(`Failed to delete file: ${file.path}`, err);
                } else {
                    console.log(`File deleted from local server: ${file.path}`);
                }
            });
        });

        // Create a new company fill document
        const newCompany = new Companyfill({
            userId,
            companyName,
            authorizedSignatory,
            gstNumber,
            panNumber,
            panPhoto: panPhotoUrl,  // Store Cloudinary URL for PAN photo
            companyAddress,
            authorizedSignatoryAddress,
            passportPhoto: passportPhotoUrl, // Store Cloudinary URL for Passport photo
            paymentPlan,
            project,
            plotSize,           // Store plotSize
            preference          // Store preference
        });

        // Save the company fill document to the database
        await newCompany.save();

        // Link the company fill form to IsAllow document
        const isAllowDoc = await IsAllow.findOne().sort({ createdAt: -1 });
        if (!isAllowDoc || !isAllowDoc.isEnabled) {
            return next(new ErrorHandler('Form is not enabled yet', 403));
        }

        // Push the new company fill ID to IsAllow document's companyFill array
        isAllowDoc.companyFill.push(newCompany._id);
        await isAllowDoc.save();

        // Link the form to the user and IsAllow documents
        user.CompanyFill.push(newCompany._id);
        await user.save();

        // Compose the email text with the company details
        const text = `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px; font-size: 1.2vmax;">
            <h2 style="color: #2c3e52;">Dear ${newCompany.authorizedSignatory},</h2>
            <p style="font-size: 1.2vmax;">
                Thank you for submitting your company's details. We have successfully received your information, and it is currently in <strong>PENDING</strong> state. Our team will review it shortly.
            </p>

            <h3 style="color: #2c3e52;">Your Company Details:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr>
                    <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">Ticket ID:</td>
                    <td style="padding: 8px;">${newCompany._id}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">Company Name:</td>
                    <td style="padding: 8px;">${newCompany.companyName}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">GST Number:</td>
                    <td style="padding: 8px;">${newCompany.gstNumber}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">PAN Number:</td>
                    <td style="padding: 8px;">${newCompany.panNumber}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">Authorized Signatory:</td>
                    <td style="padding: 8px;">${newCompany.authorizedSignatory}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">Company Address:</td>
                    <td style="padding: 8px;">${newCompany.companyAddress}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">Authorized Signatory Address:</td>
                    <td style="padding: 8px;">${newCompany.authorizedSignatoryAddress}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">Project:</td>
                    <td style="padding: 8px;">${newCompany.project}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">Plot Size:</td>
                    <td style="padding: 8px;">${newCompany.plotSize}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold; background-color: #f2f2f2;">Preference:</td>
                    <td style="padding: 8px;">${newCompany.preference}</td>
                </tr>
            </table>

            <p style="font-size: 1.2vmax;">
                For any inquiries, you can also reach us at: <strong>+919971488477</strong>
            </p>

            <p style="font-size: 1.2vmax;">
                You can view your company details at any time by clicking the link below:
            </p>

            <p>
                <a href="https://navbharatniwas.in/company-fill/${newCompany._id}" style="color: #3498db; text-decoration: none; font-size: 1.2vmax;">
                    <strong>Click here to view your company details</strong>
                </a>
            </p>

            <div style="margin: 2vmax 0.5vmax;">
                <img src="https://navbharatniwas.in:3008/uploads/images/oo.jpg" alt="Company Fill" width="194vmax" height="126.3vmax" style="margin: 2vmax 0.5vmax;"/>
            </div>

            <p style="margin-top: 30px;">
                Thank you for submitting your company's details. We will notify you once it's processed.
            </p>

            <footer style="font-size: 1vmax; color: #777;">
                <p>Nav Bharat Niwas</p>
                <p>For any inquiries, contact us at: support@navbharatniwas.in</p>
            </footer>
        </div>
        `;

        // Send email notification
        await sendEmail({
            email: user.email,  // Send email to the user who submitted the company details
            subject: 'Company Form PENDING State Submitted',
            html: text  // HTML content for the email
        });

        res.status(201).json({
            success: true,
            message: 'Company fill form created successfully',
            company: newCompany
        });

    } catch (error) {
        console.log('Error while creating company fill:', error);
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






// Function to get IsAllow records with pagination
export const getIsAllow = asyncHandler(async (req, res, next) => {
    try {
        // Extract user from req.user
        const userId = req.user.id;

 // Find the user by ID to check their role
 const user = await User.findById(userId);
 if (!user) {
     return next(new ErrorHandler('User not found', 404));
 }

        const userRole = user.role;  // Assuming 'role' field exists in the user model

        // Check if the user is an admin
        if (userRole !== 'admin') {
            // If the user is not an admin, throw a 403 error (Forbidden)
            return next(new ErrorHandler('You do not have permission to view this data', 403));
        }

        // Get the page number from the query, default to 1 if not provided
        const page = parseInt(req.query.page) || 1;
        const recordsPerPage = 12;

        // Fetch the records from the IsAllow collection in reverse order (latest first)
        const isAllowRecords = await IsAllow.find()
            .sort({ createdAt: -1 })  // Sort by createdAt in reverse order (newest first)
            .skip((page - 1) * recordsPerPage)  // Skip records for pagination
            .limit(recordsPerPage);  // Limit to 12 records per page

        // Get total record count for pagination purposes
        const totalRecords = await IsAllow.countDocuments();

        // If no records are found, throw an error using ErrorHandler
        if (!isAllowRecords || isAllowRecords.length === 0) {
            return next(new ErrorHandler('No records found', 404));
        }

        // Return the result with pagination info
        res.status(200).json({
            success: true,
            isAllow: isAllowRecords,
            totalRecords, // Total records for pagination
            totalPages: Math.ceil(totalRecords / recordsPerPage),  // Total pages
            currentPage: page
        });
    } catch (error) {
        // Catch any errors that occur during the function execution
        next(new ErrorHandler('Something went wrong, please try again', 500));  // Call the error handler
    }
});





// Function to get associated results from IsAllow by its ID
export const getIsAllowResults = asyncHandler(async (req, res, next) => {
    const { id } = req.params; // Get the 'id' from the URL parameters
  
    try {
      // Find the IsAllow document by its ID and populate the result and resultCompany fields
      const isAllowData = await IsAllow.findById(id)
        .populate('result', '_id name phoneNo fatherName address') // Populate the result (LuckyDraw) with specific fields
        .populate('resultCompany', '_id companyName authorizedSignatory gstNumber companyAddress'); // Populate resultCompany (CompanyFill) with specific fields
  
      if (!isAllowData) {
        return next(new ErrorHandler('IsAllow form not found', 404));
      }
  
      // Return the associated data (LuckyDraw results and CompanyFill results)
      res.status(200).json({
        success: true,
        data: {
          result: isAllowData.result, // Contains only 'name', 'phoneNo', 'fatherName', 'address' for LuckyDraw
          resultCompany: isAllowData.resultCompany // Contains 'companyName', 'authorizedSignatory', 'gstNumber', 'companyAddress' for CompanyFill
        }
      });
    } catch (error) {
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
     
            // Delete the LuckyDraw image from Cloudinary (if it exists)
            const imagePublicId = luckyDraw.image.split('/').pop().split('.')[0]; // Assuming URL structure
            await cloudinary.uploader.destroy(imagePublicId);


            // Delete the LuckyDraw document from the database
            await luckyDraw.deleteOne();
            console.log('LuckyDraw document deleted');
        }

        // If the action is approve, push the latest IsAllow document ID to the user's history
        if (newStatus === 'approved') {
            const latestIsAllow = await IsAllow.findOne().sort({ createdAt: -1 });
            console.log("latestIsAllow found:", latestIsAllow);

            if (latestIsAllow) {
                
                luckyDrawUser.history.push(latestIsAllow._id);
                await luckyDrawUser.save();
                console.log("moved to history")
            }
        }

       // Compose the email content
       const subject = `Your LuckyDraw form has been ${newStatus}`;
       const text = `
           <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px;">
               <h2 style="color: #2c3e52;">Dear ${luckyDrawUser.name},</h2>
               <p>Your application for the LuckyDraw with ticket ID: <b>${luckyDraw._id}</b> has been <b>${newStatus}</b>.</p>

               <h3>Application Details:</h3>
                <p><b>Ticket_ID:</b> ${luckyDraw._id}</p>
               <p><b>Name:</b> ${luckyDraw.name}</p>
               <p><b>Phone Number:</b> ${luckyDraw.phoneNo}</p>
               <p><b>Occupation:</b> ${luckyDraw.occupation}</p>
               <p><b>Father's Name:</b> ${luckyDraw.fatherName}</p>
               <p><b>Aadhaar Number:</b> ${luckyDraw.AdhaarNo}</p>
               <p><b>PAN Number:</b> ${luckyDraw.PANno}</p>
               <p><b>Address:</b> ${luckyDraw.address}</p>
               <p><b>Date of Birth:</b> ${luckyDraw.DOB}</p>
               <p><b>Nationality:</b> ${luckyDraw.nationality}</p>
               <p><b>Project:</b> ${luckyDraw.project}</p>

               <p style="font-size: 1.2vmax;">
                   This amount is 100% refundable in case of no allotment under this scheme.
               </p>

               <img src="https://navbharatniwas.in:3008/uploads/images/oo.jpg" width="194vmax" height="126.2vmax" style="margin: 2vmax 0.5vmax;" alt="Lucky Draw Image">

               <p>Thank you for participating!</p>
             
       `;

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
        console.log('Error while updating LuckyDraw Status:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});






// Approve or Reject the CompanyFill form
export const updateCompanyFillStatus = asyncHandler(async (req, res, next) => {
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
            return next(new ErrorHandler('You are not authorized to approve or reject this CompanyFill form', 403));
        }

        // Find the CompanyFill form by its ID
        const companyFill = await Companyfill.findById(id);
        if (!companyFill) {
            return next(new ErrorHandler('CompanyFill form not found', 404));
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

        // Update the CompanyFill status
        companyFill.status = newStatus;
        await companyFill.save();

        // Fetch the user to whom the CompanyFill belongs
        const companyFillUser = await User.findById(companyFill.userId);
        if (!companyFillUser) {
            return next(new ErrorHandler('User associated with this CompanyFill not found', 404));
        }

        // If the action is reject, remove the latest IsAllow document ID from the user's history
        if (newStatus === 'rejected') {
            const latestIsAllow = await IsAllow.findOne({ userId }).sort({ createdAt: -1 });
            if (latestIsAllow) {
                // Remove the latest IsAllow _id from the user's history
                const historyIndex = companyFillUser.history.indexOf(latestIsAllow._id);
                if (historyIndex > -1) {
                    companyFillUser.history.splice(historyIndex, 1);  // Remove the IsAllow ID from history array
                    await companyFillUser.save();
                }
            }

            // Delete the CompanyFill document from the database
            await companyFill.deleteOne();
            console.log('CompanyFill document deleted');
        }

        // If the action is approve, push the latest IsAllow document ID to the user's history
        if (newStatus === 'approved') {
            const latestIsAllow = await IsAllow.findOne().sort({ createdAt: -1 });
            console.log("latestIsAllow found:", latestIsAllow);

            if (latestIsAllow) {
                companyFillUser.history.push(latestIsAllow._id);
                await companyFillUser.save();
                console.log("moved to history")
            }
        }

        // Compose the email content
        const subject = `Your CompanyFill form has been ${newStatus}`;
        const text = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px;">
                <h2 style="color: #2c3e52;">Dear ${companyFillUser.name},</h2>
                <p>Your application for the CompanyFill with GST Number: <b>${companyFill.gstNumber}</b> has been <b>${newStatus}</b>.</p>

                <h3>Application Details:</h3>
                <p><b>Ticket ID:</b> ${companyFill._id}</p>
                <p><b>Company Name:</b> ${companyFill.companyName}</p>
                <p><b>Authorized Signatory:</b> ${companyFill.authorizedSignatory}</p>
                <p><b>GST Number:</b> ${companyFill.gstNumber}</p>
                <p><b>PAN Number:</b> ${companyFill.panNumber}</p>
                <p><b>Company Address:</b> ${companyFill.companyAddress}</p>
                <p><b>Authorized Signatory Address:</b> ${companyFill.authorizedSignatoryAddress}</p>
                <p><b>Payment Plan:</b> ${companyFill.paymentPlan}</p>

                <p style="font-size: 1.2vmax;">
                    This amount is 100% refundable in case of no allotment under this scheme.
                </p>

                <img src="https://navbharatniwas.in:3008/uploads/images/oo.jpg" width="194vmax" height="126.2vmax" style="margin: 2vmax 0.5vmax;" alt="Lucky Draw Image">

                <p>Thank you for participating!</p>
            </div>
        `;

        // Send an email to the user notifying them of the approval/rejection
        await sendEmail({
            email: companyFillUser.email,
            subject,
            html: text // Use the html field to send HTML content
        });

        res.status(200).json({
            success: true,
            message: `CompanyFill form has been ${newStatus} and an email has been sent to the user.`,
        });

    } catch (error) {
        console.log('Error while updating CompanyFill Status:', error);
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







// Function to search CompanyFill by ID
export const searchCompanyFillById = asyncHandler(async (req, res, next) => {
    const { id } = req.params; // Extract 'id' from the request params

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
            return next(new ErrorHandler('You are not authorized to search this CompanyFill form', 403));
        }

        // Find the CompanyFill form by its ID
        const companyFill = await Companyfill.findById(id);
        if (!companyFill) {
            return next(new ErrorHandler('CompanyFill form not found', 404));
        }

        // Return the CompanyFill details
        res.status(200).json({
            success: true,
            companyFill
        });

    } catch (error) {
        console.log('Error while searching for CompanyFill:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});





// Function to get paginated CompanyFills
export const getCompanyFills = asyncHandler(async (req, res, next) => {
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

        // Get the list of CompanyFill references from the latest IsAllow document
        const companyFillIds = latestIsAllow.companyFill;

        // Initialize an array to store the valid CompanyFill documents
        const validCompanyFills = [];

        // Loop through the companyFillIds and fetch the corresponding CompanyFill documents
        for (const companyFillId of companyFillIds) {
            const companyFill = await Companyfill.findById(companyFillId);
            console.log('companyFill', companyFill);

            // If the CompanyFill document is found and its state is 'approved', add it to the validCompanyFills array
            if (companyFill && companyFill.status === 'approved') {
                validCompanyFills.push(companyFill);
            }
        }

        // Paginate the validCompanyFills array for the current page
        const paginatedCompanyFills = validCompanyFills.slice(skip, skip + limit);

        // Calculate total pages based on the valid company fill count
        const totalCompanyFills = validCompanyFills.length;
        const totalPages = Math.ceil(totalCompanyFills / limit);

        // Return the result in response
        res.status(200).json({
            success: true,
            totalCompanyFills,
            totalPages,
            currentPage: page,
            companyFills: paginatedCompanyFills
        });

    } catch (error) {
        console.log('Error while fetching CompanyFills:', error);
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



// Get User's CompanyFill details with status and createdAt date
export const getUserCompanyFillWithStatusDate = asyncHandler(async (req, res, next) => {

  
    try {
        const userId = req.user._id; // Getting userId from req.user._id (assuming it's set by auth middleware)

        // Find the user by userId
        const user = await User.findById(userId);

        // If user doesn't exist, throw an error
        if (!user) {
            return next(new ErrorHandler('User not found', 404));
        }

        // Fetch CompanyFill documents for each ID in CompanyFill array
        const companyFillData = await Promise.all(
            user.CompanyFill.map(async (companyFillId) => {
                const companyFill = await Companyfill.findById(companyFillId);

                // If CompanyFill doesn't exist, we ignore it (or handle accordingly)
                if (!companyFill) return null;

                return {
                    _id: companyFill._id,
                    status: companyFill.status,
                    createdAt: companyFill.createdAt,
                    companyName: companyFill.companyName,
                };
            })
        );

        // Remove any null results (for the case where a CompanyFill wasn't found)
        const validCompanyFillData = companyFillData.filter(item => item !== null);

        // Reverse the array to return it in reverse order (optional, depending on your use case)
        const reversedCompanyFillData = validCompanyFillData.reverse();

        // Send the response with the reversed CompanyFill data
        res.status(200).json({
            success: true,
            companyFill: reversedCompanyFillData
        });
    } catch (error) {
        console.error("Error fetching user's company fill data: ", error);
        return next(new ErrorHandler('Something went wrong, please try again later', 500));
    }
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
  




// Get CompanyFill by ID
export const getCompanyFillById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
  
    // Find the CompanyFill by ID
    const companyFill = await Companyfill.findById(id);
  
    if (!companyFill) {
      return next(new ErrorHandler('Company Fill not found', 404)); // If not found, throw a 404 error
    }
  
    res.status(200).json({
      success: true,
      companyFill
    });
  });
  







  // Push ID to the result array and update the allotment in LuckyDraw
export const pushIdToResult = asyncHandler(async (req, res, next) => {
    const { Lid,  allot, gift } = req.params; // Get 'Lid', 'id', and 'allot' from the request params
    
    try {
        // Find the latest 'IsAllow' document based on the 'createdAt' field (most recent one)
        const latestIsAllow = await IsAllow.findOne().sort({ createdAt: -1 });

        // If no IsAllow document is found, return an error
        if (!latestIsAllow) {
            return next(new ErrorHandler('No active IsAllow form found', 404));
        }

        // Check if the provided 'id' is already in the result array to avoid duplicates
        if (latestIsAllow.result.includes(Lid)) {
            return next(new ErrorHandler(`ID ${Lid} is already in the result array`, 400));
        }

         // Find the LuckyDraw document by 'Lid'
         const luckyDraw = await LuckyDraw.findById(Lid);

         console.log('lucky is', luckyDraw); 
    
         if (!luckyDraw) {
             return next(new ErrorHandler('LuckyDraw not found', 404));
         }

        // Push the provided 'id' to the 'result' array in the latest IsAllow document
        latestIsAllow.result.push(luckyDraw._id);

        // Save the updated 'IsAllow' document
        await latestIsAllow.save();

       

        // Update the allotment field of the LuckyDraw document
        luckyDraw.allotment = allot; // allot is a string, ensure this is correct
        luckyDraw.gift = gift;
        await luckyDraw.save(); // Save the updated LuckyDraw document

        // Send a success message
        res.status(200).json({
            success: true,
            message: `Successfully pushed ${Lid} to result and updated the allotment for LuckyDraw ${Lid}`,
        });

    } catch (error) {
        console.log('Error while pushing to result and updating allotment:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});





// Push Company ID to the resultCompany array and update the allotment in CompanyFill
export const pushCompanyIdToResult = asyncHandler(async (req, res, next) => {
    const { companyId, allot, gift } = req.params; // Get 'companyId' and 'allot' from the request params
    
    try {
        // Find the latest 'IsAllow' document based on the 'createdAt' field (most recent one)
        const latestIsAllow = await IsAllow.findOne().sort({ createdAt: -1 });

        // If no IsAllow document is found, return an error
        if (!latestIsAllow) {
            return next(new ErrorHandler('No active IsAllow form found', 404));
        }

        // Check if the provided 'companyId' is already in the resultCompany array to avoid duplicates
        if (latestIsAllow.resultCompany.includes(companyId)) {
            return next(new ErrorHandler(`Company ID ${companyId} is already in the resultCompany array`, 400));
        }

        // Push the provided 'companyId' to the 'resultCompany' array in the latest IsAllow document
        latestIsAllow.resultCompany.push(companyId);

        // Save the updated 'IsAllow' document
        await latestIsAllow.save();

        // Find the CompanyFill document by 'companyId'
        const companyFill = await Companyfill.findById(companyId);
        if (!companyFill) {
            return next(new ErrorHandler('CompanyFill not found', 404));
        }

        // Update the allotment field of the CompanyFill document
        companyFill.allotment = allot; // allot is a string, ensure this is correct
        companyFill.gift = gift;
        await companyFill.save(); // Save the updated CompanyFill document

        // Send a success message
        res.status(200).json({
            success: true,
            message: `Successfully pushed Company ID ${companyId} to resultCompany and updated the allotment for CompanyFill ${companyId}`,
        });

    } catch (error) {
        console.log('Error while pushing to resultCompany and updating allotment:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});




// Function to handle form opening date check and result fetching
export const checkFormAndFetchResults = async (req, res) => {
    try {
        const formId = req.params.formId;
        const form = await IsAllow.findById(formId).populate('result').populate('resultCompany');

        if (!form) {
            return res.status(404).json({ message: "Form not found." });
        }

        const currentDate = moment();
        const formOpeningDate = moment(form.formOpeningDate);
        const formOpeningDateAt7PM = formOpeningDate.set({ hour: 19, minute: 0, second: 0, millisecond: 0 });

        if (formOpeningDate.isAfter(currentDate)) {
            const daysRemaining = formOpeningDate.diff(currentDate, 'days');
            const hoursRemaining = formOpeningDate.diff(currentDate, 'hours') % 24;

            let message = `Wait for ${daysRemaining} day(s)`;
            if (hoursRemaining > 0) {
                message += ` and ${hoursRemaining} hour(s)`;
            }
            message += ` until the form opens.`;

            return res.json({ message });
        }

        const luckyDraws = await LuckyDraw.find({ '_id': { $in: form.result } });
        const companyForms = await Companyfill.find({ '_id': { $in: form.resultCompany } });

        if (luckyDraws.length === 0 && companyForms.length === 0) {
            return res.json({ message: "No lucky draw or company form results available." });
        }

        return res.json({ luckyDraws, companyForms });
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
        const updatedIsAllowDocs = validIsAllows.reverse();;

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




export const createIndiAllotment = async (req, res) => {
    try {
        const adminUserId = req.user._id; // Get logged-in user ID

        // Verify if the logged-in user exists and check role
        const existingUser = await User.findById(adminUserId);
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }
        if (existingUser.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Only admins can proceed." });
        }

        // Construct Allotment object with values from req.body
        const allotmentData = {
            name: req.body.name,
            swdo: req.body.swdo,
            phoneNumber: req.body.phoneNumber,
            
            dob: req.body.dob,
            image:req.body.image,
            nationality: req.body.nationality,
            emailId: req.body.emailId,
            aadhaarNo: req.body.aadhaarNo,
            panNo: req.body.panNo,
            profession: req.body.profession,
            address: req.body.address,
            uniqueId: req.body.uniqueId,
            // Property Details
            developmentCharge: req.body.developmentCharge,
            area: req.body.area,
            unitNo: req.body.unitNo,
            Project: req.body.project,
            plc: req.body.plc,
            paymentPlan: req.body.paymentPlan,
            changeinPP: req.body.changeinPP,
            date: Date.now(),
            // Payment Details
            plcAmount: req.body.plcAmount,
            bookingAmount: req.body.bookingAmount,
            registrationAmount: req.body.registrationAmount,
            totalCost: req.body.totalCost,
            modeOfPayment: req.body.modeOfPayment,
            chequeNoDDNo: req.body.chequeNoDDNo,
            bankName: req.body.bankName,
            amount: req.body.amount,
            chequeDateDDDate: req.body.chequeDateDDDate,
            transactionId: req.body.transactionId,
        };

        // Create new allotment document
        const newAllotment = new Allotment(allotmentData);
        await newAllotment.save();


         // Find the user by emailId
         const user = await User.findOne({ email: req.body.emailId });
         if (user) {
            
 
             // Push the allotment link to the allotmentLetters array
             user.allotmentLetters.push(newAllotment._id);
             await user.save();
         }



        return res.status(201).json({ message: "Allotment created successfully", allotment: newAllotment });

    } catch (error) {
        console.error("Error creating allotment:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};





export const createCompanyAllotment = async (req, res) => {
    try {
        const adminUserId = req.user._id; // Get logged-in user ID

        // Verify if the logged-in user exists and check role
        const existingUser = await User.findById(adminUserId);
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }
        if (existingUser.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Only admins can proceed." });
        }

        // Construct Allotment object with values from req.body
        const allotmentData = {
            name: req.body.authorizedSignatory,
            gstNumber: req.body.gstNumber,
            company: req.body.companyName,
            image:req.body.image,
            emailId: req.body.emailId,
            panNo: req.body.panNumber,
            address: req.body.companyAddress,
            uniqueId: req.body.uniqueId,
            // Property Details
            developmentCharge: req.body.developmentCharge,
            area: req.body.area,
            unitNo: req.body.unitNo,
            Project: req.body.project,
            plc: req.body.plc,
            paymentPlan: req.body.paymentPlan,
            date: Date.now(),
            // Payment Details
            plcAmount: req.body.plcAmount,
            bookingAmount: req.body.bookingAmount,
            registrationAmount: req.body.registrationAmount,
            totalCost: req.body.totalCost,
            modeOfPayment: req.body.modeOfPayment,
            chequeNoDDNo: req.body.chequeNoDDNo,
            bankName: req.body.bankName,
            amount: req.body.amount,
            chequeDateDDDate: req.body.chequeDateDDDate,
            transactionId: req.body.transactionId,
        };

        // Create new allotment document
        const newAllotment = new Allotment(allotmentData);
        await newAllotment.save();

        // Find the user by emailId
        const user = await User.findOne({ email: req.body.emailId });
        if (user) {
            // Ensure notifications array exists
            if (!user.allotmentLetters) {
                user.allotmentLetters = [];
            }

            // Push the allotment link to the allotmentLetters array
            user.allotmentLetters.push(newAllotment._id);
            await user.save();
        }

        return res.status(201).json({
            message: "Allotment created successfully",
            allotment: newAllotment,
        });

    } catch (error) {
        console.error("Error creating allotment:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }

}



export const updateSignature = asyncHandler(async (req, res, next) => {
    const { allotmentId } = req.params; // Only allotmentId is needed now
    const { signature } = req.body; // Base64 signature string

    if (!signature) {
        return next(new ErrorHandler('Signature is required', 400));
    }

    const userId = req.user._id;

    // Fetch user details
    const user = await User.findById(userId);
    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    // Fetch allotment details
    const allotment = await Allotment.findById(allotmentId);
    if (!allotment) {
        return next(new ErrorHandler('Allotment not found', 404));
    }

    // Check if the user's email matches the allotment email
    if (allotment.emailId !== user.email) {
        return next(new ErrorHandler('Unauthorized: Email mismatch', 403));
    }

    // Update the signature
    allotment.sign = signature;
    await allotment.save();

    res.status(200).json({
        success: true,
        message: "Signature updated successfully",
        allotment
    });
});



export const searchAllotments = asyncHandler(async (req, res, next) => {
    try {
        const { query } = req.params;

        if (!query) {
            return next(new ErrorHandler("Search query is required", 400));
        }

        const regex = new RegExp(query, "i"); // Case-insensitive regex search
        
        const allotments = await Allotment.find({
            uniqueId: { $regex: regex },
        });

        if (allotments.length === 0) {
            return next(new ErrorHandler("No allotments found", 404));
        }

        res.status(200).json({
            success: true,
            results: allotments,
        });
    } catch (error) {
       return next(new ErrorHandler("Something went wrong", 500));
    }
});



export const getUserAllotments = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Extract allotment letter IDs from the user
        const allotmentIds = user.allotmentLetters;

        // Find existing allotments based on these IDs
        const allotments = await Allotment.find({ _id: { $in: allotmentIds } }).select('_id uniqueId');

        res.status(200).json({
            success: true,
            allotments: allotments.reverse()
        });

    } catch (error) {
        console.error("Error fetching user's allotment letters:", error);
        return next(new ErrorHandler("Something went wrong", 500));
    }
});




// Backend function to get allotment by ID
export const getAllotmentById = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const allotment = await Allotment.findById(id);

        if (!allotment) {
            return next(new ErrorHandler("Allotment not found", 404));
        }

        res.status(200).json({
            success: true,
            allotment
        });
    } catch (error) {
        next(error);
    }
});




// Get all FAQs in reverse order
export const getAllFAQss = asyncHandler(async (req, res, next) => {
    try {
      const faqs = await FAQ.find().sort({ createdAt: -1 }); // Reverse order by createdAt
      res.status(200).json({
        success: true,
        data: faqs
      });
    } catch (error) {
      next(new ErrorHandler('Failed to fetch FAQs', 500));
    }
  });
  
