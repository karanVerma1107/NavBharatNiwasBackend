import express from 'express';
import { isAuthenticatedUser } from '../middleware/auth.js';    
import { addSite, createFAQ, deleteFAQsBeforeDate, deleteSite, editSite, getAllFAQs, getPostsByCurrentStatus, getSiteById, getSitesWithPagination, getTop5SiteImages, searchSite, uploadReceipt } from '../controllers/siteControllers.js';
import { upload } from '../middleware/helper/multer.js';
import { checkFormAndFetchResults, createCompanyAllotment, createFaa, createIndiAllotment, getAllFAQss, getAllotmentById, getCompanyFills, getIsAllow, getIsAllowResults, getLuckyDrawById, getLuckyDraws, getSitesByStateAndCity, getUserAllotments, pushCompanyIdToResult, pushIdToResult, searchAllotments, searchCompanyFillById, searchLuckyDrawById, updateCompanyFillStatus, updateLuckyDrawStatus, updateSignature, updateUserHistory } from '../controllers/drawControllers.js';

const Srouter = express.Router();

Srouter.route('/createSite').post(isAuthenticatedUser,upload.array('images', 5), addSite);
Srouter.route('/getSites').get(getSitesWithPagination);
Srouter.route('/editSite/:id').put(isAuthenticatedUser, editSite)
Srouter.route('/deleteSite/:id').delete(isAuthenticatedUser, deleteSite);
Srouter.route('/getSite/:id').get(getSiteById);
Srouter.route('/createFAQ/:id').post(createFAQ);
Srouter.route('/getFAQ').get(isAuthenticatedUser,getAllFAQs);
Srouter.route('/deleteFAQ').delete(isAuthenticatedUser, deleteFAQsBeforeDate);
Srouter.route('/uploadReceipt').post(isAuthenticatedUser, upload.single('file'),uploadReceipt)
Srouter.route('/getImages').get(getTop5SiteImages);
Srouter.route('/sites/:status').get(getPostsByCurrentStatus);
Srouter.route('/search').get(searchSite);
Srouter.route('/searchDraw/:id').get(isAuthenticatedUser,searchLuckyDrawById);
//Srouter.route('/searchCDraw/:id').get(isAuthenticatedUser,searchCompanyFillById);
Srouter.route('/draw/:id').get(isAuthenticatedUser,getLuckyDrawById);
Srouter.route('/companyDraw/:id').get(isAuthenticatedUser,searchCompanyFillById);
Srouter.route('/update-draw-status').put(isAuthenticatedUser,updateLuckyDrawStatus);
Srouter.route('/update-company-status').put(isAuthenticatedUser, updateCompanyFillStatus);
Srouter.route('/getAlldraws').get(isAuthenticatedUser,getLuckyDraws);
Srouter.route('/getCompany').get(isAuthenticatedUser,getCompanyFills);
Srouter.route('/pass/:Lid/:allot/:gift').put(isAuthenticatedUser, pushIdToResult);
Srouter.route('/Cpass/:companyId/:allot/:gift').put(isAuthenticatedUser, pushCompanyIdToResult);
Srouter.route('/history').get(isAuthenticatedUser,updateUserHistory);
Srouter.route('/fill-form').post(createFaa);
Srouter.route('/result/:formId').get(isAuthenticatedUser,checkFormAndFetchResults);
Srouter.route('/sites').get(getSitesByStateAndCity);

Srouter.route('/getAllisallow').get(isAuthenticatedUser,getIsAllow);
Srouter.route('/getisallow/:id').get(isAuthenticatedUser, getIsAllowResults);
Srouter.route('/createIndiAllotment').post(isAuthenticatedUser,createIndiAllotment );
Srouter.route('/createCAllotment').post(isAuthenticatedUser,createCompanyAllotment );
Srouter.route('/getAllotment').get(isAuthenticatedUser, getUserAllotments );
Srouter.route('/getAllotment/:query').get(isAuthenticatedUser, searchAllotments );
Srouter.route('/getAllotmentbyId/:id').get(isAuthenticatedUser, getAllotmentById );
Srouter.route('/sign/:allotmentId').post(isAuthenticatedUser, updateSignature );
Srouter.route('/seefaq').get(isAuthenticatedUser,getAllFAQss);




export default Srouter;