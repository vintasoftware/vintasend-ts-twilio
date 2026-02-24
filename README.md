# VintaSend Twilio Adapter

A VintaSend notification adapter using [Twilio](https://www.twilio.com/) for reliable SMS and phone call delivery.

## Installation

```bash
npm install vintasend-twilio twilio
```

## Configuration

```typescript
import { TwilioNotificationAdapterFactory } from 'vintasend-twilio';

const adapter = new TwilioNotificationAdapterFactory().create(
   templateRenderer,
   false, // enqueueNotifications
   {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: '+1234567890',
   }
);
```

### Configuration Options

```typescript
interface TwilioConfig {
   accountSid: string;    // Twilio Account SID
   authToken: string;     // Twilio Auth Token
   fromNumber: string;    // Default sender phone number
}
```

## Usage

### Basic SMS

```typescript
await notificationService.createNotification({
   userId: '123',
   notificationType: 'SMS',
   contextName: 'verification',
   contextParameters: { code: '123456' },
   title: 'Verification Code',
   bodyTemplate: '/templates/verification.pug',
   sendAfter: new Date(),
});
```

### One-Off SMS

Send SMS without a user account:

```typescript
await notificationService.createOneOffNotification({
   emailOrPhone: '+1987654321',
   firstName: 'Jane',
   lastName: 'Smith',
   notificationType: 'SMS',
   contextName: 'order-status',
   contextParameters: { status: 'shipped' },
   title: 'Order Status Update',
   bodyTemplate: '/templates/order-status.pug',
   sendAfter: new Date(),
});
```

### Scheduled Notifications

```typescript
await notificationService.createNotification({
   userId: '123',
   notificationType: 'SMS',
   contextName: 'reminder',
   contextParameters: { appointmentTime: '2pm' },
   title: 'Appointment Reminder',
   bodyTemplate: '/templates/reminder.pug',
   sendAfter: new Date('2024-01-15T14:00:00Z'),
});
```

## Features

- ✅ SMS delivery via Twilio API
- ✅ One-off notifications
- ✅ Scheduled notifications
- ✅ Custom sender phone number
- ✅ Text message templates
- ✅ Global reach (190+ countries)

## API Reference

### TwilioNotificationAdapterFactory

```typescript
class TwilioNotificationAdapterFactory<Config extends BaseNotificationTypeConfig>
```

**Methods:**
- `create<TemplateRenderer>(templateRenderer, enqueueNotifications, config)` - Create adapter instance

### TwilioNotificationAdapter

**Properties:**
- `key: string` - Returns `'twilio'`
- `notificationType: NotificationType` - Returns `'SMS'`
- `supportsAttachments: boolean` - Returns `false`

**Methods:**
- `send(notification, context)` - Send an SMS message

## Environment Variables

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token-here
TWILIO_FROM_NUMBER=+1234567890
```

## License

MIT