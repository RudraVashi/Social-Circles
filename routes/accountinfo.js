const express = require('express');
const router = express.Router();
const db = require('../database/db');

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

router.get('/', async (req, res) => {
    try {
        // Get user data from database
        const [users] = await db.execute("SELECT * FROM users WHERE id = ?", [req.session.user.id]);
        
        if (users.length === 0) {
            req.session.destroy();
            return res.redirect('/login');
        }
        
        const user = users[0];
        res.render('accountinfo', { user });
    } catch (error) {
        console.error("Account Info Error:", error);
        res.status(500).send("Error retrieving account information");
    }
});

module.exports = router;