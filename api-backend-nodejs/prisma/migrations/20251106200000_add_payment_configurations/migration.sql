-- Insert new payment configuration settings
-- This migration adds the payment configurations that were added to systemConfigDefinitions.ts
-- Note: The system_configs table only has: id, key, value, options, createdAt, updatedAt

-- Remove duplicate payment_required_booking configuration (keep payment_required_for_booking)
DELETE FROM "system_configs" WHERE "key" = 'payment_required_booking';

-- Insert Payment Timeout configuration (only if it doesn't exist)
INSERT INTO "system_configs" ("id", "key", "value", "options", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  'payment_timeout_minutes',
  '15',
  null,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "system_configs" WHERE "key" = 'payment_timeout_minutes'
);

-- Update existing supported_payment_methods configuration with new options
UPDATE "system_configs"
SET
  "value" = '["razorpay", "cash"]',
  "options" = '[{"value":"razorpay","label":"Razorpay (Online)"},{"value":"cash","label":"Cash on Service"},{"value":"upi","label":"UPI"},{"value":"card","label":"Credit/Debit Card"}]',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'supported_payment_methods';
