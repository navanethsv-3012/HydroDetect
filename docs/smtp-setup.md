# SMTP Setup Guide

## Overview

AquaSentinel triggers automated SMTP email alerts when a **Critical** severity alert is generated (such as when water loss exceeds 15%, indicating potential untreated effluent bypass).

## Configuration Parameters

In `backend/.env`, set the following environment variables:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@yourfactory.com
SMTP_PASS=your-app-password
SMTP_FROM="AquaSentinel Alerts" <alerts@yourfactory.com>
ALERT_EMAIL_TO=compliance-officer@factory.com
```

## Provider Setup Examples

### 1. Gmail / Google Workspace
- Enable 2-Step Verification on your Google Account.
- Generate an **App Password** for "Mail".
- Set `SMTP_HOST=smtp.gmail.com` and `SMTP_PORT=587`.
- Set `SMTP_PASS` to the generated 16-character app password.

### 2. Mailtrap (Development / Testing)
- Create a free Mailtrap account.
- Copy your Sandbox SMTP credentials into `backend/.env`.
- `SMTP_HOST=sandbox.smtp.mailtrap.io`
- `SMTP_PORT=2525`

### 3. SendGrid / AWS SES
- Configure SMTP relay with your verified sender domain/identity.

## Unconfigured Behavior (Graceful Fallback)

If SMTP variables are left empty or omitted:
- The system **will not crash**.
- Alerts will still be saved to MongoDB and broadcast live over Socket.IO to connected dashboards.
- Email dispatch will log a fallback message to stdout:
  `[EMAIL] Would have sent email: "..." to admin@yourcompany.com (SMTP not configured)`
