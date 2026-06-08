import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception.code === 'P2002') {
      const target = exception.meta?.target;
      const fields = Array.isArray(target)
        ? target.join(', ')
        : typeof target === 'string'
          ? target
          : 'field';
      const body = new ConflictException(
        `A record with this ${fields} already exists`,
      ).getResponse();
      response.status(HttpStatus.CONFLICT).json(body);
      return;
    }

    if (exception.code === 'P2025') {
      const body = new NotFoundException('Record not found').getResponse();
      response.status(HttpStatus.NOT_FOUND).json(body);
      return;
    }

    if (exception.code === 'P2021' || exception.code === 'P2022') {
      const body = new InternalServerErrorException(
        'Database schema is out of date. Run: npx prisma migrate deploy',
      ).getResponse();
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
      return;
    }

    const body = new InternalServerErrorException(
      `Database error (${exception.code})`,
    ).getResponse();
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}
