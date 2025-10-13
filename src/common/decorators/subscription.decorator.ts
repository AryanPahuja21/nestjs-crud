import { SetMetadata } from '@nestjs/common';

export const SUBSCRIPTION_STATUS_KEY = 'subscriptionStatus';

/**
 * Decorator to require specific subscription status
 * @param statuses - Array of allowed subscription statuses
 */
export const RequireSubscription = (...statuses: string[]) =>
  SetMetadata(SUBSCRIPTION_STATUS_KEY, statuses);

/**
 * Decorator to require active subscription
 */
export const RequireActiveSubscription = () => RequireSubscription('active', 'trialing');
