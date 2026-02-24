import { BaseNotificationAdapter } from 'vintasend';
import type { BaseEmailTemplateRenderer } from 'vintasend';
import type { JsonObject } from 'vintasend/dist/types/json-values';
import type { AnyDatabaseNotification } from 'vintasend/dist/types/notification';
import type { BaseNotificationTypeConfig } from 'vintasend/dist/types/notification-type-config';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

/**
 * SMS adapter using Twilio REST API directly via fetch.
 * Avoids the twilio npm package to keep Medplum bot bundles small.
 *
 * SMS notifications should be created via createOneOffNotification() with
 * the phone number passed as emailOrPhone. The calling service resolves
 * the phone number from the FHIR resource.
 */
export class TwilioSmsAdapter<
  TemplateRenderer extends BaseEmailTemplateRenderer<Config>,
  Config extends BaseNotificationTypeConfig,
> extends BaseNotificationAdapter<TemplateRenderer, Config> {
  key: string | null = 'twilio-sms';
  private config: TwilioConfig;

  constructor(templateRenderer: TemplateRenderer, enqueueNotifications: boolean, config: TwilioConfig) {
    super(templateRenderer, 'SMS', enqueueNotifications);
    this.config = config;
  }

  get supportsAttachments(): boolean {
    return false;
  }

  async send(notification: AnyDatabaseNotification<Config>, context: JsonObject): Promise<void> {
    const template = await this.templateRenderer.render(notification, context);
    const recipientPhone = await this.getRecipientEmail(notification);

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`;
    const credentials = btoa(`${this.config.accountSid}:${this.config.authToken}`);

    const body = new URLSearchParams({
      To: recipientPhone,
      From: this.config.fromNumber,
      Body: template.body,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Twilio SMS send failed (${response.status}): ${errorBody}`);
    }
  }
}

export class TwilioSmsAdapterFactory<Config extends BaseNotificationTypeConfig> {
  create<TemplateRenderer extends BaseEmailTemplateRenderer<Config>>(
    templateRenderer: TemplateRenderer,
    enqueueNotifications: boolean,
    config: TwilioConfig
  ): TwilioSmsAdapter<TemplateRenderer, Config> {
    return new TwilioSmsAdapter(templateRenderer, enqueueNotifications, config);
  }
}
