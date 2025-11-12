# Mailer Utility - Quick Reference

## 🚀 Quick Start

```javascript
const mailer = require('./utils/mailer');

// Initialize (do this once on app startup)
mailer.initialize();

// Send simple email
await mailer.send({
  to: 'user@example.com',
  subject: 'Hello',
  html: '<h1>Hello World!</h1>',
});

// Send with template
await mailer.sendWithTemplate(
  'user@example.com',
  'Welcome',
  'welcome',
  { userName: 'John' }
);
```

---

## 📖 Common Use Cases

### 1. Send Welcome Email

```javascript
await mailer.sendWithTemplate(
  user.email,
  'Welcome to Movie Booking!',
  'welcome',
  {
    userName: user.name,
    email: user.email,
  }
);
```

### 2. Send with Attachment

```javascript
await mailer.sendWithAttachment(
  'user@example.com',
  'Your Invoice',
  '<h1>Invoice Attached</h1>',
  [
    {
      filename: 'invoice.pdf',
      path: './invoices/invoice.pdf',
    },
  ]
);
```

### 3. Send Bulk Emails

```javascript
const recipients = [
  { email: 'user1@example.com', data: { name: 'John' } },
  { email: 'user2@example.com', data: { name: 'Jane' } },
];

await mailer.sendBulk(
  recipients,
  'Newsletter',
  'newsletter',
  { month: 'January' }
);
```

### 4. Send with CC/BCC

```javascript
await mailer.send({
  to: 'user@example.com',
  cc: 'manager@example.com',
  bcc: 'admin@example.com',
  subject: 'Team Update',
  html: '<p>Update...</p>',
});
```

### 5. High Priority Email

```javascript
await mailer.send({
  to: 'user@example.com',
  subject: 'URGENT',
  html: '<p>Action required...</p>',
  priority: 'high',
});
```

---

## 🔧 API Methods

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize mailer with config |
| `verify()` | Verify SMTP connection |
| `send(options)` | Send email with full options |
| `sendWithTemplate(to, subject, template, data)` | Send using template |
| `sendBulk(recipients, subject, template, data)` | Send to multiple recipients |
| `sendWithAttachment(to, subject, html, attachments)` | Send with files |
| `loadTemplate(name, data)` | Load and compile template |
| `clearCache()` | Clear template cache |
| `getStatus()` | Get mailer status |

---

## ⚙️ Configuration (.env)

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
EMAIL_FROM_NAME=Movie Booking System
```

---

## 🧪 Testing

```bash
# Test the mailer
npm run test:mailer
```

---

## 📚 Full Documentation

See [MAILER_UTILITY_GUIDE.md](../MAILER_UTILITY_GUIDE.md) for complete documentation.

---

## ✨ Features

- ✅ Template caching
- ✅ Bulk sending with rate limiting
- ✅ Attachments support
- ✅ CC/BCC support
- ✅ Priority levels
- ✅ HTML & plain text
- ✅ Error handling
- ✅ SMTP verification

---

## 💡 Tips

1. **Initialize once** on app startup
2. **Use templates** for consistency
3. **Handle errors** - check result.success
4. **Use queues** for non-blocking sends
5. **Test with Mailtrap** in development
6. **Monitor status** with getStatus()
