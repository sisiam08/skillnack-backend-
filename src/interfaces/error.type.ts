export interface IErrorSource {
  path: string;
  message: string;
}

export interface IErrorResponse {
  success: false;
  message: string;
  errorSource: IErrorSource[];
  error?: unknown;
  stack?: string;
}

export interface IGenericErrorResponse {
  success: false;
  message: string;
  error?: unknown;
  stack?: string;
}

export interface AppErrorType extends Error {
  statusCode: number;
  isOperational: boolean;
}