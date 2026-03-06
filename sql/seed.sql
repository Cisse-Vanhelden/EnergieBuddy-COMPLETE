INSERT INTO users (email, password_hash, display_name, is_demo)
VALUES ('demo@energiebuddy.app', 'REPLACE_WITH_BCRYPT_HASH', 'Demo User', 1);

INSERT INTO profiles (user_id, household_size, home_type, city, bio)
SELECT id, 2, 'Apartment', 'Brussel', 'Voorbeeldaccount met demo gegevens'
FROM users
WHERE email = 'demo@energiebuddy.app';

INSERT INTO devices (user_id, name, category, wattage, hours_per_day)
SELECT id, 'Koelkast', 'Keuken', 150, 24 FROM users WHERE email = 'demo@energiebuddy.app'
UNION ALL
SELECT id, 'Televisie', 'Entertainment', 100, 4 FROM users WHERE email = 'demo@energiebuddy.app'
UNION ALL
SELECT id, 'Laptop', 'Werk', 65, 6 FROM users WHERE email = 'demo@energiebuddy.app'
UNION ALL
SELECT id, 'Wasmachine', 'Huishouden', 2000, 1.2 FROM users WHERE email = 'demo@energiebuddy.app';

INSERT INTO energy_entries (user_id, entry_date, kwh_used, cost_eur, notes)
SELECT id, CURDATE() - INTERVAL 3 DAY, 8.10, 2.91, 'Rustige dag' FROM users WHERE email = 'demo@energiebuddy.app'
UNION ALL
SELECT id, CURDATE() - INTERVAL 2 DAY, 7.40, 2.66, 'Goede score' FROM users WHERE email = 'demo@energiebuddy.app'
UNION ALL
SELECT id, CURDATE() - INTERVAL 1 DAY, 9.20, 3.31, 'Wasmachine gebruikt' FROM users WHERE email = 'demo@energiebuddy.app'
UNION ALL
SELECT id, CURDATE(), 6.80, 2.45, 'Heel zuinige dag' FROM users WHERE email = 'demo@energiebuddy.app';

INSERT INTO scores (user_id, daily_score, weekly_score, monthly_score, total_points)
SELECT id, 86, 540, 2140, 5680
FROM users
WHERE email = 'demo@energiebuddy.app';
