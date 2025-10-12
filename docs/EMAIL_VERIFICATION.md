# Email Verification Implementation

This document outlines the email verification feature that has been implemented in the application.

## Overview

Email verification ensures that users have access to the email address they registered with. New users must verify their email address within 24 hours of registration to maintain full access to the application.

## Features

- **Automatic email sending**: Verification emails are sent automatically upon user registration
- **Token-based verification**: Secure, time-limited tokens (24 hours expiry)
- **Resend functionality**: Users can request new verification emails if needed
- **Welcome emails**: Automatic welcome email sent after successful verification
- **Database tracking**: Email verification status is tracked in the user entity
- **Rate limiting**: Protection against spam and abuse

## Environment Variables

Add these environment variables to your `.env` file for email functionality:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# Frontend URL for verification links
FRONTEND_URL=http://localhost:3000
```

### Email Provider Setup

#### Gmail Setup

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: Account Settings → Security → App passwords
3. Use the app password as `EMAIL_PASSWORD`

#### Other Providers

Update `EMAIL_HOST`, `EMAIL_PORT`, and `EMAIL_SECURE` according to your provider's SMTP settings.

## API Endpoints

### POST /auth/verify-email

Verifies a user's email using the provided token.

**Request Body:**

```json
{
  "token": "abc123def456"
}
```

**Response:**

```json
{
  "success": true,
  "timestamp": "2023-12-01T10:00:00.000Z",
  "data": {
    "message": "Email verified successfully",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isEmailVerified": true
    }
  }
}
```

### POST /auth/resend-verification

Resends verification email to the specified email address.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "timestamp": "2023-12-01T10:00:00.000Z",
  "data": {
    "message": "Verification email sent successfully"
  }
}
```

## Database Schema

The following fields have been added to the `users` table:

```sql
ALTER TABLE users ADD COLUMN isEmailVerified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN emailVerificationToken VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN emailVerificationTokenExpires TIMESTAMP NULL;
```

## Usage Examples

### Protecting Routes (Optional)

You can use the `EmailVerificationGuard` and `@RequireEmailVerification()` decorator to protect routes that require verified emails:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerificationGuard } from '../common/guards/email-verification.guard';
import { RequireEmailVerification } from '../common/decorators/require-email-verification.decorator';

@Controller('protected')
export class ProtectedController {
  @Get('verified-only')
  @UseGuards(JwtAuthGuard, EmailVerificationGuard)
  @RequireEmailVerification()
  async getVerifiedOnlyData() {
    return { message: 'This endpoint requires email verification' };
  }
}
```

### Frontend Integration

1. **Registration Flow**: After successful registration, inform users to check their email
2. **Verification Page**: Create a page that accepts the token from the email link
3. **Resend Option**: Provide a way for users to request new verification emails

```javascript
// Example verification call
const verifyEmail = async (token) => {
  const response = await fetch('/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return response.json();
};
```

## Email Templates

The email service uses HTML templates with inline styles for better compatibility across email clients. The templates include:

- **Verification Email**: Contains a verification button and fallback link
- **Welcome Email**: Sent after successful verification

## Security Considerations

- **Token Expiry**: Verification tokens expire after 24 hours
- **Rate Limiting**:
  - Verification attempts: 10 per 15 minutes
  - Resend attempts: 5 per hour
- **Token Cleanup**: Expired tokens are cleared when new ones are generated
- **Secure Generation**: Tokens use crypto.randomBytes for security

## Error Handling

Common error scenarios:

- **Invalid Token**: Returns validation error
- **Expired Token**: Returns validation error with expiry message
- **Already Verified**: Returns validation error
- **Email Send Failure**: Returns server error (logs details)
- **Rate Limit Exceeded**: Returns 429 status with retry information

## Migration

To apply the database changes, run the migration:

```bash
# Run the migration (adjust command based on your setup)
npm run migration:run
```

If you encounter issues, you can manually add the columns:

```sql
ALTER TABLE users
ADD COLUMN isEmailVerified BOOLEAN DEFAULT FALSE,
ADD COLUMN emailVerificationToken VARCHAR(255) NULL,
ADD COLUMN emailVerificationTokenExpires TIMESTAMP NULL;
```

## Testing

Test the email verification flow:

1. Register a new user via `POST /users`
2. Check your email for the verification message
3. Use the token from the email with `POST /auth/verify-email`
4. Verify the user's `isEmailVerified` status is now `true`

## Troubleshooting

**Emails not sending:**

- Check environment variables are correctly set
- Verify email provider credentials
- Check application logs for email service errors
- Ensure less secure app access is enabled (for Gmail)

**Database errors:**

- Run the migration to add required columns
- Check database connection and permissions
- Verify TypeORM entity synchronization

**Token issues:**

- Tokens expire after 24 hours - use resend functionality
- Each user can only have one active token at a time
- Tokens are cleared after successful verification
