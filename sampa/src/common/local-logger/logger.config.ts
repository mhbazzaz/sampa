import { Request, Response } from 'express';
import * as moment from 'moment-timezone';
import * as requestIp from 'request-ip';
import { UAParser } from 'ua-parser-js';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

export const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

export const logRequest = (req: Request, res: Response) => {
  const headers: any = req.headers;
  const ps = new UAParser(headers['user-agent']);
  const parsedUA = ps.getResult();
  const clientIp = requestIp.getClientIp(req as any);
  const localTime = moment
    .tz(new Date(), 'Asia/Tehran')
    .format('YYYY-MM-DD HH:mm:ss');
  const oldSend = res.send;

  let responseBody: any;

  res.send = function (body: any) {
    responseBody = body;
    res.send = oldSend;
    return res.send(body);
  };

  res.on('finish', () => {
    const logEntry = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      time: localTime,
      ua: parsedUA.ua,
      ip: clientIp,
      browserName: parsedUA.browser.name,
      browserVersion: parsedUA.browser.version,
      osName: parsedUA.os.name,
      osVersion: parsedUA.os.version,
      requestBody: req.body || null,
      responseBody: responseBody || 'No response data',
    };

    winstonLogger.info(logEntry);
  });
};
