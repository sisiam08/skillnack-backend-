declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
        emailVerified: boolean;
      };
    }
  }
}

export type {
  IErrorSource,
  IErrorResponse,
  IGenericErrorResponse,
  AppErrorType,
} from "./error.type";

export type { IRoute } from "./route.type";

export type { PaginationOptions } from "./pagination.type";

export type { SortingOptions } from "./sort.type";
