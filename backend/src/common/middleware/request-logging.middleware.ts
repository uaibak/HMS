import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on('finish', () => {
      const elapsed = Date.now() - start;
      this.logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${elapsed}ms`);
    });
    next();
  }
}
