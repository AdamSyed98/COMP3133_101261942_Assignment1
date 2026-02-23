const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Employee = require("../models/Employee");
const { runValidators, signupValidators, loginValidators, employeeValidators, toFieldErrors } = require("../utils/validators");
const { cloudinary } = require("../config/cloudinary");
// const { requireAuth } = require("../middleware/auth");

async function uploadToCloudinary(upload) {
  if (!upload) return null;

  const { createReadStream } = await upload;
  const stream = createReadStream();

  return new Promise((resolve, reject) => {
    const cldStream = cloudinary.uploader.upload_stream(
      { folder: "comp3133_employees", resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url });
      }
    );

    stream.on("error", reject);
    stream.pipe(cldStream);
  });
}

const resolvers = {
  Query: {
    login: async (_, { input }) => {
      const vr = await runValidators(loginValidators, input);
      if (!vr.isEmpty()) {
        return { success: false, message: "Validation failed", token: null, user: null, errors: toFieldErrors(vr) };
      }

      const { usernameOrEmail, password } = input;

      const user = await User.findOne({
        $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      });

      if (!user) return { success: false, message: "Invalid credentials", token: null, user: null };

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return { success: false, message: "Invalid credentials", token: null, user: null };

      const token = jwt.sign(
        { userId: user._id, username: user.username, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      return { success: true, message: "Login successful", token, user };
    },

    getAllEmployees: async (_, __, context) => {
      // requireAuth(context);
      const employees = await Employee.find().sort({ created_at: -1 });
      return { success: true, message: "Employees fetched", employees };
    },

    searchEmployeeByEid: async (_, { eid }, context) => {
      // requireAuth(context);
      const employee = await Employee.findById(eid);
      if (!employee) return { success: false, message: "Employee not found", employee: null };
      return { success: true, message: "Employee fetched", employee };
    },

    searchEmployeesByDesignationOrDepartment: async (_, { designation, department }, context) => {
      // requireAuth(context);
      if (!designation && !department) {
        return { success: false, message: "Provide designation or department", employees: [] };
      }

      const filter = {};
      if (designation) filter.designation = designation;
      if (department) filter.department = department;

      const employees = await Employee.find(filter).sort({ created_at: -1 });
      return { success: true, message: "Employees filtered", employees };
    },
  },

  Mutation: {
    signup: async (_, { input }) => {
      const vr = await runValidators(signupValidators, input);
      if (!vr.isEmpty()) {
        return { success: false, message: "Validation failed", token: null, user: null, errors: toFieldErrors(vr) };
      }

      const { username, email, password } = input;

      const existing = await User.findOne({ $or: [{ username }, { email }] });
      if (existing) {
        return { success: false, message: "Username or email already exists", token: null, user: null };
      }

      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ username, email, password: hashed });

      const token = jwt.sign(
        { userId: user._id, username: user.username, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      return { success: true, message: "Signup successful", token, user };
    },

    addEmployee: async (_, { input, photo }, context) => {
      // requireAuth(context);

      const vr = await runValidators(employeeValidators, input);
      if (!vr.isEmpty()) {
        return { success: false, message: "Validation failed", employee: null, errors: toFieldErrors(vr) };
      }

      const existing = await Employee.findOne({ email: input.email });
      if (existing) return { success: false, message: "Employee email already exists", employee: null };

      let photoUrl = null;
      if (photo) {
        try {
          const uploaded = await uploadToCloudinary(photo);
          photoUrl = uploaded.url;
        } catch {
          return { success: false, message: "Photo upload failed", employee: null };
        }
      }

      const employee = await Employee.create({
        ...input,
        date_of_joining: new Date(input.date_of_joining),
        employee_photo: photoUrl,
      });

      return { success: true, message: "Employee created", employee };
    },

    updateEmployeeByEid: async (_, { eid, input, photo }, context) => {
      // requireAuth(context);

      const employee = await Employee.findById(eid);
      if (!employee) return { success: false, message: "Employee not found", employee: null };

      if (input.email && input.email !== employee.email) {
        const emailTaken = await Employee.findOne({ email: input.email });
        if (emailTaken) return { success: false, message: "Email already in use", employee: null };
      }

      if (typeof input.salary === "number" && input.salary < 1000) {
        return { success: false, message: "salary must be >= 1000", employee: null };
      }

      if (input.gender && !["Male", "Female", "Other"].includes(input.gender)) {
        return { success: false, message: "gender must be Male/Female/Other", employee: null };
      }

      let photoUrl = employee.employee_photo;
      if (photo) {
        try {
          const uploaded = await uploadToCloudinary(photo);
          photoUrl = uploaded.url;
        } catch {
          return { success: false, message: "Photo upload failed", employee: null };
        }
      }

      const updated = await Employee.findByIdAndUpdate(
        eid,
        {
          ...input,
          ...(input.date_of_joining ? { date_of_joining: new Date(input.date_of_joining) } : {}),
          employee_photo: photoUrl,
        },
        { new: true }
      );

      return { success: true, message: "Employee updated", employee: updated };
    },

    deleteEmployeeByEid: async (_, { eid }, context) => {
      // requireAuth(context);

      const employee = await Employee.findById(eid);
      if (!employee) return { success: false, message: "Employee not found" };

      await Employee.deleteOne({ _id: eid });
      return { success: true, message: "Employee deleted" };
    },
  },
};

module.exports = { resolvers };