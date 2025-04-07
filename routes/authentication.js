const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database/db');

const SALT_ROUNDS = 10;

router.get('/login', (req, res) => {
    const error = req.query.error || null;
    res.render('login', { error });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [users] = await db.execute("SELECT * FROM users WHERE username = ?", [username]);

        if (users.length === 0) {
            return res.redirect('/login?error=invalid');
        }

        const user = users[0];

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.redirect('/login?error=invalid');
        }

        req.session.user = {
            id: user.id,
            username: user.username
        };
        
        res.redirect('/accountinfo');
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).send("Error logging in");
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

router.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send("Username and password are required");
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        await db.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            [username, hashedPassword]
        );

        res.send("Account created successfully! You can now log in.");
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).send("Error creating account. Please try again.");
    }
});

module.exports = router;