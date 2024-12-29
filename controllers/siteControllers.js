import Site from "../DataModels/SiteSchema.js";
import asyncHandler from "../middleware/helper/asyncHandler.js";
import ErrorHandler from "../middleware/apiError.js";
import cloudinary from 'cloudinary';
import fs from 'fs';
import FAQ from "../DataModels/FAQ.js";

cloudinary.config({
    cloud_name: "dwpdxuksp",
    api_key: "611646721796323",
    api_secret: "ejsJOwHcdFugMNDFy88WXPtPMd8"
}); 
  

// Add a Site to inventory
export const addSite = asyncHandler(async (req, res, next) => {
    const { name, description, current } = req.body; // Default discount to 0
    const images = req.files; // Assuming `req.files` contains the uploaded images

    // Check if user is admin
    if (req.user.role !== 'admin') {
        return next(new ErrorHandler('You are not authorized to add a product', 403));
    }

    console.log(name, description, current, images);

    try {
        // Validate input fields
        if (!name || !description || !current) {
            return next(new ErrorHandler('Please provide all required Site details', 400));
        }

        // Check if images were uploaded
        if (!images || images.length === 0) {
            return next(new ErrorHandler('No images uploaded for the product', 400));
        }

        // Upload images to Cloudinary
        let imageUrls = [];
        for (let image of images) {
            // Upload image to Cloudinary
            const result = await cloudinary.uploader.upload(image.path);
            imageUrls.push(result.secure_url); // Store the Cloudinary URL
        }

        // Delete local files after upload to Cloudinary
        for (let image of images) {
            fs.unlink(image.path, (err) => {
                if (err) {
                    console.error(`Failed to delete file: ${image.path}`, err);
                } else {
                    console.log(`File deleted from local server: ${image.path}`);
                }
            });
        }

        // Create the new product with the Cloudinary image URLs
        const newSite = new Site({
            name,
            description,
            current,
            images: imageUrls, // Store Cloudinary image URLs
           
        });

        // Save the product to the database
        await newSite.save();

        // Respond with success message
        return res.status(201).json({
            success: true,
            message: 'Product added successfully!',
            site: newSite,
        });

    } catch (error) {
        console.error('Error adding product:', error);
        return next(new ErrorHandler('Error adding product. Please try again.', 500));
    }
});



export const getSitesWithPagination = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    try {
        const sites = await Site.find({}, { name: 1, images: 1 })
            .sort({ createdAt: -1 }) // Sort in reverse order by creation date
            .skip(skip)
            .limit(limit);

        const totalSites = await Site.countDocuments();

        res.status(200).json({
            success: true,
            count: sites.length,
            totalSites,
            totalPages: Math.ceil(totalSites / limit),
            currentPage: page,
            sites
        });
    } catch (error) {
        console.log('Error while fetching sites:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});



//modify site after uploading
export const editSite = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { name, description, current } = req.body;

    try {
        // Find the site by ID
        const site = await Site.findById(id);
        if (!site) {
            return next(new ErrorHandler('Site not found', 404));
        }

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return next(new ErrorHandler('You are not authorized to edit this site', 403));
        }

        // Update the site details
        site.name = name || site.name;
        site.description = description || site.description;
        site.current = current || site.current;

        // Save the updated site
        await site.save();

        res.status(200).json({
            success: true,
            message: 'Site details updated successfully',
            site
        });
    } catch (error) {
        console.log('Error while editing site:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});




// Delete site
export const deleteSite = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    try {
        // Find the site by ID
        const site = await Site.findById(id);
        if (!site) {
            return next(new ErrorHandler('Site not found', 404));
        }

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return next(new ErrorHandler('You are not authorized to delete this site', 403));
        }

        // Delete images from Cloudinary
        for (const imageUrl of site.images) {
            const publicId = imageUrl.split('/').pop().split('.')[0]; // Extract public ID from URL
            await cloudinary.v2.uploader.destroy(publicId);
        }

        // Delete the site
        await site.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Site deleted successfully'
        });
    } catch (error) {
        console.log('Error while deleting site:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});



// Get site details by ID
export const getSiteById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    try {
        // Find the site by ID
        const site = await Site.findById(id);
        if (!site) {
            return next(new ErrorHandler('Site not found', 404));
        }

        res.status(200).json({
            success: true,
            site
        });
    } catch (error) {
        console.log('Error while fetching site details:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});


//raise a query 
export const createFAQ = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { name, phoneNo } = req.body;

    try {
        // Find the site by ID
        const site = await Site.findById(id);
        if (!site) {
            return next(new ErrorHandler('Site not found', 404));
        }

        // Create a new FAQ
        const faq = new FAQ({
            site: id,
            Name: name,
            phoneNo: phoneNo
        });

        await faq.save();

        res.status(201).json({
            success: true,
            message: 'FAQ created successfully',
            faq
        });
    } catch (error) {
        console.log('Error while creating FAQ:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});


// Get all FAQs with pagination
export const getAllFAQs = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    try {
        // Find all FAQs with pagination and populate the site name
        const faqs = await FAQ.find()
            .sort({ createdAt: -1 }) // Sort in reverse order by creation date
            .skip(skip)
            .limit(limit)
            .populate('site', 'name'); // Populate the site field with its name

        const totalFAQs = await FAQ.countDocuments();

        res.status(200).json({
            success: true,
            count: faqs.length,
            totalFAQs,
            totalPages: Math.ceil(totalFAQs / limit),
            currentPage: page,
            faqs
        });
    } catch (error) {
        console.log('Error while fetching FAQs:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});



//delete bulk faqs
export const deleteFAQsBeforeDate = asyncHandler(async (req, res, next) => {
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

        // Delete FAQs created before the specified date
        const result = await FAQ.deleteMany({ createdAt: { $lt: date } });

        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} FAQs created before ${date.toLocaleString('default', { month: 'long' })} ${yearInt}`
        });
    } catch (error) {
        console.log('Error while deleting FAQs:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});