import mongoose from "mongoose";

const companyFillSchema = new mongoose.Schema({
    companyName: {
      type: String,
      required: [true, 'Company Name is required'],
      trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
    authorizedSignatory: {
      type: String,
      required: [true, 'Authorized Signatory name is required'],
      trim: true
    },
    gstNumber: {
      type: String,
      required: [true, 'GST Number is required'],
      
      unique: true
    },
    panNumber: {
      type: String,
      required: [true, 'PAN Number is required'],
     
      unique: true
    },
    panPhoto: {
      type: String, // URL of the uploaded photo
      required: [true, 'PAN Photo is required']
    },
    companyAddress: {
      type: String,
      required: [true, 'Company Address is required'],
      trim: true
    },
    authorizedSignatoryAddress: {
      type: String,
      required: [true, 'Authorized Signatory Address is required'],
      trim: true
    },
    passportPhoto: {
      type: String, // URL of the uploaded photo
      required: [true, 'Passport Photo is required']
    },
    paymentPlan: {
      type: String,
      required: [true, 'Payment Plan is required'],
      enum: ['Down Payment Plan', 'Possession Link Payment Plan', 'Flexi Payment Plan'],
      default: 'Installment Plan'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    allotment:{
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    project: {
      type: String,
      required: true
    },
  });
  
  // Add compound index for better query performance
  companyFillSchema.index({ companyName: 1, gstNumber: 1 });
  
 const Companyfill = mongoose.model('CompanyFill', companyFillSchema);

 export default Companyfill;