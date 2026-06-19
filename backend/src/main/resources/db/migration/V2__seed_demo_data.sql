-- ============================================================
-- V2: Demo seed data (development / staging only)
-- Auth0 sub values below are placeholders – they will be
-- replaced by real subs on first login via POST /api/v1/users/me
-- ============================================================

INSERT INTO users (auth0_sub, email, full_name)
VALUES
    ('auth0|demo-user-001', 'dilara@novabank.demo', 'Dilara Perera'),
    ('auth0|demo-user-002', 'kasun@novabank.demo',  'Kasun Wickramasinghe')
ON CONFLICT (auth0_sub) DO NOTHING;

INSERT INTO accounts (user_id, account_number, account_name, account_type, balance)
VALUES
    (1, 'NB-001-00100001', 'Primary Savings',   'SAVINGS', 250000.00),
    (1, 'NB-001-00100002', 'Daily Current',     'CURRENT',  45000.00),
    (2, 'NB-002-00200001', 'Kasun Savings',     'SAVINGS', 120000.00)
ON CONFLICT (account_number) DO NOTHING;

INSERT INTO transactions (from_account_id, to_account_id, amount, description, reference_number, status, created_by_user_id)
VALUES
    (1, 2, 5000.00, 'Utility payment',  'NB-SEED-0001', 'SUCCESS', 1),
    (1, 3, 10000.00, 'Loan repayment',  'NB-SEED-0002', 'SUCCESS', 1),
    (2, 1, 2500.00,  'Salary deposit',  'NB-SEED-0003', 'SUCCESS', 2)
ON CONFLICT (reference_number) DO NOTHING;
