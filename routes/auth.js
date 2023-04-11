const router = require("express").Router();
const User = require("../models/userModel");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");

router.post("/register", async (req, res) => {
  const userData = new User({
    username: req.body.username,
    email: req.body.email,
    password: CryptoJS.AES.encrypt(
      req.body.password,
      process.env.PASS_SEC
    ).toString(),
  });
  try {
    const savedUser = await userData.save();
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post("/login", async (req, res) => {
  try {
    const userDetail = await User.findOne({ username: req.body.username });
    if (!userDetail) {
      return res.status(401).json("No user found");
    }
    const hashedPassword = CryptoJS.AES.decrypt(
      userDetail.password,
      process.env.PASS_SEC
    );
    const originalPassword = hashedPassword.toString(CryptoJS.enc.Utf8);
    if (originalPassword !== req.body.password) {
      return res.status(401).json("Wrong credentials");
    }

    const accessToken = jwt.sign(
      {
        id: userDetail._id,
        isAdmin: userDetail.isAdmin,
      },
      process.env.JWT_SEC,
      { expiresIn: "10d" }
    );

    const { password, ...rest } = userDetail._doc;
    return res.status(200).json({ ...rest, accessToken });
  } catch (error) {
    return res.status(500).json(error);
  }
});

module.exports = router;
