const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const config = require('config')

// @route api/auth
// @desc auth router
// @access public
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.log(err.message);
    res.status(401).send("server error");
  }
});

// Log in
// @route api/auth
// @desc log in 
// @access public
router.post(
  "/",
  check("email", "Invalid Credentials").isEmail(),
  check("password", "Invalid Credential").exists(),
  async (req, res) => {
    const error = validationResult(req);
    // Checks if there are no error in the request
    if (!error.isEmpty()) {
      return res.status(401).json({ error: error.array()});
    }
    try {
      // check if credential matches
      const { email, password } = req.body;
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: [{ msg: "invalid Credential" }] });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: [{ msg: "invalid Credential" }] });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 36000 },
        (err, token) => {
          if (err) throw err;
          res.send({ token });
        }
      );
    } catch (err) {
      console.log(err.message);
      res.status(500).send("server error.");
    }
  }
);

module.exports = router;
