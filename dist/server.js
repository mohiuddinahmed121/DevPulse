

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import cors from "cors";
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  jwt_secret: process.env.JWT_SECRET
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,

        name VARCHAR(100) NOT NULL,

        email VARCHAR(100)
        UNIQUE NOT NULL,

        password TEXT NOT NULL,

        role VARCHAR(20)
        DEFAULT 'contributor',

        created_at TIMESTAMP
        DEFAULT NOW(),

        updated_at TIMESTAMP
        DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues(
        id SERIAL PRIMARY KEY,

        title VARCHAR(150)
        NOT NULL,

        description TEXT
        NOT NULL,

        type VARCHAR(20)
        NOT NULL,

        status VARCHAR(20)
        DEFAULT 'open',

        reporter_id INT
        NOT NULL,

        created_at TIMESTAMP
        DEFAULT NOW(),

        updated_at TIMESTAMP
        DEFAULT NOW()
      )
    `);
    console.log("Database connected");
    console.log("Tables initialiZ");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/auth/auth.service.ts
var createUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const existingUser = await pool.query(
    `
      SELECT * FROM users
      WHERE email = $1
    `,
    [email]
  );
  if (existingUser.rows.length > 0) {
    throw new Error("User already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
      INSERT INTO users
      (name,email,password,role)
      VALUES($1,$2,$3,$4)

      RETURNING
      id,
      name,
      email,
      role,
      created_at,
      updated_at
    `,
    [name, email, hashedPassword, role]
  );
  return result.rows[0];
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `
      SELECT *
      FROM users
      WHERE email = $1
    `,
    [email]
  );
  if (userData.rows.length === 0) {
    throw new Error("Invalid credentials");
  }
  const user = userData.rows[0];
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid credentials");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role
  };
  const token = jwt.sign(jwtPayload, config_default.jwt_secret, {
    expiresIn: "1d"
  });
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  };
};
var authService = {
  createUserIntoDB,
  loginUserIntoDB
};

// src/modules/auth/auth.controller.ts
var signupUser = async (req, res) => {
  try {
    const result = await authService.createUserIntoDB(req.body);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};
var authController = {
  signupUser,
  loginUser
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.signupUser);
router.post("/login", authController.loginUser);
var authRoute = router;

// src/modules/issue/issue.route.ts
import { Router as Router2 } from "express";

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
          errors: "Authentication token is required"
        });
      }
      const decoded = jwt2.verify(token, config_default.jwt_secret);
      req.user = decoded;
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
          errors: "Insufficient permissions"
        });
      }
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid Token",
        errors: "Invalid or expired JWT token"
      });
    }
  };
};
var auth_default = auth;

// src/modules/issue/issue.service.ts
var createIssueIntoDB = async (payload, reporterId) => {
  const { title, description, type } = payload;
  if (title.length > 150) {
    throw new Error("Title must be less than 150 characters");
  }
  if (description.length < 20) {
    throw new Error("Description must be at least 20 characters");
  }
  if (type !== "bug" && type !== "feature_request") {
    throw new Error("Type must be bug or feature_request");
  }
  const result = await pool.query(
    `
      INSERT INTO issues
      (
        title,
        description,
        type,
        reporter_id
      )
      VALUES($1,$2,$3,$4)

      RETURNING *
    `,
    [title, description, type, reporterId]
  );
  return result.rows[0];
};
var getAllIssuesFromDB = async (query) => {
  const { sort, type, status } = query;
  let sql = `SELECT * FROM issues`;
  const conditions = [];
  const values = [];
  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  if (sort === "oldest") {
    sql += ` ORDER BY created_at ASC`;
  } else {
    sql += ` ORDER BY created_at DESC`;
  }
  const issuesResult = await pool.query(sql, values);
  const issues = issuesResult.rows;
  const formattedIssues = await Promise.all(
    issues.map(async (issue) => {
      const reporterResult = await pool.query(
        `
        SELECT id, name, role
        FROM users
        WHERE id = $1
        `,
        [issue.reporter_id]
      );
      return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter: reporterResult.rows[0] || null,
        created_at: issue.created_at,
        updated_at: issue.updated_at
      };
    })
  );
  return formattedIssues;
};
var getSingleIssueFromDB = async (id) => {
  const issueResult = await pool.query(
    `
    SELECT *
    FROM issues
    WHERE id = $1
    `,
    [id]
  );
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const issue = issueResult.rows[0];
  const reporterResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = $1
    `,
    [issue.reporter_id]
  );
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporterResult.rows[0],
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
};
var updateIssueIntoDB = async (issueId, payload, user) => {
  const issueResult = await pool.query(
    `
    SELECT *
    FROM issues
    WHERE id = $1
    `,
    [issueId]
  );
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const issue = issueResult.rows[0];
  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new Error("You can update only your own issues");
    }
    if (issue.status !== "open") {
      throw new Error("Only open issues can be updated");
    }
  }
  let statusValue = null;
  if (user.role === "maintainer") {
    statusValue = payload.status;
  }
  const result = await pool.query(
    `
    UPDATE issues
    SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      type = COALESCE($3, type),
      status = COALESCE($4, status),
      updated_at = NOW()
    WHERE id = $5
    RETURNING *
    `,
    [
      payload.title ?? null,
      payload.description ?? null,
      payload.type ?? null,
      statusValue,
      issueId
    ]
  );
  return result.rows[0];
};
var deleteIssueFromDB = async (issueId) => {
  const issueResult = await pool.query(
    `
    SELECT * FROM issues
    WHERE id=$1
    `,
    [issueId]
  );
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }
  await pool.query(
    `
    DELETE FROM issues
    WHERE id=$1
    `,
    [issueId]
  );
  return;
};
var issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB
};

// src/utility/sendResponse.ts
var sendResponse = (res, payload) => {
  res.status(payload.statusCode).json({
    success: payload.success,
    message: payload.message,
    data: payload.data,
    errors: payload.errors
  });
};
var sendResponse_default = sendResponse;

// src/modules/issue/issue.controller.ts
var createIssue = async (req, res) => {
  try {
    const reporterId = req.user.id;
    const result = await issueService.createIssueIntoDB(req.body, reporterId);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error) {
    const err = error;
    res.status(400).json({
      success: false,
      message: err.message,
      error: err.message
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const result = await issueService.getAllIssuesFromDB(req.query);
    res.status(200).json({
      success: true,
      message: "Issues retrieved successfully",
      data: result
    });
  } catch (error) {
    const err = error;
    res.status(500).json({
      success: false,
      message: err.message,
      error: err.message
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const result = await issueService.getSingleIssueFromDB(Number(req.params.id));
    res.status(200).json({
      success: true,
      message: "Issue retrieved successfully",
      data: result
    });
  } catch (error) {
    const err = error;
    res.status(404).json({
      success: false,
      message: err.message,
      error: err.message
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const result = await issueService.updateIssueIntoDB(
      Number(req.params.id),
      req.body,
      req.user
    );
    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    const err = error;
    res.status(400).json({
      success: false,
      message: err.message,
      error: err.message
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    await issueService.deleteIssueFromDB(Number(req.params.id));
    res.status(200).json({
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    const err = error;
    res.status(400).json({
      success: false,
      message: err.message,
      error: err.message
    });
  }
};
var issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/modules/issue/issue.route.ts
var router2 = Router2();
router2.post("/", auth_default("contributor", "maintainer"), issueController.createIssue);
router2.get("/", issueController.getAllIssues);
router2.get("/:id", issueController.getSingleIssue);
router2.patch("/:id", auth_default("contributor", "maintainer"), issueController.updateIssue);
router2.delete("/:id", auth_default("maintainer"), issueController.deleteIssue);
var issueRoute = router2;

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.message
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
var app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*"
  })
);
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DevPulse API Running"
  });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = async () => {
  try {
    await initDB();
    app_default.listen(config_default.port, () => {
      console.log(`Server running on port ${config_default.port}`);
    });
  } catch (error) {
    console.log(error);
  }
};
main();
//# sourceMappingURL=server.js.map