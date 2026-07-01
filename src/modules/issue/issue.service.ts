import { pool } from "../../db";

const createIssueIntoDB = async (
   payload: {
      title: string;
      description: string;
      type: string;
   },
   reporterId: number,
) => {
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
      [title, description, type, reporterId],
   );

   return result.rows[0];
};

const getAllIssuesFromDB = async (query: { sort?: string; type?: string; status?: string }) => {
   const { sort, type, status } = query;

   let sql = `SELECT * FROM issues`;
   const conditions: string[] = [];
   const values: any[] = [];

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
            [issue.reporter_id],
         );

         return {
            id: issue.id,
            title: issue.title,
            description: issue.description,
            type: issue.type,
            status: issue.status,
            reporter: reporterResult.rows[0] || null,
            created_at: issue.created_at,
            updated_at: issue.updated_at,
         };
      }),
   );

   return formattedIssues;
};

const getSingleIssueFromDB = async (id: number) => {
   const issueResult = await pool.query(
      `
    SELECT *
    FROM issues
    WHERE id = $1
    `,
      [id],
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
      [issue.reporter_id],
   );

   return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: reporterResult.rows[0],
      created_at: issue.created_at,
      updated_at: issue.updated_at,
   };
};

const updateIssueIntoDB = async (issueId: number, payload: any, user: any) => {
   const issueResult = await pool.query(
      `
    SELECT *
    FROM issues
    WHERE id = $1
    `,
      [issueId],
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
         issueId,
      ],
   );

   return result.rows[0];
};

const deleteIssueFromDB = async (issueId: number) => {
   const issueResult = await pool.query(
      `
    SELECT * FROM issues
    WHERE id=$1
    `,
      [issueId],
   );

   if (issueResult.rows.length === 0) {
      throw new Error("Issue not found");
   }

   await pool.query(
      `
    DELETE FROM issues
    WHERE id=$1
    `,
      [issueId],
   );

   return;
};

export const issueService = {
   createIssueIntoDB,
   getAllIssuesFromDB,
   getSingleIssueFromDB,
   updateIssueIntoDB,
   deleteIssueFromDB,
};
