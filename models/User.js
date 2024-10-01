// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    contactMode: { type: String, enum: ['Email', 'Phone'], required: true },
    otp: { type: String },
    otpExpires: { type: Date },
});

const User = mongoose.model('User', userSchema);
export default User;
