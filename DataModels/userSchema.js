import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
    },
    name: {
        type: String,
        required: true,
    
    },
    email: {
        type: String,
        required: true,
        unique: true,
    
    },
    formFilled: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LuckyDraw'
    }],
    receipts: [{
        name: {
            type: String,
            required: true
        },
        file: {
            type: String,
            required: true
        }
        
    }],

    EOI: [{
        name: {
            type: String,
            required: true
        },
        file: {
            type: String,
            required: true
        }
        
    }],


    otp: {
        type: String,
        trim: true
    },
    otpExpire: {
        type: Date
    },
    phoneNo: {
        type: String,
    
    },
    city: {
        type: String,
        
    },
    history: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IsAllow' // Linking to the IsAllow model
     }],
    role:{
        type: String,
        enum: ['admin', 'user'],
        required: true,
        default: 'user'
      },
    LuckyDraw:[{
        type: String
    }]


}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

userSchema.pre('save', async function(next) {
    if (this.isModified('otp')) {
        const saltRounds = await bcrypt.genSalt(10);
        this.otp = await bcrypt.hash(this.otp, saltRounds);
    }
    next();
});

userSchema.methods.isOtpCorrect = async function(otp) {
    return await bcrypt.compare(otp, this.otp);
};

userSchema.methods.generateAccessToken = function() {
    return jwt.sign({
        _id: this._id,
        username: this.userName,
        name: this.name,
        email: this.email
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRE
    });
};

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign({
        _id: this._id
    }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRE
    });
};

const User = mongoose.model('User', userSchema);
export default User;