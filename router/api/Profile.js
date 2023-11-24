const express = require("express");
const router = express.Router();
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");
const { default: mongoose } = require("mongoose");
const request = require("request");
const config = require("config");

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
  try {
    // delete the profile
    const profile = await Profile.findOneAndDelete({
      user: req.user.id,
    });
    // delete the user
    const user = await User.findOneAndDelete({ id: req.user.id });
    res.json(profile);
  } catch (err) {
    console.log(err);
    res.status(500).send("server error.");
  }
});

// @route POST api/profile/experience
// @desc  add experience to profile
// @access private
router.post(
  "/experience",
  [
    auth,
    [
      check("title", "title is required").not().isEmpty(),
      check("company", "company is required").not().isEmpty(),
      check("location", "location is required").not().isEmpty(),
      check("from", "from is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    try {
      const error = validationResult(req);
      if (!error.isEmpty) {
        res.status(401).json({ errors: [{ msg: error.array() }] });
      }
      const { title, company, location, from, to } = req.body;

      const experience = {
        title,
        company,
        location,
        from,
        to,
      };

      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(experience);
      await profile.save();

      return res.json(profile);
    } catch (error) {
      console.log(error.message);
      res.status(500).send("server error");
    }
  }
);

// @route    DELETE api/profile/experience/:exp_id
// @desc     Delete experience from profile
// @access   Private

router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const foundProfile = await Profile.findOne({ user: req.user.id });

    foundProfile.experience = foundProfile.experience.filter(
      (exp) => exp._id.toString() !== req.params.exp_id
    );

    await foundProfile.save();
    return res.status(200).json(foundProfile);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error" });
  }
});

// @route    PUT api/profile/education
// @desc     Add profile education
// @access   Private
router.put(
  "/education",
  auth,
  check("school", "School is required").notEmpty(),
  check("degree", "Degree is required").notEmpty(),
  check("fieldofstudy", "Field of study is required").notEmpty(),
  check("from", "From date is required and needs to be from the past")
    .notEmpty()
    .custom((value, { req }) => (req.body.to ? value < req.body.to : true)),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(req.body);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route    DELETE api/profile/education/:edu_id
// @desc     Delete education from profile
// @access   Private

router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    const foundProfile = await Profile.findOne({ user: req.user.id });
    foundProfile.education = foundProfile.education.filter(
      (edu) => edu._id.toString() !== req.params.edu_id
    );
    await foundProfile.save();
    return res.status(200).json(foundProfile);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error" });
  }
});

// @route Get api/profile/github/:username
// @desc get github profile
// @access public
router.get("/github/:username", async (req, res) => {
  try {
    console.log(`https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'githubClientId'
      )}&client_secret=${config.get('githubClientSecret')}`)
    const option = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'githubClientId'
      )}&client_secret=${config.get('githubClientSecret')}`,
      method: "GET",
      header: {
         'X-GitHub-Api-Version': '2022-11-28'
      },
    };

    request(option, (error, response, body) => {
      if (error) {
        return res.status(404).json({ msg: "Error" });
      }
      console.log(response.body);
      if (response.statusCode != 200) {
        return res.status(404).json({ msg: "Error found" });
      }
      return res.json(body);
    });
  } catch (err) {
    console.error(err.message);
    return res.status(404).json({ msg: "No Github profile found" });
  }
});
module.exports = router;
