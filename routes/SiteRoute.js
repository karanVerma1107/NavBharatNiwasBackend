import express from 'express';
import { isAuthenticatedUser } from '../middleware/auth.js';    
import { addSite, createFAQ, deleteFAQsBeforeDate, deleteSite, editSite, getAllFAQs, getSiteById, getSitesWithPagination } from '../controllers/siteControllers.js';
import { upload } from '../middleware/helper/multer.js';

const Srouter = express.Router();

Srouter.route('/createSite').post(isAuthenticatedUser,upload.array('images', 5), addSite);
Srouter.route('/getSites').get(getSitesWithPagination);
Srouter.route('/editSite/:id').put(isAuthenticatedUser, editSite)
Srouter.route('/deleteSite/:id').delete(isAuthenticatedUser, deleteSite);
Srouter.route('/getSite/:id').get(getSiteById);
Srouter.route('/createFAQ/:id').post(createFAQ);
Srouter.route('/getFAQ').get(isAuthenticatedUser,getAllFAQs);
Srouter.route('/deleteFAQ').delete(isAuthenticatedUser, deleteFAQsBeforeDate);


export default Srouter;