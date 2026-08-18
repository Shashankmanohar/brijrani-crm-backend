import { Response } from 'express';

export const sendSuccess = (
  res: Response,
  message: string,
  data: any = {},
  statusCode: number = 200
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};
