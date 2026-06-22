const express = require('express');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const Article = require('../models/Article');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

function calculatePaginationRange(currentPage, totalPages) {
    let delta = 2;
    let left = currentPage - delta;
    let right = currentPage + delta;
    let range = [];
    let rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= left && i <= right)) {
            range.push(i);
        }
    }

    for (let i of range) {
        if (l) {
            if (i - l === 2) {
                rangeWithDots.push(l + 1);
            } else if (i - l !== 1) {
                rangeWithDots.push('...');
            }
        }
        rangeWithDots.push(i);
        l = i;
    }
    return rangeWithDots;
}


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'narmanews-avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    }
});

const upload = multer({ storage });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

router.get('/register', (req, res) => {
    res.render('register', { error: null });
});

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || username.length < 6 || username.length > 10) {
            return res.render('register', { error: 'Username must be between 6 and 10 characters.' });
        }
        if (!/^[a-zA-Z0-9]+$/.test(username)) {
            return res.render('register', { error: 'Username can only contain English letters and numbers.' });
        }

        if (!password || password.length < 6 || password.length > 15) {
            return res.render('register', { error: 'Password must be between 6 and 15 characters.' });
        }
        if (!/(?=.*[0-9])/.test(password)) {
            return res.render('register', { error: 'Password must contain at least one digit.' });
        }
        if (!/^[a-zA-Z0-9]+$/.test(password)) {
            return res.render('register', { error: 'Password can only contain English letters and numbers.' });
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.render('register', { error: 'Username is already taken' });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            if (!existingEmail.verified) {
                return res.redirect(`/auth/verify?email=${email}`);
            }
            return res.render('register', { error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        await User.create({
            username,
            email,
            password: hashedPassword,
            verified: false,
            verificationCode: code,
            verificationExpires: Date.now() + 1000 * 60 * 10
        });

        const verifyUrl = `${req.protocol}://${req.get('host')}/auth/verify?email=${encodeURIComponent(email)}`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'NarmaNews Email Verification',
            html: `
                <div style="font-family:Arial;padding:20px">
                    <h2>Welcome to NarmaNews</h2>
                    <p>Your verification code:</p>
                    <h1 style="color:#0d6efd">${code}</h1>
                    <p>This code expires in 10 minutes.</p>
                    <p>Click the link below to enter your code:</p>
                    <a href="${verifyUrl}" style="display:inline-block;padding:10px 15px;color:#fff;background-color:#0d6efd;text-decoration:none;border-radius:5px;">Verify Account</a>
                    <br><br>
                    <p><small>Or copy and paste this link in your browser: <br><a href="${verifyUrl}">${verifyUrl}</a></small></p>
                </div>
            `
        });

        res.redirect(`/auth/verify?email=${email}`);
    } catch (err) {
        console.error("Register error:", err);
        res.render('register', { error: 'Register error. Please try again.' });
    }
});

router.get('/verify', (req, res) => {
    res.render('verify', { email: req.query.email || '', error: null, success: null });
});

router.post('/verify', async (req, res) => {
    const { email, code } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.render('verify', { email, error: 'User not found', success: null });
        }

        if (user.verificationCode !== code) {
            return res.render('verify', { email, error: 'Invalid verification code', success: null });
        }

        if (user.verificationExpires < Date.now()) {
            return res.render('verify', { email, error: 'Verification code has expired. Please request a new one.', success: null });
        }

        user.verified = true;
        user.verificationCode = null;
        user.verificationExpires = null;

        await user.save();
        res.redirect('/auth/login');
    } catch (err) {
        console.error("Verification error:", err);
        res.render('verify', { email, error: 'Verification error. Please try again.', success: null });
    }
});

router.post('/resend', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.render('verify', { email, error: 'User not found', success: null });
        }

        if (user.verified) {
            return res.redirect('/auth/login');
        }

        const newCode = Math.floor(100000 + Math.random() * 900000).toString();

        user.verificationCode = newCode;
        user.verificationExpires = Date.now() + 1000 * 60 * 10;
        await user.save();

        const verifyUrl = `${req.protocol}://${req.get('host')}/auth/verify?email=${encodeURIComponent(email)}`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'NarmaNews New Verification Code',
            html: `
                <div style="font-family:Arial;padding:20px">
                    <h2>Welcome to NarmaNews</h2>
                    <p>Your new verification code:</p>
                    <h1 style="color:#0d6efd">${newCode}</h1>
                    <p>This code expires in 10 minutes.</p>
                    <p>Click the link below to enter your code:</p>
                    <a href="${verifyUrl}" style="display:inline-block;padding:10px 15px;color:#fff;background-color:#0d6efd;text-decoration:none;border-radius:5px;">Verify Account</a>
                    <br><br>
                    <p><small>Or copy and paste this link in your browser: <br><a href="${verifyUrl}">${verifyUrl}</a></small></p>
                </div>
            `
        });

        res.render('verify', { email, error: null, success: 'A new code has been sent to your email.' });
    } catch (err) {
        console.error("Resend code error:", err);
        res.render('verify', { email, error: 'Failed to resend code. Please try again.', success: null });
    }
});

router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.render('login', { error: 'Email not found' });
        }

        if (!user.verified) {
            return res.render('login', { error: 'Please verify your email first' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render('login', { error: 'Incorrect password' });
        }

        req.session.userId = user._id;
        res.redirect('/');
    } catch (err) {
        console.error("Login error:", err);
        res.render('login', { error: 'Something went wrong. Please try again.' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

router.get('/profile', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/auth/login');
    }
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.redirect('/auth/login');
        }
        res.render('profile', { user, error: req.query.error || null });
    } catch (err) {
        console.error("Profile view fetch error:", err);
        res.redirect('/');
    }
});

router.post('/profile/upload', upload.single('avatar'), async (req, res) => {
    if (!req.session.userId || !req.file) {
        return res.redirect('/auth/profile');
    }
    try {
        await User.findByIdAndUpdate(req.session.userId, {
            profileImage: req.file.path
        });
        res.redirect('/auth/profile');
    } catch (err) {
        console.error("Profile image upload error:", err);
        res.redirect('/auth/profile');
    }
});

router.post('/profile/update', async (req, res) => {
    if (!req.session.userId) return res.redirect('/auth/login');

    try {
        const { username } = req.body;

        if (!username || username.length < 6 || username.length > 10) {
            return res.redirect('/auth/profile?error=Username+must+be+between+6+and+10+characters.');
        }
        if (!/^[a-zA-Z0-9]+$/.test(username)) {
            return res.redirect('/auth/profile?error=Username+can+only+contain+English+letters+and+numbers.');
        }

        const existingUsername = await User.findOne({ username, _id: { $ne: req.session.userId } });
        if (existingUsername) {
            return res.redirect('/auth/profile?error=Username+is+already+taken');
        }

        await User.findByIdAndUpdate(req.session.userId, { username });
        res.redirect('/auth/profile');
    } catch (err) {
        console.error("========== ERROR ==========");
        console.error(err);
        console.error("========== END ERROR ==========");
        res.redirect('/auth/profile');
    }
});

router.post('/favorites/toggle/:articleId', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'Please log in' });
    }

    const { articleId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
        return res.status(400).json({ success: false, message: 'Invalid Article ID' });
    }

    try {
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).json({ success: false });

        if (!user.favorites) {
            user.favorites = [];
        }

        const index = user.favorites.findIndex(fav => fav.toString() === articleId);
        let isAdded = false;

        if (index === -1) {
            user.favorites.push(articleId);
            isAdded = true;
        } else {
            user.favorites.splice(index, 1);
        }

        await user.save();
        res.json({ success: true, isAdded });
    } catch (err) {
        console.error("Favorites toggle error:", err);
        res.status(500).json({ success: false });
    }
});

router.get('/favorites', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/auth/login');
    }
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.redirect('/auth/login');
        }

        const favoriteIds = user.favorites || [];
        const limit = 15;
        const page = parseInt(req.query.page) || 1;
        const totalArticles = favoriteIds.length;
        const totalPages = Math.ceil(totalArticles / limit) || 1;

        const startIndex = (page - 1) * limit;
        const paginatedIds = favoriteIds.slice(startIndex, startIndex + limit);

        const articles = await Article.find({ _id: { $in: paginatedIds } });
        const rangeWithDots = calculatePaginationRange(page, totalPages);

        res.render('favorites', {
            user: user,
            articles: articles,
            currentPage: page,
            totalPages: totalPages,
            paginationRange: rangeWithDots
        });
    } catch (err) {
        console.error("Favorites view fetch error:", err);
        res.status(500).send('Server Error');
    }
});

router.post('/profile/delete', async (req, res) => {
    if (!req.session.userId) return res.redirect('/auth/login');

    try {
        const { confirmUsername } = req.body;
        const user = await User.findById(req.session.userId);

        if (user.username !== confirmUsername) {
            return res.redirect('/auth/profile?error=Username+mismatch');
        }

        await User.findByIdAndDelete(req.session.userId);
        req.session.destroy(() => {
            res.redirect('/');
        });
    } catch (err) {
        console.error("Account deletion error:", err);
        res.redirect('/auth/profile?error=Delete+failed');
    }
});
module.exports = router;