// routes/auth.js
import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import sendOtpEmail from '../mailer.js';
import otpGenerator from 'otp-generator';
import jwt from 'jsonwebtoken';


const router = express.Router();

// Signup route
router.post('/signup', async (req, res) => {
    const { firstName, lastName, email, password, contactMode } = req.body;

    try {
        // Generate OTP
        const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });

        const user = new User({
            firstName,
            lastName,
            email,
            password, // Store password as is for now; we'll hash it after OTP verification
            contactMode,
            otp,
            otpExpires: Date.now() + 300000, // 5 minutes
        });

        await sendOtpEmail(email, otp);
        await user.save();

        res.status(200).json({ message: 'OTP sent to email, please verify.' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// OTP verification route
router.post('/verify-otp', async (req, res) => {
    const { email, otp, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user || user.otp !== otp || Date.now() > user.otpExpires) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.otp = undefined; // Clear OTP after verification
        user.otpExpires = undefined; // Clear expiration time

        await user.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    } 3
});

router.post('/login', async(req, res) => {
    const { email, password } = req.body;
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(regex.test(email)){
        const user = await User.findOne({ email });
        if(user){
            // comapare hash with password
            const result = await bcrypt.compare(password, user.password);
            if(result){
                const token = jwt.sign({email: user.email, id: user._id, name: user.firstName+" " + user.lastName}, process.env.KEY);
                // console.log(token);
                return res.status(200).json({message: "login success", token});
            }
            else{
                return res.status(400).json({message: "login failed"});
            }
        }
        else{
            return res.status(400).json({ message: "User does not exist" });
        }
    }   
    else{
        return res.status(400).json({ message: "invalid email"});
    }
})


router.get("/profile", (req, res) => {
    let token = req.headers.authorization;
    if(!token) {
        return res.status(401).json({ message: "token absent" });
    }
    else{
        token = token.split(" ")[1];
        const data = jwt.verify(token, process.env.KEY);
        if(data){
            return res.status(200).json({ message: data});
        }    
        else{
            return res.status(401);
        }
    }
})

export default router;
