USE kiosco_db2;

INSERT INTO products (name, category_id, price, sale_type, stock_quantity, stock_unit, min_stock_alert, barcode) VALUES
('Coca Cola 500ml', 1, 1500.00, 'unit', 100, 'unit', 10, '7790070411335'),
('Pepsi 500ml', 1, 1400.00, 'unit', 80, 'unit', 10, '7790070411336'),
('Papas Lay\'s Clásicas 150g', 2, 2200.00, 'unit', 50, 'unit', 5, '7790070411337'),
('Alfajor Jorgito Chocolate', 3, 800.00, 'unit', 120, 'unit', 20, '7790070411338'),
('Caramelos Sugus (Bolsa)', 3, 1200.00, 'unit', 40, 'unit', 5, '7790070411339'),
('Marlboro Box 20', 4, 3500.00, 'unit', 60, 'unit', 10, '7790070411340'),
('Leche La Serenísima 1L', 5, 1300.00, 'unit', 45, 'unit', 10, '7790070411341'),
('Pan de Molde Blanco', 6, 2500.00, 'unit', 30, 'unit', 5, '7790070411342'),
('Detergente Magistral 500ml', 7, 1800.00, 'unit', 25, 'unit', 5, '7790070411343'),
('Encendedor Bic Grande', 8, 1100.00, 'unit', 100, 'unit', 10, '7790070411344');
