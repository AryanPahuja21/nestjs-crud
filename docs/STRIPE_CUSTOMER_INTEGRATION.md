# 🏪 Stripe Customer Integration Guide

This guide explains how the Product Inventory Management System integrates with Stripe to automatically create customers and manage their payment methods.

## 🚀 Overview

When a user registers in the system, a corresponding Stripe customer is automatically created with their name and email. This enables seamless payment processing and payment method management.

## 🔄 Automatic Customer Creation

### User Registration Flow

1. **User Registration**: When a user registers via `POST /users`
2. **Database Creation**: User is saved to the database first
3. **Stripe Customer Creation**: A Stripe customer is created with:
   - **Name**: User's full name
   - **Email**: User's email address
   - **Metadata**: `userId` and `source: 'user_registration'`
   - **Description**: "Customer for user ID: {userId}"
4. **Database Update**: User record is updated with `stripeCustomerId`

### Example Registration Response

```json
{
  "success": true,
  "timestamp": "2025-10-13T12:00:00.000Z",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "stripeCustomerId": "cus_ABC123DEF456",
      "isEmailVerified": false
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 💳 Payment Method Management

### Available Endpoints

#### 1. Get Customer Payment Methods

```http
GET /payments/customer/payment-methods
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "pm_1234567890",
      "type": "card",
      "card": {
        "brand": "visa",
        "last4": "4242",
        "exp_month": 12,
        "exp_year": 2025
      }
    }
  ]
}
```

#### 2. Attach Payment Method

```http
POST /payments/customer/payment-methods
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentMethodId": "pm_1234567890abcdef"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "pm_1234567890abcdef",
    "type": "card",
    "customer": "cus_ABC123DEF456"
  }
}
```

#### 3. Detach Payment Method

```http
DELETE /payments/customer/payment-methods/{paymentMethodId}
Authorization: Bearer {token}
```

#### 4. Set Default Payment Method

```http
PATCH /payments/customer/default-payment-method
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentMethodId": "pm_1234567890abcdef"
}
```

## 🔄 User Updates and Stripe Sync

### Automatic Synchronization

When a user updates their profile information, the system automatically syncs changes to Stripe:

- **Email Change**: Updates Stripe customer email
- **Name Change**: Updates Stripe customer name
- **User Deletion**: Deletes the corresponding Stripe customer

### Example User Update

```http
PATCH /users/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

This will automatically update the Stripe customer with the new name and email.

## 🛠️ Implementation Details

### UserService Integration

The `UserService` now includes Stripe customer management:

```typescript
// Automatic customer creation during registration
async create(dto: CreateUserDto): Promise<User> {
  // ... create user in database

  // Create Stripe customer
  const stripeCustomer = await this.paymentService.createStripeCustomer(
    savedUser.id.toString(),
    savedUser.email,
    savedUser.name,
  );

  // Update user with Stripe customer ID
  savedUser.stripeCustomerId = stripeCustomer.id;
  await this.userRepo.save(savedUser);

  return savedUser;
}
```

### PaymentService Methods

New customer management methods in `PaymentService`:

- `createStripeCustomer(userId, email, name)`: Creates a new Stripe customer
- `getStripeCustomer(customerId)`: Retrieves customer details
- `updateStripeCustomer(customerId, updates)`: Updates customer information
- `deleteStripeCustomer(customerId)`: Deletes a customer
- `attachPaymentMethod(customerId, paymentMethodId)`: Attaches payment method
- `detachPaymentMethod(paymentMethodId)`: Detaches payment method
- `getCustomerPaymentMethods(customerId)`: Lists customer's payment methods
- `setDefaultPaymentMethod(customerId, paymentMethodId)`: Sets default payment method

## 🎯 Payment Flow Enhancement

### Enhanced Payment Intent Creation

Payment intents now use the customer's existing Stripe customer ID:

```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount,
  currency: 'usd',
  customer: user.stripeCustomerId, // Uses existing customer
  metadata: {
    userId,
    productId,
    quantity: quantity.toString(),
  },
  receipt_email: user.email,
  automatic_payment_methods: {
    enabled: true,
  },
});
```

## 🔒 Security Considerations

### Customer Isolation

- Each user can only access their own Stripe customer data
- Customer ID lookup is done via authenticated user's `userId`
- Payment methods are isolated per customer

### Error Handling

- **Graceful Degradation**: User registration succeeds even if Stripe customer creation fails
- **Retry Logic**: Failed Stripe operations can be retried later
- **Logging**: All Stripe operations are logged for monitoring

## 📊 Stripe Dashboard Integration

### Customer Information

In your Stripe Dashboard, customers will appear with:

- **Name**: User's full name from registration
- **Email**: User's email address
- **Metadata**:
  - `userId`: Internal user ID for reference
  - `source`: "user_registration"
- **Description**: "Customer for user ID: {userId}"

### Payment Method Management

- View all customer payment methods
- See payment history and transactions
- Monitor subscription status (if applicable)
- Handle disputes and refunds

## 🚀 Usage Examples

### Frontend Integration

#### 1. Create Payment Method (Frontend)

```javascript
// Create payment method on frontend using Stripe.js
const { paymentMethod, error } = await stripe.createPaymentMethod({
  type: 'card',
  card: cardElement,
});

if (!error) {
  // Attach to customer via your API
  await fetch('/payments/customer/payment-methods', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentMethodId: paymentMethod.id,
    }),
  });
}
```

#### 2. Process Payment with Saved Method

```javascript
// Get customer's payment methods
const response = await fetch('/payments/customer/payment-methods', {
  headers: { Authorization: `Bearer ${token}` },
});
const { data: paymentMethods } = await response.json();

// Use existing payment method for payment
const paymentIntent = await fetch('/payments/create-intent', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    productId: 'product_123',
    quantity: 1,
    currency: 'usd',
  }),
});
```

## 🎛️ Configuration

### Environment Variables

Ensure these environment variables are set:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Backend URL for webhooks
BACKEND_URL=https://your-domain.com
```

### Stripe Webhook Events

The system handles these webhook events:

- `payment_intent.succeeded`: Updates payment status
- `payment_intent.payment_failed`: Handles failed payments
- `customer.updated`: Syncs customer information changes
- `payment_method.attached`: Logs payment method attachments

## 🔍 Monitoring and Analytics

### Logging

All Stripe operations are logged with:

- User ID
- Customer ID
- Operation type
- Success/failure status
- Error messages (if any)

### Metrics to Track

- Customer creation success rate
- Payment method attachment rate
- Payment success rate by customer
- Customer lifetime value

## 🛠️ Troubleshooting

### Common Issues

#### 1. Customer Not Found

```
Error: Customer not found
```

**Solution**: Ensure user has a valid `stripeCustomerId` or create one using the user service.

#### 2. Payment Method Already Attached

```
Error: This PaymentMethod is already attached to a customer
```

**Solution**: Check if payment method is already attached before attempting to attach.

#### 3. Circular Dependency

```
Error: Circular dependency detected
```

**Solution**: Ensure `forwardRef()` is used in both UserModule and PaymentModule.

### Debug Commands

```bash
# Check user's Stripe customer ID
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/users/{userId}

# List customer's payment methods
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/payments/customer/payment-methods

# Check Stripe customer in dashboard
# Go to: https://dashboard.stripe.com/customers/{customerId}
```

## 🚀 Next Steps

### Recommended Enhancements

1. **Subscription Management**: Add subscription creation and management
2. **Invoice Generation**: Automatic invoice generation for purchases
3. **Payment Method Validation**: Validate payment methods before attachment
4. **Bulk Operations**: Batch customer operations for better performance
5. **Analytics Dashboard**: Customer payment analytics and insights

### Integration with Other Services

- **Email Notifications**: Send payment confirmation emails
- **Inventory Management**: Auto-update stock after successful payments
- **Customer Support**: Integration with support ticket systems
- **Marketing**: Customer segmentation based on payment behavior

---

**🎉 Your Stripe integration is now complete!** Users will automatically get Stripe customers created when they register, and you can manage their payment methods seamlessly through the API.
