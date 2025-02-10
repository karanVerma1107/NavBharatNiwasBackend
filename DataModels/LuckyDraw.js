import mongoose from 'mongoose';

const luckyDrawSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  phoneNo: {
    type: String,
    required: true
  },
  occupation: {
    type: String,
    required: true
  },
  AdhaarNo: {
    type: String,
    required: true
  },
  adhaarPhoto: { // Added field for Aadhaar photo (URL)
    type: String,
    required: true
  },
  PANno: {
    type: String,
    required: true
  },
  panPhoto: { // Added field for PAN photo (URL)
    type: String,
    required: true
  },
  image: { // Assuming this is a profile photo
    type: String,
    required: true
  },
  fatherName: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  openingDate: {
    type: Date,
    required: true
  },
  DOB: {
    type: Date,
    required: true
  },
  project: {
    type: String,
    required: true
  },
  nationality: {
    type: String,
    required: true
  },
  allotment: {
    type: String
  },
  paymentPlan: { // Added field for payment plan
    type: String,
    required: true,
    enum: ['Down Payment Plan', 'Possession Link Payment Plan', 'Flexi Payment Plan'],
    default: 'Down Payment Plan'
  },
  plotSize: { // Added field for Plot Size
    type: String,
    enum: ['125 SQY - 150 SQY', '150 SQY - 200 SQY', 'ABOVE 200 SQY'],
    required: true
  },
  preference: { // Added field for Preference
    type: String,
    enum: ['Corner', 'Park Facing', 'N/A'],
    required: true
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

const LuckyDraw = mongoose.model('LuckyDraw', luckyDrawSchema);

export default LuckyDraw;
