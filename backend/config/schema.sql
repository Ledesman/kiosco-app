-- Kiosco Sales Application Database Schema
-- MySQL Database

-- Create database
CREATE DATABASE IF NOT EXISTS kiosco_db2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kiosco_db2;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'cajero') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    sale_type ENUM('unit', 'kg', 'both') NOT NULL DEFAULT 'unit',
    price_per_kg DECIMAL(10,2) NULL,
    stock_quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
    stock_unit ENUM('unit', 'kg') NOT NULL DEFAULT 'unit',
    min_stock_alert DECIMAL(10,3) DEFAULT 0,
    barcode VARCHAR(50) NULL,
    image_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_category (category_id),
    INDEX idx_name (name),
    INDEX idx_barcode (barcode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Promotions table
CREATE TABLE IF NOT EXISTS promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    discount_percentage DECIMAL(5,2) NOT NULL,
    product_id INT NULL,
    category_id INT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_dates (start_date, end_date),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method_efectivo DECIMAL(10,2) DEFAULT 0,
    payment_method_debito DECIMAL(10,2) DEFAULT 0,
    payment_method_credito DECIMAL(10,2) DEFAULT 0,
    payment_method_transferencia DECIMAL(10,2) DEFAULT 0,
    payment_method_mercadopago DECIMAL(10,2) DEFAULT 0,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_user (user_id),
    INDEX idx_date (sale_date),
    INDEX idx_ticket (ticket_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sale items table
CREATE TABLE IF NOT EXISTS sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_type ENUM('unit', 'kg') NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    promotion_id INT NULL,
    discount_applied DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL,
    INDEX idx_sale (sale_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password, role, full_name) VALUES 
('admin', '$2a$10$emnZ5dJy7O.KBG7fF56KtFShMVcZTh2O', 'admin', 'Administrador');

-- Insert sample categories
INSERT INTO categories (name, description) VALUES 
('Bebidas', 'Bebidas frías y calientes'),
('Snacks', 'Papas fritas, galletas y snacks'),
('Golosinas', 'Caramelos, chocolates y dulces'),
('Cigarrillos', 'Cigarrillos y productos de tabaco'),
('Lácteos', 'Leche, yogurt y productos lácteos'),
('Panadería', 'Pan, facturas y productos de panadería'),
('Limpieza', 'Productos de limpieza'),
('Otros', 'Productos varios');
