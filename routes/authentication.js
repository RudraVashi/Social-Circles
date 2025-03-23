const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../database/db');

const router = express.Router();
const SALT_ROUNDS = 10;

router.post('/signup', async (req, res) => {
    const {username, password} = req.body;
    const email = req.body.email || null;
    const biography = req.body.biography || null;
    
    if (!username || !email || !password) {
        return res.status(400).send("Email, username, and password are required");
    }
    
    try{
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        await db.execute(
            'INSERT INTO users (username, email, password, biography) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, biography]
        );

        res.send("Account created successfully! You can now log in.");
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).send("Error creating account. Please try again.");
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [users] = await db.execute("SELECT * FROM users WHERE username = ?", [username]);

        if (users.length === 0) {
            return res.status(400).send("Invalid username or password");
        }

        const user = users[0];

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).send("Invalid username or password");
        }

        res.render('accountinfo', { user });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).send("Error logging in");
    }
});

module.exports = router;