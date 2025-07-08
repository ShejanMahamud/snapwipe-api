import { Controller, Get, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request } from 'express';
import { platform } from 'os';
@ApiExcludeController()
@Controller()
export class AppController {
  @Get()
  root(@Req() req: Request) {
    const protocol = req.protocol;
    const host = req.get('host');
    const apiDocsUrl = `${protocol}://${host}/api-docs`;
    return {
      service: 'SnapWipe API',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      api_docs: apiDocsUrl,
      os: {
        platform: platform(),
      },
      message: 'Welcome to the SnapWipe API',
    };
  }
}
