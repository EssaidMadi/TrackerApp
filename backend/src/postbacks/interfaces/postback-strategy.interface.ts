import { Click, Conversion, PostbackConfig } from '@prisma/client';

export interface PostbackResult {
  success: boolean;
  method: string;
  url: string;
  requestBody?: string;
  httpStatus?: number;
  response?: string;
}

export interface PostbackStrategy {
  getNetwork(): string;
  canHandle(config: PostbackConfig): boolean;
  send(
    click: Click,
    conversion: Conversion,
    config: PostbackConfig,
  ): Promise<PostbackResult>;
}
