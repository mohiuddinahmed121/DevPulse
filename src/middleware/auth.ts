import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import config from "../config";
import type { NextFunction, Request, Response } from "express";

const auth = (...roles: string[]) => {
   return (req: Request, res: Response, next: NextFunction) => {
      try {
         const token = req.headers.authorization;

         if (!token) {
            return res.status(401).json({
               success: false,
               message: "Unauthorized",
            });
         }

         const decoded = jwt.verify(token, config.jwt_secret) as JwtPayload;

         req.user = decoded;

         if (roles.length && !roles.includes(decoded.role)) {
            return res.status(403).json({
               success: false,
               message: "Forbidden",
            });
         }

         next();
      } catch (error) {
         return res.status(401).json({
            success: false,
            message: "Invalid Token",
         });
      }
   };
};

export default auth;
