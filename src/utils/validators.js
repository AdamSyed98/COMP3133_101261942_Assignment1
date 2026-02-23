const { body, validationResult } = require("express-validator");

async function runValidators(validators, data) {
  const req = { body: data };
  for (const v of validators) {
    await v.run(req);
  }
  return validationResult(req);
}

const signupValidators = [
  body("username").isLength({ min: 3 }).withMessage("username must be at least 3 characters"),
  body("email").isEmail().withMessage("invalid email"),
  body("password").isLength({ min: 6 }).withMessage("password must be at least 6 characters"),
];

const loginValidators = [
  body("usernameOrEmail").notEmpty().withMessage("usernameOrEmail is required"),
  body("password").notEmpty().withMessage("password is required"),
];

const employeeValidators = [
  body("first_name").notEmpty().withMessage("first_name is required"),
  body("last_name").notEmpty().withMessage("last_name is required"),
  body("email").isEmail().withMessage("invalid email"),
  body("gender").isIn(["Male", "Female", "Other"]).withMessage("gender must be Male/Female/Other"),
  body("designation").notEmpty().withMessage("designation is required"),
  body("salary").isFloat({ min: 1000 }).withMessage("salary must be >= 1000"),
  body("date_of_joining").notEmpty().withMessage("date_of_joining is required (YYYY-MM-DD)"),
  body("department").notEmpty().withMessage("department is required"),
];

function toFieldErrors(vr) {
  return vr.array().map((e) => ({ field: e.path, message: e.msg }));
}

module.exports = {
  runValidators,
  signupValidators,
  loginValidators,
  employeeValidators,
  toFieldErrors,
};