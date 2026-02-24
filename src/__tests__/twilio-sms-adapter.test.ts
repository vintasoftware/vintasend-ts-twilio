import { TwilioSmsAdapter, TwilioSmsAdapterFactory } from '../twilio-sms-adapter';
import type { TwilioConfig } from '../twilio-sms-adapter';

const mockTemplateRenderer = {
  render: jest.fn(),
  injectLogger: jest.fn(),
};

const twilioConfig: TwilioConfig = {
  accountSid: 'AC_test_sid',
  authToken: 'test_auth_token',
  fromNumber: '+15551234567',
};

function createNotification(overrides = {}) {
  return {
    id: 'notif-1',
    emailOrPhone: '+15559876543',
    firstName: 'Jane',
    lastName: 'Doe',
    notificationType: 'SMS' as const,
    title: 'Test',
    bodyTemplate: 'sms/test/body.txt.pug',
    contextName: 'inboxMessage',
    contextParameters: {},
    sendAfter: new Date(),
    subjectTemplate: null,
    status: 'PENDING_SEND' as const,
    contextUsed: null,
    extraParams: {},
    adapterUsed: null,
    sentAt: null,
    readAt: null,
    ...overrides,
  };
}

describe('TwilioSmsAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('has correct key and notificationType', () => {
    const adapter = new TwilioSmsAdapter(mockTemplateRenderer as any, false, twilioConfig);
    expect(adapter.key).toBe('twilio-sms');
    expect(adapter.notificationType).toBe('SMS');
  });

  test('supportsAttachments returns false', () => {
    const adapter = new TwilioSmsAdapter(mockTemplateRenderer as any, false, twilioConfig);
    expect(adapter.supportsAttachments).toBe(false);
  });

  test('send() renders template and calls Twilio API', async () => {
    const adapter = new TwilioSmsAdapter(mockTemplateRenderer as any, false, twilioConfig);
    const notification = createNotification();
    const context = { firstName: 'Jane', messageTopic: 'Test Topic' };

    mockTemplateRenderer.render.mockResolvedValue({
      subject: '',
      body: 'Hello Jane, you have a new message about Test Topic',
    });

    const mockResponse = { ok: true, status: 201 };
    jest.mocked(fetch).mockResolvedValue(mockResponse as Response);

    await adapter.send(notification as any, context);

    // Verify template was rendered
    expect(mockTemplateRenderer.render).toHaveBeenCalledWith(notification, context);

    // Verify fetch was called with correct Twilio API URL
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = jest.mocked(fetch).mock.calls[0];
    expect(url).toBe(`https://api.twilio.com/2010-04-01/Accounts/${twilioConfig.accountSid}/Messages.json`);

    // Verify auth header
    const expectedCredentials = btoa(`${twilioConfig.accountSid}:${twilioConfig.authToken}`);
    expect(options?.headers).toEqual(
      expect.objectContaining({
        Authorization: `Basic ${expectedCredentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      })
    );

    // Verify body params
    const bodyParams = new URLSearchParams(options?.body as string);
    expect(bodyParams.get('To')).toBe('+15559876543');
    expect(bodyParams.get('From')).toBe(twilioConfig.fromNumber);
    expect(bodyParams.get('Body')).toBe('Hello Jane, you have a new message about Test Topic');
  });

  test('send() throws on non-ok response', async () => {
    const adapter = new TwilioSmsAdapter(mockTemplateRenderer as any, false, twilioConfig);
    const notification = createNotification();

    mockTemplateRenderer.render.mockResolvedValue({ subject: '', body: 'Hello' });

    const mockResponse = {
      ok: false,
      status: 400,
      text: jest.fn().mockResolvedValue('Bad Request: Invalid phone number'),
    };
    jest.mocked(fetch).mockResolvedValue(mockResponse as any);

    await expect(adapter.send(notification as any, {})).rejects.toThrow(
      'Twilio SMS send failed (400): Bad Request: Invalid phone number'
    );
  });

  test('send() throws on fetch failure', async () => {
    const adapter = new TwilioSmsAdapter(mockTemplateRenderer as any, false, twilioConfig);
    const notification = createNotification();

    mockTemplateRenderer.render.mockResolvedValue({ subject: '', body: 'Hello' });
    jest.mocked(fetch).mockRejectedValue(new Error('Network error'));

    await expect(adapter.send(notification as any, {})).rejects.toThrow('Network error');
  });
});

describe('TwilioSmsAdapterFactory', () => {
  test('creates a TwilioSmsAdapter instance', () => {
    const factory = new TwilioSmsAdapterFactory();
    const adapter = factory.create(mockTemplateRenderer as any, false, twilioConfig);
    expect(adapter).toBeInstanceOf(TwilioSmsAdapter);
    expect(adapter.key).toBe('twilio-sms');
  });
});
