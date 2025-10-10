export const buildSuccessResponse = (data: any) => {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      data,
    };
  };
  
  export const buildErrorResponse = (message: string, statusCode: number, error?: string) => {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      statusCode,
      message,
      ...(error && { error }),
    };
  };
  