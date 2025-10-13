# Subscription Integration Guide

## Overview

This document provides a comprehensive guide to the subscription-based model implementation in the Product Inventory Management System. The subscription system allows users to select subscription plans during registration and manage them throughout their lifecycle.

## Features

- 🎯 **Plan Selection During Registration**: Users can choose a subscription plan when signing up
- 💳 **Stripe Integration**: Full integration with Stripe's subscription APIs
- 🔄 **Plan Management**: Users can upgrade, downgrade, or cancel subscriptions
- 📊 **Subscription Status Tracking**: Real-time status updates via webhooks
- 🛡️ **Access Control**: Guard-based access control based on subscription status
- 📱 **Webhook Handling**: Automatic processing of Stripe subscription events

## Architecture

### Database Schema

#### User Entity (MySQL)

```typescript
// Additional fields added to existing User entity
currentSubscriptionId?: string;     // Current Stripe Subscription ID
subscriptionStatus?: string;        // Current subscription status
subscriptionPlan?: string;          // Current plan name
subscriptionEndDate?: Date;         // Subscription end date
```

#### Subscription Schema (MongoDB)

```typescript
userId: string;                     // User ID from MySQL
stripeSubscriptionId: string;       // Stripe Subscription ID
stripeCustomerId: string;           // Stripe Customer ID
stripePriceId: string;              // Stripe Price ID
stripeProductId: string;            // Stripe Product ID
productName: string;                // Product/Plan name
priceAmount: number;                // Price in cents
currency: string;                   // Currency code
interval: SubscriptionInterval;     // Billing interval
status: SubscriptionStatus;         // Subscription status
currentPeriodStart?: Date;          // Current billing period start
currentPeriodEnd?: Date;            // Current billing period end
// ... additional fields
```

### Services

#### SubscriptionService

- **`getAvailablePlans()`**: Fetch all subscription plans from Stripe
- **`createSubscription()`**: Create a new subscription for a user
- **`getUserSubscription()`**: Get user's current subscription
- **`updateSubscription()`**: Update/change subscription plan
- **`cancelSubscription()`**: Cancel a subscription
- **`handleSubscriptionWebhook()`**: Process Stripe subscription webhooks

#### UserService (Enhanced)

- **`updateUserSubscriptionInfo()`**: Update user's subscription information
- **Enhanced `create()`**: Handle subscription creation during registration

#### PaymentService (Enhanced)

- **Enhanced `handleWebhook()`**: Route subscription webhooks to SubscriptionService

## API Endpoints

### Subscription Management

#### Get Available Plans

```http
GET /subscriptions/plans
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "prod_1234567890",
      "name": "Premium Plan",
      "description": "Access to all premium features",
      "prices": [
        {
          "id": "price_1234567890",
          "unit_amount": 2999,
          "currency": "usd",
          "recurring": {
            "interval": "month",
            "interval_count": 1
          }
        }
      ]
    }
  ]
}
```

#### Create Subscription

```http
POST /subscriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "priceId": "price_1234567890",
  "paymentMethodId": "pm_1234567890",
  "metadata": {
    "orderId": "12345"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "60d0fe4f5311236168a109cb",
      "stripeSubscriptionId": "sub_1234567890",
      "productName": "Premium Plan",
      "status": "active",
      "priceAmount": 2999,
      "currency": "usd",
      "interval": "month"
    },
    "clientSecret": "pi_1234567890_secret_abc123"
  }
}
```

#### Get My Subscription

```http
GET /subscriptions/my-subscription
Authorization: Bearer <token>
```

#### Update My Subscription

```http
PATCH /subscriptions/my-subscription
Authorization: Bearer <token>
Content-Type: application/json

{
  "priceId": "price_new_plan",
  "paymentMethodId": "pm_new_payment_method"
}
```

#### Cancel My Subscription

```http
DELETE /subscriptions/my-subscription?immediately=false
Authorization: Bearer <token>
```

### User Registration with Subscription

#### Register with Subscription Plan

```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "subscriptionPriceId": "price_1234567890"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "name": "John Doe",
      "email": "john@example.com",
      "stripeCustomerId": "cus_1234567890",
      "currentSubscriptionId": "sub_1234567890",
      "subscriptionStatus": "incomplete",
      "subscriptionPlan": "Premium Plan"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Access Control

### Subscription Guards

Use the `@RequireActiveSubscription()` decorator to protect endpoints:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { RequireActiveSubscription } from '../common/decorators/subscription.decorator';

@Controller('premium')
export class PremiumController {
  @Get('features')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @RequireActiveSubscription()
  async getPremiumFeatures() {
    return { features: ['Feature 1', 'Feature 2', 'Feature 3'] };
  }
}
```

### Custom Subscription Requirements

```typescript
@Get('enterprise-features')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@RequireSubscription('active', 'trialing')
async getEnterpriseFeatures() {
  // Only accessible to users with active or trialing subscriptions
}
```

## Webhook Handling

### Supported Webhook Events

The system automatically handles the following Stripe webhook events:

- **`customer.subscription.created`**: New subscription created
- **`customer.subscription.updated`**: Subscription details updated
- **`customer.subscription.deleted`**: Subscription canceled/deleted
- **`invoice.payment_succeeded`**: Subscription payment successful
- **`invoice.payment_failed`**: Subscription payment failed

### Webhook Configuration

1. **Set up webhook endpoint in Stripe Dashboard:**
   - URL: `https://your-domain.com/payments/webhook`
   - Events: Select subscription-related events

2. **Update webhook secret in environment:**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

## Frontend Integration

### Registration with Subscription Selection

```javascript
// 1. Fetch available plans
const plansResponse = await fetch('/subscriptions/plans');
const plans = await plansResponse.json();

// 2. Register user with selected plan
const registrationData = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  subscriptionPriceId: selectedPlan.prices[0].id,
};

const response = await fetch('/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(registrationData),
});

const result = await response.json();

// 3. Handle subscription setup (if incomplete)
if (result.data.user.subscriptionStatus === 'incomplete') {
  // Redirect to payment confirmation or setup
  window.location.href = `/subscription-setup?user_id=${result.data.user.id}`;
}
```

### Subscription Management

```javascript
// Get current subscription
const getSubscription = async () => {
  const response = await fetch('/subscriptions/my-subscription', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

// Update subscription
const updateSubscription = async (newPriceId) => {
  const response = await fetch('/subscriptions/my-subscription', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ priceId: newPriceId }),
  });
  return response.json();
};

// Cancel subscription
const cancelSubscription = async (immediately = false) => {
  const response = await fetch(`/subscriptions/my-subscription?immediately=${immediately}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};
```

## Stripe Dashboard Setup

### 1. Create Products and Prices

1. Go to **Products** in Stripe Dashboard
2. Create products for each subscription tier:
   - **Basic Plan**: $9.99/month
   - **Premium Plan**: $29.99/month
   - **Enterprise Plan**: $99.99/month

3. Note the Price IDs for each plan (starts with `price_`)

### 2. Configure Webhooks

1. Go to **Developers** → **Webhooks**
2. Add endpoint: `https://your-domain.com/payments/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret

## Testing

### Local Development with ngrok

1. **Start your application:**

   ```bash
   npm run start:dev
   ```

2. **Expose with ngrok:**

   ```bash
   ngrok http 3000
   ```

3. **Update Stripe webhook URL:**
   - Use the ngrok URL: `https://abc123.ngrok.io/payments/webhook`

### Test Scenarios

#### 1. Registration with Subscription

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "subscriptionPriceId": "price_1234567890"
  }'
```

#### 2. Get Available Plans

```bash
curl -X GET http://localhost:3000/subscriptions/plans
```

#### 3. Create Subscription (for existing user)

```bash
curl -X POST http://localhost:3000/subscriptions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_1234567890"
  }'
```

## Error Handling

### Common Error Scenarios

1. **User already has active subscription:**

   ```json
   {
     "success": false,
     "message": "User already has an active subscription",
     "statusCode": 400
   }
   ```

2. **Invalid price ID:**

   ```json
   {
     "success": false,
     "message": "Invalid price ID or product not found",
     "statusCode": 400
   }
   ```

3. **Insufficient permissions:**
   ```json
   {
     "success": false,
     "message": "No active subscription found",
     "statusCode": 403
   }
   ```

## Monitoring and Logging

### Important Log Messages

- ✅ **Subscription Created**: `Created subscription sub_xxx for user 123`
- 🔄 **Subscription Updated**: `Updated subscription sub_xxx for user 123`
- ❌ **Subscription Failed**: `Failed to create subscription for user 123`
- 📨 **Webhook Processed**: `Successfully processed webhook: customer.subscription.created`

### Monitoring Checklist

- [ ] Monitor subscription creation success rate
- [ ] Track webhook processing errors
- [ ] Monitor failed payments
- [ ] Check subscription status synchronization
- [ ] Monitor user experience during registration

## Best Practices

1. **Graceful Degradation**: Don't fail user registration if subscription creation fails
2. **Webhook Idempotency**: Handle duplicate webhook events gracefully
3. **Data Consistency**: Keep user subscription info synchronized between systems
4. **Error Handling**: Provide clear error messages to users
5. **Testing**: Thoroughly test subscription workflows in development
6. **Monitoring**: Set up alerts for subscription-related failures

## Troubleshooting

### Common Issues

1. **Circular Dependencies**: Use `forwardRef()` for module imports
2. **Webhook Signature Validation**: Ensure webhook secret is correct
3. **Database Sync Issues**: Check webhook event processing logs
4. **Payment Failures**: Monitor Stripe Dashboard for payment errors

### Debug Commands

```bash
# Check user subscription status
curl -X GET http://localhost:3000/users/123 \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Check subscription in database
# Connect to MongoDB and query subscriptions collection

# Test webhook endpoint
curl -X POST http://localhost:3000/payments/webhook \
  -H "stripe-signature: test_signature" \
  -d '{"type": "customer.subscription.created", "data": {...}}'
```

---

## Summary

The subscription integration provides a complete solution for managing subscription-based access to your application. Users can select plans during registration, manage their subscriptions through API endpoints, and the system automatically handles billing events through Stripe webhooks.

For additional support, refer to the [Stripe Documentation](https://stripe.com/docs/billing/subscriptions) and the application logs for detailed debugging information.
