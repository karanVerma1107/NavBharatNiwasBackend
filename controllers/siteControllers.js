import Site from "../DataModels/SiteSchema.js";
import asyncHandler from "../middleware/helper/asyncHandler.js";
import ErrorHandler from "../middleware/apiError.js";
import cloudinary from 'cloudinary';
import fs from 'fs';
import FAQ from "../DataModels/FAQ.js";
import User from "../DataModels/userSchema.js";

cloudinary.config({
    cloud_name: "dwpdxuksp",
    api_key: "611646721796323",
    api_secret: "ejsJOwHcdFugMNDFy88WXPtPMd8"
}); 
  

// Add a Site to inventory
export const addSite = asyncHandler(async (req, res, next) => {

    console.log("req.body",req.body);
    console.log("req.files",req.files);

    const { name, description, current, formYes } = req.body; // Default discount to 0
    const images = req.files; // Assuming `req.files` contains the uploaded images

    // Check if user is admin
    if (req.user.role !== 'admin') {
        return next(new ErrorHandler('You are not authorized to add a product', 403));
    }

    console.log(name, description, current, images, formYes);

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
            formYes: formYes || false,
            postedBy: req.user.userName

           
        });

        // Save the product to the database
        await newSite.save();

        // Respond with success message
        return res.status(201).json({
            success: true,
            message: 'Site added successfully!',
            site: newSite,
        });

    } catch (error) {
        console.error('Error adding site:', error);
        return next(new ErrorHandler('Error adding site. Please try again.', 500));
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
    const { name, description, current, formYes } = req.body;

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
        site.formYes = formYes || site.formYes;

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







// Upload Receipt
export const uploadReceipt = async (req, res, next) => {
    try {
        const { name, userId } = req.body;
        const file = req.file; // Get the file path from Cloudinary

        let user;

        if (req.user.role === 'admin' && userId) {
            // If the user is an admin and a userId is provided, find the user by ID
            user = await User.findById(userId);
        } else {
            return res.status(401).json({
                success: false,
                message: 'Not authorized user'
            });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized user'
            });
        }

        // Upload file to Cloudinary
        const result = await cloudinary.uploader.upload(file, {
            resource_type: 'raw' // Ensure the resource type is set to 'raw' for non-image files
        });

        // Delete local file after upload to Cloudinary
        fs.unlink(file, (err) => {
            if (err) {
                console.error(`Failed to delete file: ${file}`, err);
            } else {
                console.log(`File deleted from local server: ${file}`);
            }
        });

        // Add the receipt to the user's receipts array
        user.receipts.push({ name, file: result.secure_url });
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Receipt uploaded successfully',
            receipts: user.receipts
        });
    } catch (error) {
        console.log('Error while uploading receipt:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
};


// Function to get images of top 5 sites in reverse order
export const getTop5SiteImages = asyncHandler(async (req, res, next) => {
    try {
        // Fetch top 5 sites sorted by creation date in descending order
        const sites = await Site.find().sort({ createdAt: -1 }).limit(5);

        // Extract required fields from the sites
        const siteData = sites.map(site => ({
            _id: site._id,
            current: site.current,
            name: site.name,
            images: site.images
        })).reverse();

        // Respond with the site data
        return res.status(200).json({
            success: true,
            sites: siteData
        });
    } catch (error) {
        console.log('Error while fetching top 5 site images:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});


export const getPostsByCurrentStatus = asyncHandler(async (req, res, next) => {
    const { status } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    if (!['ongoing', 'upcoming', 'testimonial'].includes(status)) {
        return next(new ErrorHandler('Invalid status parameter', 400));
    }

    try {
        // Fetch posts based on current status with pagination
        const sites = await Site.find({ current: status })
            .skip(skip)
            .limit(limit);

        // Get total count of sites for the given status
        const totalSites = await Site.countDocuments({ current: status });

        // Respond with the site data and pagination info
        return res.status(200).json({
            success: true,
            sites,
            page,
            pages: Math.ceil(totalSites / limit),
        });
    } catch (error) {
        console.log('Error while fetching posts by current status:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});



 // Search site by name (returns name and id)
export const searchSite = async (req, res, next) => {
  try {
    const searchQuery = req.query.name;  // Get search query from URL params

    // Check if search query is provided
    if (!searchQuery) {
      throw new ErrorHandler('Search query is required', 400); // Throw custom error if query is missing
    }

    // Use a case-insensitive regex to find sites starting with the search query
    const sites = await Site.find({
      name: { $regex: `^${searchQuery}`, $options: 'i' },  // Match starting string (case-insensitive)
    }).select('name _id'); // Only select name and _id fields

    // If no sites are found
    if (!sites || sites.length === 0) {
      throw new ErrorHandler('No sites found matching the search query', 404); // Custom error if no sites match
    }

    // Return matching sites
    return res.status(200).json(sites);
  } catch (error) {
    // If an error occurs, pass it to the error handler
    next(error);
  }
};