const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.post('/', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [users] = await db.execute("SELECT * FROM users WHERE username = ?", [username]);

        if (users.length === 0) {
            return res.redirect('/login?error=invalid');
        }

        const user = users[0];

        const bcrypt = require('bcrypt');
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.redirect('/login?error=invalid');
        }

        res.render('accountinfo', { user });
    } catch (error) {
        console.error("Account Info Error:", error);
        res.status(500).send("Error retrieving account information");
    }
});

router.get('/', (req, res) => {
    res.redirect('/login');
});

module.exports = router;