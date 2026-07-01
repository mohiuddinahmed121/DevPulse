import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { pool } from "../../db";
import config from "../../config";

const createUserIntoDB = async (payload: {
   name: string;
   email: string;
   password: string;
   role: string;
}) => {
   const { name, email, password, role } = payload;

   const existingUser = await pool.query(
      `
      SELECT * FROM users
      WHERE email = $1
    `,
      [email],
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
      [name, email, hashedPassword, role],
   );

   return result.rows[0];
};

const loginUserIntoDB = async (payload: { email: string; password: string }) => {
   const { email, password } = payload;

   const userData = await pool.query(
      `
      SELECT *
      FROM users
      WHERE email = $1
    `,
      [email],
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
      role: user.role,
   };

   const token = jwt.sign(jwtPayload, config.jwt_secret, {
      expiresIn: "1d",
   });

   return {
      token,
      user: {
         id: user.id,
         name: user.name,
         email: user.email,
         role: user.role,
         created_at: user.created_at,
         updated_at: user.updated_at,
      },
   };
};

export const authService = {
   createUserIntoDB,
   loginUserIntoDB,
};
