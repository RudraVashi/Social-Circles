const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.post('/save', async (req, res) => {
    const userId = req.session.user && req.session.user.id;
    const score = req.body.score;

    console.log("POST /score/save", { userId, score });
    if (!userId || score === undefined) {
        return res.status(400).json({ success: false, message: "Invalid user or score" });
    }

    try {
        await db.execute(
            'INSERT INTO scores (user_id, score) VALUES (?, ?) ON DUPLICATE KEY UPDATE score = VALUES(score)',
            [userId, score]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Error saving score:', err);
        res.status(500).json({ success: false, message: "Database error" });
    }
});

module.exports = router;