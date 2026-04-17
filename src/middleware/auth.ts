import { NextFunction, Request, Response } from "express";
import { UserRole } from "../../generated/prisma/enums";
import { auth } from "../lib/auth";
import { Status } from "../errors/httpStatus";

export const auth_middleware = (role: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await auth.api.getSession({
        headers: req.headers as any,
      });

      if (!session || !session.user) {
        res.status(Status.UNAUTHORIZED).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      if (!session.user.emailVerified) {
        res.status(Status.FORBIDDEN).json({
          success: false,
          message: "You need to verify your email to access this resource",
        });
        return;
      }

      if (role.length && !role.includes(session.user.role as UserRole)) {
        res.status(Status.FORBIDDEN).json({
          success: false,
          message: "You don't have permission to access this resource",
        });
        return;
      }

      req.user = {
        id: session.user.id as string,
        name: session.user.name as string,
        email: session.user.email as string,
        role: session.user.role as UserRole,
        emailVerified: session.user.emailVerified as boolean,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
