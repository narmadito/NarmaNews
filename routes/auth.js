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
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || username.length < 6 || username.length > 20) {
            return res.render('register', { error: 'Username must be between 6 and 20 characters.' });
        }
        if (!/^[a-zA-Z0-9._]+$/.test(username)) {
            return res.render('register', { error: 'Username can only contain alphanumeric characters, dots, and underscores.' });
        }

        if (!email || !emailRegex.test(email)) {
            return res.render('register', { error: 'Please enter a valid email address.' });
        }

        if (!password || password.length < 8 || password.length > 20) {
            return res.render('register', { error: 'Password must be between 8 and 20 characters.' });
        }
        if (!/(?=.*[0-9])/.test(password)) {
            return res.render('register', { error: 'Password must contain at least one digit.' });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });

        if (existingUser) {
            if (existingUser.username === username) {
                return res.render('register', { error: 'Username is already taken.' });
            }
            if (existingUser.email === email) {
                if (!existingUser.verified) {
                    return res.redirect(`/auth/verify?email=${encodeURIComponent(email)}`);
                }
                return res.render('register', { error: 'Email already exists.' });
            }
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

        transporter.sendMail({
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
        }).catch(err => console.error("Background email send error:", err));

        res.redirect(`/auth/verify?email=${encodeURIComponent(email)}`);

    } catch (err) {
        if (err.code === 11000) {
            return res.render('register', { error: 'Username or Email already exists.' });
        }
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

        transporter.sendMail({
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
        }).catch(err => console.error("Background resend email error:", err));

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

router.get('/settings', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/auth/login');
    }
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.redirect('/auth/login');
        }

        res.render('settings', {
            user,
            currentUser: user,
            hideTicker: true,
            error: req.query.error || null,
            success: req.query.success || null
        });
    } catch (err) {
        console.error("Settings view error:", err);
        res.redirect('/');
    }
});

router.post('/settings/privacy', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    try {
        const { showEmail } = req.body;

        await User.findByIdAndUpdate(req.session.userId, {
            showEmail: showEmail === true
        });

        res.json({ success: true });
    } catch (err) {
        console.error("Privacy update error:", err);
        res.status(500).json({ success: false });
    }
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
        res.render('profile', {
            user,
            isOwnProfile: true,
            error: req.query.error || null,
            success: req.query.success || null
        });
    } catch (err) {
        console.error("Profile view fetch error:", err);
        res.redirect('/');
    }
});

router.get('/profile/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.redirect('/');
        }

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return res.redirect('/');
        }

        const isOwn = req.session.userId && req.params.id === req.session.userId.toString();

        res.render('profile', {
            user: targetUser,
            isOwnProfile: !!isOwn,
            error: null,
            success: null
        });
    } catch (err) {
        console.error("Foreign profile view error:", err);
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

        if (!username || username.length < 6 || username.length > 20) {
            return res.redirect('/auth/profile?error=Username+must+be+between+6+and+20+characters.');
        }

        if (!/^[a-zA-Z0-9._]+$/.test(username)) {
            return res.redirect('/auth/profile?error=Username+can+only+contain+alphanumeric+characters,+dots,+and+underscores.');
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
        const userId = req.session.userId;
        const user = await User.findById(userId);

        if (!user || user.username !== confirmUsername) {
            return res.redirect('/auth/profile?error=Username+mismatch');
        }

        if (user.profileImage && user.profileImage.includes('cloudinary.com')) {
            try {
                const urlParts = user.profileImage.split('/');
                const folderAndFile = urlParts.slice(-2).join('/');
                const publicId = folderAndFile.split('.')[0];

                await cloudinary.uploader.destroy(publicId);
            } catch (clErr) {
                console.error("Cloudinary image delete error:", clErr);
            }
        }

        await Article.updateMany(
            {},
            {
                $pull: {
                    'reactions.like': userId,
                    'reactions.funny': userId,
                    'reactions.sad': userId,
                    'reactions.wow': userId,
                    'reactions.angry': userId
                }
            }
        );

        await Article.updateMany(
            {},
            {
                $pull: {
                    comments: { user: userId }
                }
            }
        );

        await User.findByIdAndDelete(userId);

        req.session.destroy((err) => {
            if (err) {
                console.error("Session destroy error during deletion:", err);
            }
            res.clearCookie('connect.sid');
            res.redirect('/');
        });

    } catch (err) {
        console.error("Account deletion error:", err);
        res.redirect('/auth/profile?error=Delete+failed');
    }
});

router.post('/profile/change-password', async (req, res) => {
    if (!req.session.userId) return res.redirect('/auth/login');

    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.redirect('/auth/login');
        }

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            return res.redirect('/auth/profile?error=Incorrect+current+password.');
        }

        if (!newPassword || newPassword.length < 6 || newPassword.length > 15) {
            return res.redirect('/auth/profile?error=New+password+must+be+between+6+and+15+characters.');
        }
        if (!/(?=.*[0-9])/.test(newPassword)) {
            return res.redirect('/auth/profile?error=New+password+must+contain+at+least+one+digit.');
        }
        if (!/^[a-zA-Z0-9]+$/.test(newPassword)) {
            return res.redirect('/auth/profile?error=New+password+can+only+contain+English+letters+and+numbers.');
        }

        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.redirect('/auth/profile?error=New+password+cannot+be+the+same+as+your+old+password.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        await user.save();

        res.redirect('/auth/profile?success=Password+updated+successfully!');
    } catch (err) {
        console.error("Change password error:", err);
        res.redirect('/auth/profile?error=Something+went+wrong.+Please+try+again.');
    }
});

module.exports = router;