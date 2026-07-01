import type { Request, Response } from "express";
import { issueService } from "./issue.service";

const createIssue = async (req: Request, res: Response) => {
   try {
      const reporterId = (req.user as any).id;

      const result = await issueService.createIssueIntoDB(req.body, reporterId);

      res.status(201).json({
         success: true,
         message: "Issue created successfully",
         data: result,
      });
   } catch (error: any) {
      res.status(400).json({
         success: false,
         message: error.message,
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
   } catch (error: any) {
      res.status(500).json({
         success: false,
         message: error.message,
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
   } catch (error: any) {
      res.status(404).json({
         success: false,
         message: error.message,
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
   } catch (error: any) {
      res.status(400).json({
         success: false,
         message: error.message,
      });
   }
};

const deleteIssue = async (req: Request, res: Response) => {};

export const issueController = {
   createIssue,
   getAllIssues,
   getSingleIssue,
   updateIssue,
   deleteIssue,
};
