const express = require("express");
const router = express.Router();
const { validationResult, check } = require("express-validator");
const userModel = require("../../models/User");
const bcrypt = require("bcryptjs");
const gravatar = require("gravatar");
const jwt = require("jsonwebtoken");
const config = require("config");

// @route POST api/user
// @desc register user
// @access public
router.post(
  "/",
  check("name", "name is empty").not().isEmpty(),
  check("email", "invalid email").isEmail(),
  check("password", "invalid password length").isLength({ min: 6 }),
  async (req, res) => {
    const error = validationResult(req);

    if (!error.isEmpty()) {
      return res.status(400).json({ errors: error.array() });
    }
    const { name, email, password } = req.body;
    var user = await userModel.findOne({ email });
    if (user) {
      return res.status(400).json({ errors: [{ msg: "email already exist" }] });
    } else {
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const avatar = gravatar.url(email, {
          s: "200",
          r: "pg",
          d: "mm",
        });
        user = new userModel({
          name: name,
          email: email,
          password: hashedPassword,
          avatar: avatar,
        });
        await user.save();
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
            res.json({ token });
          }
        );
      } catch (err) {
        console.log(err);
        return res.status(500).send("server error");
      }
    }
  }
);

module.exports = router;
