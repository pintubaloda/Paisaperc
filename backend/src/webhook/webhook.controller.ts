import { Controller, Post, Body, Param, Headers, BadRequestException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { WebhookService } from './webhook.service';
import { ApiConfigService } from '../api-config/api-config.service';

@Controller('webhook')
@SkipThrottle()
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly apiConfigService: ApiConfigService,
  ) {}

  @Post(':apiId/callback')
  async handleCallback(
    @Param('apiId') apiId: string,
    @Headers('x-callback-token') headerToken: string,
    @Body() body: any,
  ) {
    // Validate callback token
    const apiConfig = await this.apiConfigService.findById(apiId);
    const cfg = apiConfig.toObject();
    if (cfg.callbackToken && cfg.callbackToken !== headerToken && cfg.callbackToken !== body.token) {
      throw new BadRequestException('Invalid callback token');
    }

    // Replay protection — reject if timestamp older than 5 minutes
    if (body.timestamp) {
      const webhookTime = new Date(body.timestamp).getTime();
      const now = Date.now();
      if (Math.abs(now - webhookTime) > 5 * 60 * 1000) {
        throw new BadRequestException('Webhook timestamp expired');
      }
    }

    // Extract status from body using configured fields
    const statusField = cfg.successField || 'status';
    const rawStatus = body[statusField];
    let status = 'pending';
    if (String(rawStatus) === String(cfg.successValue || 'Success')) status = 'success';
    else if (String(rawStatus) === String(cfg.failedValue || 'Failed')) status = 'failed';

    const txnId = body.txnId || body.txn_id || body.clientOrderId || body.orderId || '';
    const providerRef = body[cfg.txnIdField || 'txnid'] || body.providerRef || '';
    const message = body[cfg.messageField || 'message'] || '';

    return this.webhookService.processWebhook(apiId, headerToken, {
      txnId, status, providerRef, message,
    });
  }
}
