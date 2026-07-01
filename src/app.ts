import cors from "cors";
import express, { type Application, type Request, type Response } from "express";

import { authRoute } from "./modules/auth/auth.route";
import { issueRoute } from "./modules/issue/issue.route";
import globalErrorHandler from "./middleware/globalErrorHandler";

const app: Application = express();

app.use(express.json());

app.use(
   cors({
      origin: "*",
   }),
);

app.get("/", (req: Request, res: Response) => {
   res.status(200).json({
      success: true,
      message: "DevPulse API Running",
   });
});

// Routes
app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);
app.use(globalErrorHandler);

export default app;
