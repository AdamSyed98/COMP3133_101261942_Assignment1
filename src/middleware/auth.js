const jwt = require("jsonwebtoken");

function getUserFromToken(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAuth(context) {
  if (!context.user) {
    const err = new Error("Unauthorized: missing/invalid token");
    err.code = "UNAUTHORIZED";
    throw err;
  }
}

module.exports = { getUserFromToken, requireAuth };