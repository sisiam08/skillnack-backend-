import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { handleZodError } from "../errors/zodError";

/**
 * Middleware to validate request data (body, params, query) against Zod schemas
 * Automatically handles Zod validation errors and passes them to global error handler
 */
export const validateRequest =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedError = handleZodError(error);
        return res.status(formattedError.statusCode).json({
          success: false,
          message: formattedError.message,
          errorSource: formattedError.errorSource,
        });
      }
      next(error);
    }
  };
