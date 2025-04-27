const express = require('express');
const router = express.Router();
const db = require('../database/db');
const bcrypt = require('bcrypt');

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Apply authentication middleware to all routes in this router
router.use(isAuthenticated);

// Get account information
router.get('/', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    const userId = req.session.user.id;
    let score = 0;
    try {
        const [rows] = await db.execute(
            'SELECT score FROM scores WHERE user_id = ? ORDER BY id DESC LIMIT 1',
            [userId]
        );
        if (rows.length > 0) {
            score = rows[0].score;
        }
    } catch (err) {
        console.error('Error fetching score:', err);
    }

    res.render('accountinfo', {
        user: req.session.user,
        score: score,
        errorMsg: null,
        successMsg: null
    });
});

// Handle biography update
router.post('/update-bio', isAuthenticated, async (req, res) => {
    const { biography } = req.body;
    
    try {
        await db.execute(
            "UPDATE users SET biography = ? WHERE id = ?",
            [biography, req.session.user.id]
        );
        
        res.redirect('/accountinfo?success=Biography updated successfully');
    } catch (error) {
        console.error("Bio Update Error:", error);
        res.redirect('/accountinfo?error=Failed to update biography');
    }
});

// Handle email update
router.post('/update-email', isAuthenticated, async (req, res) => {
    const { email } = req.body;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.redirect('/accountinfo?error=Invalid email format');
    }
    
    try {
        // Check if email is already in use by another user
        const [existingUsers] = await db.execute(
            "SELECT * FROM users WHERE email = ? AND id != ?", 
            [email, req.session.user.id]
        );
        
        if (existingUsers.length > 0) {
            return res.redirect('/accountinfo?error=Email already in use');
        }
        
        await db.execute(
            "UPDATE users SET email = ? WHERE id = ?",
            [email, req.session.user.id]
        );
        
        res.redirect('/accountinfo?success=Email updated successfully');
    } catch (error) {
        console.error("Email Update Error:", error);
        res.redirect('/accountinfo?error=Failed to update email');
    }
});

// Handle password update
router.post('/update-password', isAuthenticated, async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validate password
    if (newPassword.length < 6) {
        return res.redirect('/accountinfo?error=Password must be at least 6 characters');
    }
    
    if (newPassword !== confirmPassword) {
        return res.redirect('/accountinfo?error=Passwords do not match');
    }
    
    try {
        // Get current password hash
        const [users] = await db.execute(
            "SELECT password_hash FROM users WHERE id = ?",
            [req.session.user.id]
        );
        
        if (users.length === 0) {
            return res.redirect('/login');
        }
        
        // Verify current password
        const match = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!match) {
            return res.redirect('/accountinfo?error=Current password is incorrect');
        }
        
        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await db.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            [hashedPassword, req.session.user.id]
        );
        
        res.redirect('/accountinfo?success=Password updated successfully');
    } catch (error) {
        console.error("Password Update Error:", error);
        res.redirect('/accountinfo?error=Failed to update password');
    }
});

module.exports = router;