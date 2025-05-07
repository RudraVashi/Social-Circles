const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Add logging middleware for this router
router.use((req, res, next) => {
    console.log('Scores router hit:', req.method, req.path);
    console.log('Session user:', req.session.user);
    next();
});

router.post('/save', async (req, res) => {
    console.log('POST /score/save endpoint hit');
    console.log('Request body:', req.body);
    
    const userId = req.session.user && req.session.user.id;
    const currentScore = Math.max(Number(req.body.score), 0);
    const sessionHighScore = req.body.sessionHighScore || currentScore; // Fallback in case not provided

    console.log("Processing score save:", { userId, currentScore, sessionHighScore });
    
    if (!userId || currentScore === undefined) {
        console.log("Invalid user or score data - rejecting request");
        return res.status(400).json({ success: false, message: "Invalid user or score data" });
    }

    try {
        const [existingScores] = await db.execute(
            'SELECT * FROM scores WHERE user_id = ?',
            [userId]
        );
        
        if (existingScores.length > 0) {
            await db.execute(
                'UPDATE scores SET score = ? WHERE user_id = ?',
                [currentScore, userId]
            );
        } else {
            await db.execute(
                'INSERT INTO scores (user_id, score) VALUES (?, ?)',
                [userId, currentScore]
            );
        }
        
        // 2. Check if we need to update high score
        const [userRecord] = await db.execute(
            'SELECT high_score FROM users WHERE id = ?',
            [userId]
        );
        
        // Get current high score from database (or 0 if not set)
        const currentHighScore = (userRecord.length > 0 && userRecord[0].high_score !== null) 
            ? userRecord[0].high_score 
            : 0;
        
        console.log(`Comparing session high ${sessionHighScore} with db high ${currentHighScore}`);
        
        // Update high score if session high is greater than stored high
        if (sessionHighScore > currentHighScore) {
            console.log(`Updating high score from ${currentHighScore} to ${sessionHighScore}`);
            await db.execute(
                'UPDATE users SET high_score = ? WHERE id = ?',
                [sessionHighScore, userId]
            );
        }
        
        return res.json({ 
            success: true,
            message: "Scores updated successfully"
        });
    } catch (err) {
        console.error('Database error when saving score:', err);
        return res.status(500).json({ success: false, message: "Database error: " + err.message });
    }
});

router.get('/current', async (req, res) => {
    const userId = req.session.user && req.session.user.id;
    
    if (!userId) {
        return res.status(400).json({ success: false, message: "User not logged in" });
    }
    
    try {
        // Get high score from users table
        const [userResult] = await db.execute(
            'SELECT high_score FROM users WHERE id = ?',
            [userId]
        );
        
        // Get current score from scores table
        const [scoreResult] = await db.execute(
            'SELECT score FROM scores WHERE user_id = ?',
            [userId]
        );
        
        const highScore = (userResult.length > 0 && userResult[0].high_score !== null) 
            ? userResult[0].high_score 
            : 0;
            
        const currentScore = (scoreResult.length > 0 && scoreResult[0].score !== null) 
            ? scoreResult[0].score 
            : 0;
        
        console.log(`Returning scores for user ${userId}: current=${currentScore}, high=${highScore}`);
        
        return res.json({ 
            success: true,
            highScore: highScore,
            currentScore: currentScore
        });
    } catch (err) {
        console.error('Error fetching scores:', err);
        return res.status(500).json({ success: false, message: "Database error" });
    }
});

// Add a test endpoint
router.get('/test', (req, res) => {
    console.log('Test endpoint hit');
    res.json({ message: 'Score router is working' });
});

module.exports = router;