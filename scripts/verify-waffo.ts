import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, verify } from 'node:crypto';

import { PaymentType } from '../src/core/payment/types';
import { WaffoProvider } from '../src/core/payment/waffo';

async function main() {
  const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const privateKey = keys.privateKey
    .export({ type: 'pkcs8', format: 'pem' })
    .toString();
  const publicKey = keys.publicKey
    .export({ type: 'spki', format: 'pem' })
    .toString();
  const provider = new WaffoProvider({
    merchantId: 'MER_test',
    privateKey,
    webhookPublicKey: publicKey,
    storeId: 'STO_test',
    productMapping: '{"hotel_starter":"PROD_test"}',
  });
  const event = {
    mode: 'prod',
    storeId: 'STO_test',
    eventType: 'order.completed',
    data: {
      orderMerchantExternalId: 'local-order',
      paymentStatus: 'succeeded',
      orderStatus: 'completed',
      amount: '9.90',
      currency: 'USD',
      paymentId: 'PAY_test',
    },
  };
  function request(value = event, timestamp = Date.now()) {
    const body = JSON.stringify(value);
    const signature = sign(
      'RSA-SHA256',
      Buffer.from(`${timestamp}.${body}`),
      privateKey
    ).toString('base64');
    return new Request('https://example.com/webhook', {
      method: 'POST',
      body,
      headers: { 'x-waffo-signature': `t=${timestamp},v1=${signature}` },
    });
  }
  const accepted = await provider.getPaymentEvent({ req: request() });
  const bareKeyProvider = new WaffoProvider({
    ...provider.configs,
    privateKey: privateKey.replace(/-----[^\n]+-----|\s/g, ''),
    webhookPublicKey: publicKey.replace(/-----[^\n]+-----|\s/g, ''),
  });
  await bareKeyProvider.getPaymentEvent({ req: request() });
  assert.equal(accepted.paymentSession?.paymentInfo?.paymentAmount, 990);
  assert.equal(
    accepted.paymentSession?.paymentResult.waffoOrderNo,
    'local-order'
  );
  await provider.getPaymentEvent({
    req: request(event, Date.now() - 32 * 60000),
  });
  await assert.rejects(
    provider.getPaymentEvent({ req: request(event, Date.now() - 46 * 60000) })
  );
  await assert.rejects(
    provider.getPaymentEvent({
      req: request({ ...event, storeId: 'STO_other' }),
    })
  );
  await assert.rejects(
    provider.getPaymentEvent({ req: request({ ...event, mode: 'test' }) })
  );
  const original = request();
  await assert.rejects(
    provider.getPaymentEvent({
      req: new Request(original.url, {
        method: 'POST',
        headers: original.headers,
        body: JSON.stringify({ ...event, storeId: 'forged' }),
      }),
    })
  );
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    const headers = new Headers(options?.headers);
    const { createHash } = await import('node:crypto');
    const body = String(options?.body);
    const hash = createHash('sha256').update(body).digest('base64');
    assert.ok(
      verify(
        'RSA-SHA256',
        Buffer.from(
          `POST\n/v1/actions/checkout/create-session\n${headers.get('x-timestamp')}\n${hash}`
        ),
        publicKey,
        Buffer.from(headers.get('x-signature')!, 'base64')
      )
    );
    assert.equal(JSON.parse(body).productId, 'PROD_test');
    assert.equal(JSON.parse(body).orderMerchantExternalId, 'local-order');
    return Response.json({
      data: {
        sessionId: 'cs_test',
        checkoutUrl: 'https://pancake.waffo.ai/checkout/test',
      },
    });
  };
  try {
    const result = await provider.createPayment({
      order: {
        productId: 'hotel_starter',
        orderNo: 'local-order',
        type: PaymentType.ONE_TIME,
        price: { amount: 990, currency: 'usd' },
        successUrl: 'https://example.com/success',
      },
    });
    assert.equal(result.checkoutInfo.sessionId, 'cs_test');
  } finally {
    globalThis.fetch = realFetch;
  }
  console.log(
    'Waffo: signed checkout, payment conversion, tampering, store/environment isolation and retry window verified.'
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
