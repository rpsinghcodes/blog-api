const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');



//protected routes 

router.get('/all-blogs', verifyToken, (req,res) => {
    res.send({message:"Protected routes accessed."})
})




module.exports = router ;