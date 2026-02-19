-- Migration: Add payment changes audit table
-- Description: Create table to track all payment method changes for audit trail

CREATE TABLE IF NOT EXISTS sale_payment_changes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    user_id INT NOT NULL,
    old_payment_methods JSON NOT NULL,
    new_payment_methods JSON NOT NULL,
    payment_note TEXT,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_sale (sale_id),
    INDEX idx_user (user_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modify sales table to add payment_note if not exists
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_note TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_methods_json JSON;
