const express = require("express");
const router = express.Router();
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");
const { default: mongoose } = require("mongoose");

// @route GET api/profile/me
// @dec  Request to get own profile
// @access private
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(400).json({ error: "profile not found" });
    }

    res.json(profile);
  } catch (err) {
    console.log(err.message);
    return res.status(500).send("server error");
  }
});

// @route POST api/profile
// @desc create/update profile
// @access private
router.post(
  "/",
  [
    auth,
    check("status", "missing status").exists(),
    check("skills", "missing skills").exists(),
  ],
  async (req, res) => {
    const error = validationResult(req);

    if (!error.isEmpty()) {
      return res.status(400).json({ errors: [{ msg: error.array() }] });
    }
    try {
      // destructure the request
      const {
        website,
        skills,
        youtube,
        twitter,
        instagram,
        linkedin,
        facebook,
        // spread the rest of the fields we don't need to check
        ...rest
      } = req.body;

      const profileFields = {
        user: req.user.id,
        skills: skills.split(",").map((item) => item.trim()),
        ...rest,
      };

      console.log(req.user.id);
      let profile = await Profile.findOne({
        user: req.user.id,
      });

      if (profile) {
        // if profile exists, update
        console.log("profile found");
        profile = await Profile.findByIdAndUpdate(
          profile.id,
          { $set: profileFields },
          { new: true }
        );
        return res.json({ profile });
      } else {
        console.log("profile not found.. Creating a new one");
        //create a new profile
        profile = new Profile(profileFields);
        await profile.save();
        return res.json({ profile });
      }
    } catch (err) {
      console.log(err.message);
      return res.status(500).send("server error");
    }
  }
);

// @route   GET api/profiles
// @desc Get all profiles
// @access public

router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json({ profiles });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("server error");
  }
});

// @route GET api/profile/user/:userId
// @desc get profile by id
// @access private
router.get("/user/:userId", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.userId,
    }).populate("user", ["name", "avatar"]);
    if (!profile) {
      return res.status(400).json({ msg: "Profile not found." });
    }
    res.json({ profile });
  } catch (error) {
    console.log(error.message);
    if (error.type == "ObjectId") {
      return res.status(400).json({ msg: "Profile not found." });
    }
    return res.status(500).send("server error");
  }
});

// @route DELETE api/profile
// @desc delete profile and user
// @access private
router.delete("/", auth, async (req, res) => {
    try{
    // delete the profile
    const profile = await Profile.findOneAndDelete({
        user : req.user.id
    })
    // delete the user
    const user = await User.findOneAndDelete(
        { id : req.user.id}
    )
    res.json(profile)
    }catch(err){
        console.log(err)
        res.status(500).send('server error.')
    }

    
});

module.exports = router;
