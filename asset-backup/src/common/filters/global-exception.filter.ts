import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  I18nValidationException,
  I18nValidationExceptionFilter,
} from 'nestjs-i18n';
import * as requestIp from 'request-ip';
import { LoggerService } from 'src/logger/logger.service';
import { Vault } from 'src/vault/vault';
import { UAParser } from 'ua-parser-js';

@Injectable()
@Catch(HttpException)
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly i18nFilter: I18nValidationExceptionFilter;
  private logMode: string | null = null;

  constructor(private readonly loggerService: LoggerService) {
    this.i18nFilter = new I18nValidationExceptionFilter({
      detailedErrors: false,
    });
  }

  async onModuleInit() {
    const log_mode = await Vault.instance.get('LOG_MODE', 'share');
    if (log_mode) {
      this.logMode = log_mode.toLowerCase();
    }
  }

  private async ensureVaultDataLoaded(): Promise<string | null> {
    if (!this.logMode) {
      const log_mode = await Vault.instance.get('LOG_MODE', 'share');
      console.log('Vault returned log_mode: ', log_mode);
      if (log_mode) {
        this.logMode = log_mode.toLowerCase();
        console.log('logMode set to: ', this.logMode);
      }
    }
    return this.logMode;
  }

  async catch(exception: HttpException, host: ArgumentsHost) {
    await this.ensureVaultDataLoaded();

    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const resRaw = exception.getResponse();
    const resBody: { message?: string; error?: any } =
      typeof resRaw === 'string' ? { message: resRaw } : (resRaw as any);

    const ps = new UAParser(req.headers['user-agent']);
    const parsedUA = ps.getResult();
    const clientIp = requestIp.getClientIp(req as any);
    const stack = (exception as any)?.cause?.stack || exception.stack;

    const responseBody = this.logMode === 'debug' ? resBody : {};

    const baseMetadata = {
      timestamp: new Date().toISOString(),
      app_id: process.env.APP_ID || 'asset-management',
      event_category: 'user-action',
      event_type: `${req.method} ${req.url}`,
      description: `${req.method} ${req.url}`,
      user_agent: parsedUA.ua,
      device: parsedUA.device,
      browser: parsedUA.browser,
      os: parsedUA.os,
      source_ip: clientIp,
      username: req.headers['x-username'],
      host: req.hostname,
      origin: req.headers['origin'],
      http_host: req.headers['host'],
      request_url: req.url,
      request_method: req.method,
      content_length_request: req.headers['content-length'] || 0,
      content_type: req.headers['content-type'],
      correlationID: req.headers['x-correlation-id'],
      request_body: req.body,
      referer: req.headers['referer'],
      stack_trace: stack,
    };

    const metadata = {
      ...baseMetadata,
      duration: 0,
      status_code: status,
      result: responseBody,
      reason: exception.message,
      content_length_response: JSON.stringify(resBody)?.length || 0,
    };

    let level: 'info' | 'warn' | 'error' = 'info';
    if (status >= 500) level = 'error';
    else if (status >= 400) level = 'warn';

    await this.loggerService.sendLog(metadata, level);

    if (exception instanceof I18nValidationException) {
      return this.i18nFilter.catch(exception, host);
    }

    res.status(status).json({
      message: resBody.message || 'Something went wrong.',
      error: resBody.error,
      statusCode: status,
    });
  }
}
