import type { NextFunction, Request, Response } from "express";

const globalErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
   res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
      errors: err.message,
   });
};

export default globalErrorHandler;
