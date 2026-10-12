import { createHash, sign, verify } from 'node:crypto';

import {
  PaymentEventType,
  PaymentStatus,
  PaymentType,
  WebhookIgnoredError,
  type CheckoutSession,
  type PaymentEvent,
  type PaymentOrder,
  type PaymentProvider,
  type PaymentSession,
} from './types';

function pemKey(value: string, type: 'PRIVATE' | 'PUBLIC'): string {
  const normalized = value.trim().replace(/\\n/g, '\n');
  if (normalized.includes('-----BEGIN')) return normalized;
  const base64 = normalized.replace(/\s/g, '');
  return `-----BEGIN ${type} KEY-----\n${base64.match(/.{1,64}/g)?.join('\n')}\n-----END ${type} KEY-----`;
}

export interface WaffoConfigs {
  merchantId: string;
  privateKey: string;
  webhookPublicKey: string;
  storeId: string;
  productMapping: string;
}

// https://docs.waffo.ai/api-reference/endpoints/orders/create-checkout-session
export class WaffoProvider implements PaymentProvider {
  readonly name = 'waffo';
  constructor(public configs: WaffoConfigs) {}

  async createPayment({
    order,
  }: {
    order: PaymentOrder;
  }): Promise<CheckoutSession> {
    if (order.type !== PaymentType.ONE_TIME)
      throw new Error('Waffo currently supports credit packs only');
    const mapping = JSON.parse(this.configs.productMapping || '{}') as Record<
      string,
      string
    >;
    const productId = mapping[order.productId || ''];
    if (!productId?.startsWith('PROD_'))
      throw new Error('Configure the Waffo product ID for this credit pack');
    if (!order.successUrl?.startsWith('https://'))
      throw new Error('Waffo requires an HTTPS application URL');
    const path = '/v1/actions/checkout/create-session';
    const payload = {
      productId,
      currency: order.price?.currency.toUpperCase(),
      buyerEmail: order.customer?.email,
      successUrl: order.successUrl,
      orderMerchantExternalId: order.orderNo,
      metadata: { orderNo: order.orderNo },
      expiresInSeconds: 1800,
    };
    const body = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const hash = createHash('sha256').update(body).digest('base64');
    const signature = sign(
      'RSA-SHA256',
      Buffer.from(`POST\n${path}\n${timestamp}\n${hash}`),
      pemKey(this.configs.privateKey, 'PRIVATE')
    ).toString('base64');
    const response = await fetch(`https://api.waffo.ai${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Merchant-Id': this.configs.merchantId,
        'X-Timestamp': timestamp,
        'X-Signature': signature,
      },
      body,
    });
    const result = await response.json();
    if (!response.ok || !result.data?.sessionId || !result.data?.checkoutUrl) {
      throw new Error(
        'Waffo checkout failed; check production credentials and published products'
      );
    }
    return {
      provider: this.name,
      checkoutParams: payload,
      checkoutInfo: {
        sessionId: result.data.sessionId,
        checkoutUrl: result.data.checkoutUrl,
      },
      checkoutResult: result.data,
      metadata: payload.metadata,
    };
  }

  async getPaymentSession(): Promise<PaymentSession> {
    // Fulfillment uses the signed webhook; a browser redirect cannot prove payment.
    return { provider: this.name, paymentStatus: PaymentStatus.PROCESSING };
  }

  async getPaymentEvent({ req }: { req: Request }): Promise<PaymentEvent> {
    const body = await req.text();
    const header = req.headers.get('x-waffo-signature') || '';
    const parts = Object.fromEntries(
      header.split(',').map((part) => {
        const index = part.indexOf('=');
        return [part.slice(0, index).trim(), part.slice(index + 1).trim()];
      })
    );
    if (
      !parts.t ||
      !parts.v1 ||
      !Number.isFinite(Number(parts.t)) ||
      Math.abs(Date.now() - Number(parts.t)) > 45 * 60 * 1000
    ) {
      throw new Error('Invalid Waffo webhook timestamp');
    }
    if (
      !verify(
        'RSA-SHA256',
        Buffer.from(`${parts.t}.${body}`),
        pemKey(this.configs.webhookPublicKey, 'PUBLIC'),
        Buffer.from(parts.v1, 'base64')
      )
    ) {
      throw new Error('Invalid Waffo webhook signature');
    }
    const event = JSON.parse(body);
    if (event.mode !== 'prod' || event.storeId !== this.configs.storeId)
      throw new Error('Waffo webhook store or environment mismatch');
    if (event.eventType !== 'order.completed')
      throw new WebhookIgnoredError('Unsupported Waffo event');
    const data = event.data;
    const amount = Number(data.chargedAmount ?? data.amount);
    if (
      data.paymentStatus !== 'succeeded' ||
      data.orderStatus !== 'completed' ||
      !data.orderMerchantExternalId ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      throw new Error('Invalid Waffo payment');
    }
    return {
      eventType: PaymentEventType.CHECKOUT_SUCCESS,
      eventResult: event,
      paymentSession: {
        provider: this.name,
        paymentStatus: PaymentStatus.SUCCESS,
        paymentResult: { ...data, waffoOrderNo: data.orderMerchantExternalId },
        paymentInfo: {
          transactionId: data.paymentId,
          paymentAmount: Math.round(amount * 100),
          paymentCurrency: data.currency.toLowerCase(),
          paymentEmail: data.buyerEmail,
        },
      },
    };
  }
}
