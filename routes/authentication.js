const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database/db');

const SALT_ROUNDS = 10;

router.get('/', (req, res) => {
    const error = req.query.error || null;
    res.render('login', {msg: ""});
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [users] = await db.execute("SELECT * FROM users WHERE username = ?", [username]);

        if (users.length === 0) {
            res.render("login", { msg: "Wrong Username or Password." });
        }

        const user = users[0];

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            res.render("login", { msg: "Wrong Username or Password." });
        }

        req.session.user = {
            id: user.id,
            username: user.username
        };
        
        res.redirect('/accountinfo');
    } catch (error) {
        console.error("Login Error:", error);
        //res.status(500).send("Error logging in");
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
        }
        res.redirect('/login');
    });
});

router.get('/signup', (req, res) => {
    const error = req.query.error || null;
    res.render('signup', { error });
});

router.post('/signup', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password) {
        return res.redirect('/signup?error=Username and password are required');
    }
    
    // Basic email validation if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.redirect('/signup?error=Invalid email format');
    }
    
    try {
        // Check if username already exists
        const [existingUsers] = await db.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        
        if (existingUsers.length > 0) {
            return res.redirect('/signup?error=Username already exists');
        }
        
        // Check if email already exists (if provided)
        if (email) {
            const [existingEmails] = await db.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            
            if (existingEmails.length > 0) {
                return res.redirect('/signup?error=Email already in use');
            }
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        await db.execute(
            'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
            [username, hashedPassword, email || null]
        );

        res.render("login", { msg: "Account created Successfully!." });
    } catch (error) {
        console.error("Error during signup:", error);
        res.redirect('/signup?error=Error creating account. Please try again.');
    }
});

module.exports = router;