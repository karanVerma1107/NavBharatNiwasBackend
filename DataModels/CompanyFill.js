import mongoose from "mongoose";

const companyFillSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Company Name is required'],
  
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorizedSignatory: {
    type: String,
    required: [true, 'Authorized Signatory name is required'],
   
  },
  gstNumber: {
    type: String,
    required: [true, 'GST Number is required'],
   
  },
  panNumber: {
    type: String,
    required: [true, 'PAN Number is required'],
   
  },
  panPhoto: {
    type: String, // URL of the uploaded photo
    required: [true, 'PAN Photo is required']
  },
  companyAddress: {
    type: String,
    required: [true, 'Company Address is required'],
    
  },
  authorizedSignatoryAddress: {
    type: String,
    required: [true, 'Authorized Signatory Address is required'],
    
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
  allotment: {
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
  // New fields added
  plotSize: { // Added field for Plot Size
    type: String,
    enum: ['125 SQY - 150 SQY', '150 SQY - 200 SQY', 'ABOVE 200 SQY'],
    required: true
  },
  preference: { // Added field for Preference
    type: String,
    enum: ['Corner', 'Park Facing', 'N/A'],
    required: true
  },
  gift:{
    type:String
  }
});

// Add compound index for better query performance
companyFillSchema.index({ companyName: 1, gstNumber: 1 });

const Companyfill = mongoose.model('CompanyFill', companyFillSchema);

export default Companyfill;
