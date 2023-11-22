const express = require("express");
const router = express.Router();

// @route GET api/profile
// @dec router to get the profile
// @access public
router.get("/", (req, res) => res.send("profile router"));

module.exports = router;
