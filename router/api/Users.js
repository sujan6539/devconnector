const express = require("express");
const router = express.Router();

// @route POST api/user
// @desc test route to the user page
// @access public 
router.post("/", (req, res) => {
  console.log(req.body)
  res.send("user route");
});

module.exports = router;
