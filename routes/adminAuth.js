const express = require("express");
const { login } = require("../controllers/adminAuthController");

module.exports = function (prisma) {
  const router = express.Router();

  router.post("/login", (req, res) => login(req, res, prisma));

  return router;
};