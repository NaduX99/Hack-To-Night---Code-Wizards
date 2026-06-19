CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'customer',
  full_name VARCHAR(255) NOT NULL,
  nic VARCHAR(50),
  email VARCHAR(255),
  avatar_url VARCHAR(500),
  firebase_uid VARCHAR(128) UNIQUE,
  totp_secret VARCHAR(64),
  totp_enabled TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  account_number VARCHAR(50) UNIQUE NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  branch VARCHAR(255) NOT NULL DEFAULT 'Main Branch',
  balance DECIMAL(14, 2) NOT NULL DEFAULT 100000.00,
  pin VARCHAR(20) NOT NULL DEFAULT '0000',
  CONSTRAINT accounts_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  from_account VARCHAR(50) NOT NULL,
  to_account VARCHAR(50) NOT NULL,
  amount DECIMAL(14, 2) NOT NULL,
  description TEXT,
  purpose VARCHAR(255),
  category VARCHAR(100) NOT NULL DEFAULT 'Transfers',
  status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
  created_by INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event VARCHAR(255) NOT NULL,
  payload JSON NOT NULL DEFAULT (JSON_OBJECT()),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'queued',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bill_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  biller_id VARCHAR(100) NOT NULL,
  biller_name VARCHAR(255) NOT NULL,
  bill_id VARCHAR(100) NOT NULL,
  amount DECIMAL(14, 2) NOT NULL,
  remarks TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  target_amount DECIMAL(14, 2) NOT NULL,
  spent_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  period VARCHAR(50) NOT NULL DEFAULT 'monthly',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS savings_goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  target_amount DECIMAL(14, 2) NOT NULL,
  saved_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  daily_saving_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  deadline DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS beneficiaries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255) NOT NULL DEFAULT 'Nova Bank',
  nickname VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY beneficiaries_user_account_unique (user_id, account_number),
  CONSTRAINT beneficiaries_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO users (id, username, password, role, full_name, nic, email) VALUES
  (1, 'dilara', 'scrypt$dcc8804c37e77542a080cb3fc1e399cc$8da240bc8a1c4e04d57fd5ccb2d544d998fbbdae69cad0398ffbf6e901a1fec630a7616df784d3f9ab5e9ff2489dd0a032238b719e61a0650f117c0024a38267', 'customer', 'Dilara Perera', '200112345678', 'dilara@example.test'),
  (2, 'kasun', 'scrypt$513b1578bc550e3afbdf423201bc06f3$ba0b2ebae298497814dcd249548a7283be019806e35fe9e486c508663cf934ae4778446f8fad4fd8d84528b63227d695f4517691e40a0c436433b92e3d6c403f', 'customer', 'Kasun Wickramanayake', '199812345678', 'kasun@example.test'),
  (3, 'admin', 'scrypt$883ca9e9d99744221f09992f5d9468e2$238b58400fd2860e7aabf1e403da22be61044766ecaa5b30d9581da3a591b08c0334e9b0d826d440f12a910ee333db6d444a454936acddce889998ad329f20db', 'admin', 'Platform Administrator', '000000000000', 'root@example.test')
ON DUPLICATE KEY UPDATE password = VALUES(password);

INSERT INTO accounts (user_id, account_number, account_name, branch, balance, pin) VALUES
  (1, '1000003423', 'Dilara Savings', 'Colombo Main', 100000.00, '1234'),
  (1, '1000004876', 'Dilara Expenses', 'Colombo Main', 42000.00, '1234'),
  (2, '2000006754', 'Kasun Current', 'Kandy', 9870.00, '0000'),
  (3, '9999999999', 'Admin Vault', 'Head Office', 9999999.99, '9999')
ON DUPLICATE KEY UPDATE account_number = account_number;

INSERT INTO transactions (id, from_account, to_account, amount, description, created_by) VALUES
  (1, '1000003423', '2000006754', 4500.00, 'Lunch money', 1),
  (2, '1000004876', '9999999999', 10000.00, 'Totally normal fee', 1),
  (3, '2000006754', '1000003423', 9870.00, 'Refund maybe', 2)
ON DUPLICATE KEY UPDATE id = id;
