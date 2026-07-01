import type { Request, Response } from "express";
import { issueService } from "./issue.service";
import sendResponse from "../../utility/sendResponse";

const createIssue = async (req: Request, res: Response) => {
   try {
      const reporterId = (req.user as any).id;

      const result = await issueService.createIssueIntoDB(req.body, reporterId);

      sendResponse(res, {
         statusCode: 201,
         success: true,
         message: "Issue created successfully",
         data: result,
      });
   } catch (error: unknown) {
      const err = error as Error;

      res.status(400).json({
         success: false,
         message: err.message,
         error: err.message,
      });
   }
};

const getAllIssues = async (req: Request, res: Response) => {
   try {
      const result = await issueService.getAllIssuesFromDB(req.query);

      res.status(200).json({
         success: true,
         message: "Issues retrieved successfully",
         data: result,
      });
   } catch (error: unknown) {
      const err = error as Error;

      res.status(500).json({
         success: false,
         message: err.message,
         error: err.message,
      });
   }
};

const getSingleIssue = async (req: Request, res: Response) => {
   try {
      const result = await issueService.getSingleIssueFromDB(Number(req.params.id));

      res.status(200).json({
         success: true,
         message: "Issue retrieved successfully",
         data: result,
      });
   } catch (error: unknown) {
      const err = error as Error;

      res.status(404).json({
         success: false,
         message: err.message,
         error: err.message,
      });
   }
};

const updateIssue = async (req: Request, res: Response) => {
   try {
      const result = await issueService.updateIssueIntoDB(
         Number(req.params.id),
         req.body,
         req.user,
      );

      res.status(200).json({
         success: true,
         message: "Issue updated successfully",
         data: result,
      });
   } catch (error: unknown) {
      const err = error as Error;

      res.status(400).json({
         success: false,
         message: err.message,
         error: err.message,
      });
   }
};

const deleteIssue = async (req: Request, res: Response) => {
   try {
      await issueService.deleteIssueFromDB(Number(req.params.id));

      res.status(200).json({
         success: true,
         message: "Issue deleted successfully",
      });
   } catch (error: unknown) {
      const err = error as Error;

      res.status(400).json({
         success: false,
         message: err.message,
         error: err.message,
      });
   }
};

export const issueController = {
   createIssue,
   getAllIssues,
   getSingleIssue,
   updateIssue,
   deleteIssue,
};
