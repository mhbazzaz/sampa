export const responseGenerator = (response: {
  message: string;
  data?: any;
  statusCode?: number;
}) => {
  return {
    message: response.message,
    data: response.data,
    statusCode: response.statusCode || 200,
  };
};
