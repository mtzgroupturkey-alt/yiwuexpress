-- Ensures a SystemSettings row exists with the default company name.
-- Safe to run multiple times (only inserts when the table is empty).
-- The DB value always takes precedence over the application default.

INSERT INTO system_settings (
  id,
  "companyName",
  "companyAddress",
  "companyPhone",
  "companyEmail",
  "companyWebsite",
  "primaryColor",
  "accentColor",
  "currency",
  "timezone",
  "language",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'Global Trade',
  'Yiwu International Trade City, Yiwu, Zhejiang, China',
  '+86 579 8555 1234',
  'info@yiwuexpress.com',
  'https://yiwuexpress.com',
  '#1a3a5c',
  '#c9a84c',
  'USD',
  'Asia/Shanghai',
  'en',
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM system_settings);
