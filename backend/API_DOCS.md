# Kiosco API Documentation

## Base URL
`http://localhost:5000/api`

## Authentication
- `POST /auth/login`: Login and receive JWT.
- `POST /auth/register`: Register a new user (Admin only).

## Products
- `GET /products`: List all products.
- `GET /products/:id`: Get product details.
- `POST /products`: Create a new product.
- `PUT /products/:id`: Update a product.
- `DELETE /products/:id`: Delete a product.

## Categories
- `GET /categories`: List all categories.
- `POST /categories`: Create a new category.

## Sales
- `GET /sales`: List all sales.
- `POST /sales`: Register a new sale.
- `GET /sales/:id`: Get sale details (including items).
- `PATCH /sales/:id/payment`: Update payment methods for an existing sale.
  - **Body**: `{ payment_methods: {...}, payment_note: string, reason?: string }`
  - **Response**: `{ sale: {...}, message: string }`
  - **Notes**: Creates audit record in `sale_payment_changes` table.
- `GET /sales/:id/payment-history`: Get payment change history for a sale.
  - **Response**: `{ payment_changes: [...] }`
- `GET /sales/ticket/:ticketNumber`: Get sale by ticket number.

## Promotions
- `GET /promotions`: List all active promotions.
- `POST /promotions`: Create a new promotion.

## Reports
- `GET /reports/daily`: Daily sales report.
- `GET /reports/monthly`: Monthly sales report.
- `GET /reports/stock-alerts`: Products with low stock.

## Planned Endpoints (Coming Soon)
- `GET /expenses`: List all expenses.
- `POST /expenses`: Register a new expense.
- `GET /suppliers`: List all suppliers.
- `POST /suppliers`: Register a new supplier.
- `GET /reports/daily-closing`: Summary of sales vs expenses.
