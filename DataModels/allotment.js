import mongoose from 'mongoose';

const AllotmentSchema = new mongoose.Schema({
  name: { type: String },
  swdo: { type: String }, // Son/Wife/Daughter Of
  phoneNumber: { type: String },
  gstNumber: { type: String },
  dob: { type: Date },
  nationality: { type: String },
  company: { type: String },
  emailId: { type: String },
  aadhaarNo: { type: String },
  panNo: { type: String },
  profession: { type: String },
  address: { type: String },
  uniqueId: { type: String }, // Unique ID
  // Property Details
  developmentCharge: { type: String },
  area: { type: String },
  unitNo: { type: String },
  plc: { type: String }, // Preferential Location Charges
  paymentPlan: { type: String },
  changeinPP: { type: String }, // Change in Payment Plan
  date:{type: Date},
  // Payment Details
  plcAmount: { type: String },
  registrationAmount: { type: String },
  totalCost: { type: String },
  modeOfPayment: { type: String },
  chequeNoDDNo: { type: String },
  bankName: { type: String },
  amount: { type: String },
  chequeDateDDDate: { type: Date },
  transactionId: { type: String },
  image:{type: String},

  // Storing 3 Separate Signatures as Base64
  sign1: { type: String }, 
  sign2: { type: String }, 
  sign3: { type: String }, 

}, { timestamps: true });

const Allotment = mongoose.model("Allotment", AllotmentSchema);

export default Allotment;