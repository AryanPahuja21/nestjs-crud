# 🌐 ngrok Setup for Stripe Webhooks

This guide walks you through setting up ngrok to expose your local development server for Stripe webhook testing.

## 📋 Prerequisites

- Your Product Inventory Management System running locally
- Stripe account with access to the dashboard
- Terminal/command line access

## 🚀 Step 1: Install ngrok

### Option A: Download from Website

1. Go to [https://ngrok.com/](https://ngrok.com/)
2. Sign up for a free account
3. Download ngrok for your operating system
4. Extract and move to your PATH

### Option B: Install via Package Manager

**macOS (Homebrew):**

```bash
brew install ngrok/ngrok/ngrok
```

**Windows (Chocolatey):**

```bash
choco install ngrok
```

**Linux (Snap):**

```bash
sudo snap install ngrok
```

## 🔐 Step 2: Authenticate ngrok

1. Get your auth token from [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken)
2. Run the auth command:

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

## 🚀 Step 3: Start Your Application

Make sure your Product Inventory Management System is running:

```bash
# Start with Docker (recommended)
docker-compose up -d

# OR start development server
npm run start:dev
```

Verify it's running at: http://localhost:3000

## 🌐 Step 4: Expose Your Local Server

In a new terminal window, start ngrok:

```bash
# Expose port 3000 (your NestJS app)
ngrok http 3000
```

You'll see output like:

```
ngrok by @inconshreveable

Session Status                online
Account                      your-email@example.com
Version                      3.0.0
Region                       United States (us)
Forwarding                   https://abc123def456.ngrok-free.app -> http://localhost:3000
Forwarding                   http://abc123def456.ngrok-free.app -> http://localhost:3000

Connections                  ttl     opn     rt1     rt5     p50     p90
                             0       0       0.00    0.00    0.00    0.00

Web Interface                http://127.0.0.1:4040
```

**🎯 Important:** Copy the HTTPS URL (e.g., `https://abc123def456.ngrok-free.app`)

## 📊 Step 5: Configure Stripe Dashboard

### 5.1 Access Stripe Dashboard

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **Webhooks**

### 5.2 Create/Update Webhook Endpoint

1. Click **"Add endpoint"** or edit existing webhook
2. Set the endpoint URL to:

   ```
   https://your-ngrok-url.ngrok-free.app/payments/webhook
   ```

   Example: `https://abc123def456.ngrok-free.app/payments/webhook`

3. Select events to listen for:

   ```
   ✅ payment_intent.succeeded
   ✅ payment_intent.payment_failed
   ✅ payment_intent.canceled
   ✅ charge.dispute.created
   ```

4. Click **"Add endpoint"**

### 5.3 Get Your Webhook Secret

1. Click on your newly created webhook endpoint
2. Click **"Reveal"** next to "Signing secret"
3. Copy the webhook secret (starts with `whsec_`)

## ⚙️ Step 6: Update Environment Variables

Update your environment variables with the webhook secret:

### For Docker Development:

Add to your `docker.env` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
BACKEND_URL=https://your-ngrok-url.ngrok-free.app
```

### For Local Development:

Add to your `.env` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
BACKEND_URL=https://your-ngrok-url.ngrok-free.app
```

## 🔄 Step 7: Restart Your Application

Restart your application to pick up the new environment variables:

```bash
# If using Docker
docker-compose restart app

# If running locally
# Stop the app (Ctrl+C) and restart
npm run start:dev
```

## 🧪 Step 8: Test Webhook Delivery

### 8.1 Monitor ngrok Traffic

Open the ngrok web interface: http://127.0.0.1:4040

This shows real-time requests to your local server.

### 8.2 Test with Stripe Dashboard

1. Go to **Developers** → **Webhooks** → Your endpoint
2. Click **"Send test webhook"**
3. Choose an event type (e.g., `payment_intent.succeeded`)
4. Click **"Send test webhook"**

### 8.3 Check Your Application Logs

```bash
# Docker logs
docker-compose logs -f app

# Local development logs
# Check your terminal where npm run start:dev is running
```

You should see webhook processing logs like:

```
[Nest] 12345 - Webhook received: payment_intent.succeeded
[Nest] 12345 - Processing webhook for payment intent: pi_1234567890
[Nest] 12345 - Webhook processed successfully
```

## 🎯 Step 9: Test with Real Payment

### 9.1 Create a Test Payment

Use your Swagger docs at: `https://your-ngrok-url.ngrok-free.app/api/docs`

1. Register a test user
2. Create a payment intent
3. Use Stripe test card numbers:
   - **Success:** `4242424242424242`
   - **Decline:** `4000000000000002`

### 9.2 Verify Webhook Delivery

- Check ngrok interface for webhook calls
- Check application logs for processing
- Check Stripe dashboard webhook logs

## 🔧 Troubleshooting

### Issue: ngrok "Too Many Connections"

**Solution:** You're on the free plan. Upgrade or restart ngrok:

```bash
# Kill existing ngrok
pkill ngrok
# Restart
ngrok http 3000
```

### Issue: Webhook 404 Not Found

**Causes & Solutions:**

1. **Wrong URL:** Ensure `/payments/webhook` is correct
2. **App not running:** Check `docker-compose ps` or local server
3. **Port mismatch:** Verify ngrok is exposing port 3000

### Issue: Webhook Signature Verification Failed

**Causes & Solutions:**

1. **Wrong secret:** Copy the correct `whsec_` from Stripe
2. **Environment not reloaded:** Restart your application
3. **Secret format:** Ensure no extra spaces/quotes

### Issue: ngrok Tunnel Not Starting

**Solutions:**

```bash
# Check if port 3000 is in use
lsof -i :3000

# Try different port
ngrok http 3001

# Check ngrok status
ngrok diagnose
```

## 📝 Development Workflow

### Daily Development Process:

1. Start your app: `docker-compose up -d`
2. Start ngrok: `ngrok http 3000`
3. Copy new ngrok URL (changes every restart)
4. Update Stripe webhook endpoint URL
5. Start developing and testing

### Pro Tips:

- **Subdomain:** Upgrade to ngrok Pro for static subdomains
- **Config file:** Save ngrok config for consistent setup
- **Multiple tunnels:** Run multiple services simultaneously

## 🔒 Security Considerations

### Development Only

- ⚠️ **Never use ngrok tunnels in production**
- ⚠️ **ngrok URLs are public** - anyone can access them
- ⚠️ **Free ngrok URLs change on restart**

### Best Practices:

- Use ngrok only for webhook testing
- Keep ngrok sessions short-lived
- Don't commit ngrok URLs to version control
- Use authentication headers when possible

## 📚 Useful Commands

```bash
# Start ngrok with custom subdomain (Pro only)
ngrok http 3000 --subdomain=myapp-dev

# Start ngrok with basic auth
ngrok http 3000 --basic-auth "username:password"

# Start ngrok with custom region
ngrok http 3000 --region=eu

# View ngrok help
ngrok help

# Check ngrok version
ngrok version

# View active tunnels
ngrok status
```

## 🎉 Success Checklist

- [ ] ✅ ngrok installed and authenticated
- [ ] 🚀 Local app running on port 3000
- [ ] 🌐 ngrok tunnel active and accessible
- [ ] 📊 Stripe webhook endpoint configured
- [ ] 🔑 Webhook secret updated in environment
- [ ] 🔄 Application restarted with new config
- [ ] 🧪 Test webhook successful
- [ ] 📱 Real payment test successful
- [ ] 📊 Logs showing webhook processing

## 📞 Support

If you encounter issues:

1. Check ngrok dashboard: https://dashboard.ngrok.com/
2. Check Stripe webhook logs in dashboard
3. Monitor ngrok web interface: http://127.0.0.1:4040
4. Check application logs for errors

---

**🎯 You're now ready to test Stripe webhooks locally!**

Your Product Inventory Management System can now receive real-time webhook events from Stripe during development.
