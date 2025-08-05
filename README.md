# WatchBuy - Premium Watch E-commerce Platform

A full-stack e-commerce web application for selling premium watches, built with Node.js, Express, MySQL, and Bootstrap.

## 🚀 Features

### Customer Features
- **User Authentication**: Secure login/register system with bcrypt password hashing
- **Product Browsing**: Browse watches by category with search functionality
- **Shopping Cart**: Add/remove items with quantity management
- **Order Management**: View order history and track order status
- **Product Reviews**: Rate and review purchased products
- **Responsive Design**: Mobile-friendly interface using Bootstrap 5

### Admin Features
- **Dashboard**: Real-time statistics and sales analytics
- **Product Management**: Add, edit, delete products with image upload
- **Category Management**: Organize products by categories
- **Order Management**: Process orders and update status
- **User Management**: View and manage customer accounts
- **Review Management**: Moderate customer reviews

### Technical Features
- **Session Management**: Secure user sessions with express-session
- **File Upload**: Product image upload with Multer
- **Email Notifications**: Order confirmations and receipts
- **PDF Generation**: Automatic receipt generation
- **Database**: MySQL with proper relationships and constraints

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Authentication**: bcrypt, express-session
- **File Upload**: Multer
- **Email**: Nodemailer
- **PDF**: PDFKit

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd watchbuy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   - Create a MySQL database named `watchbuy`
   - Update database configuration in `config/db.js` if needed
   - Run the following SQL commands to create tables:

   ```sql
   -- Users table
   CREATE TABLE users (
     id INT AUTO_INCREMENT PRIMARY KEY,
     fname VARCHAR(50) NOT NULL,
     lname VARCHAR(50) NOT NULL,
     email VARCHAR(100) UNIQUE NOT NULL,
     password VARCHAR(255) NOT NULL,
     role ENUM('user', 'admin') DEFAULT 'user',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Categories table
   CREATE TABLE categories (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(100) NOT NULL,
     description TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Products table
   CREATE TABLE products (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(200) NOT NULL,
     description TEXT,
     price DECIMAL(10,2) DEFAULT 0.00,
     quantity INT DEFAULT 0,
     category_id INT,
     img_path VARCHAR(255),
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
   );

   -- Cart table
   CREATE TABLE cart (
     id INT AUTO_INCREMENT PRIMARY KEY,
     user_id INT NOT NULL,
     product_id INT NOT NULL,
     quantity INT DEFAULT 1,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
     FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
     UNIQUE KEY unique_user_product (user_id, product_id)
   );

   -- Orders table
   CREATE TABLE orders (
     id INT AUTO_INCREMENT PRIMARY KEY,
     user_id INT NOT NULL,
     status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'paid') DEFAULT 'pending',
     total_amount DECIMAL(10,2) DEFAULT 0.00,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
   );

   -- Order items table
   CREATE TABLE order_items (
     id INT AUTO_INCREMENT PRIMARY KEY,
     order_id INT NOT NULL,
     product_id INT NOT NULL,
     quantity INT NOT NULL,
     price DECIMAL(10,2) NOT NULL,
     FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
     FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
   );

   -- Reviews table
   CREATE TABLE reviews (
     id INT AUTO_INCREMENT PRIMARY KEY,
     product_id INT NOT NULL,
     user_id INT NOT NULL,
     rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
     comment TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
     UNIQUE KEY unique_user_product_review (user_id, product_id)
   );

   -- Create indexes for better performance
   CREATE INDEX idx_reviews_product_id ON reviews(product_id);
   CREATE INDEX idx_reviews_user_id ON reviews(user_id);
   ```

4. **Create uploads directory**
   ```bash
   mkdir -p public/uploads
   ```

5. **Start the application**
   ```bash
   npm start
   ```

6. **Access the application**
   - Open your browser and go to `http://localhost:3000`
   - For admin access, register a user and manually update the role to 'admin' in the database

## 📁 Project Structure

```
watchbuy/
├── config/
│   └── db.js                 # Database configuration
├── routes/
│   ├── admin.js              # Admin routes
│   ├── cart.js               # Cart management
│   ├── categories.js         # Category management
│   ├── checkout.js           # Checkout process
│   ├── orders.js             # Order management
│   ├── products.js           # Product management
│   ├── profile.js            # User profile
│   ├── reviews.js            # Review system
│   ├── search.js             # Search functionality
│   └── users.js              # User authentication
├── views/
│   ├── admin-*.html          # Admin pages
│   ├── cart.html             # Shopping cart
│   ├── index.html            # Homepage
│   ├── login.html            # Login page
│   ├── orders.html           # Order history
│   ├── product.html          # Product details
│   ├── profile.html          # User profile
│   ├── register.html         # Registration
│   └── shop.html             # Product catalog
├── public/
│   ├── css/
│   ├── js/
│   └── uploads/              # Product images
├── receipts/                 # Generated PDF receipts
├── server.js                 # Main application file
└── package.json
```

## 🔧 Configuration

### Database Configuration
Update `config/db.js` with your MySQL credentials:
```javascript
const pool = mysql.createPool({
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'watchbuy',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

### Email Configuration
Update email settings in the checkout and orders routes for order notifications.

## 🚀 Usage

### Customer Flow
1. Register/Login to your account
2. Browse products in the shop
3. Add items to cart
4. Proceed to checkout
5. Complete order and receive confirmation
6. Review purchased products

### Admin Flow
1. Login with admin credentials
2. Access admin dashboard
3. Manage products, categories, orders, and users
4. View analytics and sales reports

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure MySQL is running
   - Check database credentials in `config/db.js`
   - Verify database `watchbuy` exists

2. **Image Upload Issues**
   - Ensure `public/uploads` directory exists
   - Check file permissions
   - Verify Multer configuration

3. **Session Issues**
   - Clear browser cookies
   - Check session secret in `server.js`

4. **Email Notifications**
   - Update email credentials in checkout/orders routes
   - Check SMTP settings

## 📝 API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /login` - User login
- `GET /logout` - User logout

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add item to cart
- `DELETE /api/cart/:id` - Remove item from cart

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/checkout` - Create order
- `PUT /api/orders/:id/complete` - Mark order as paid

### Reviews
- `GET /api/reviews/product/:id` - Get product reviews
- `POST /api/reviews` - Add review
- `GET /api/reviews/stats/:id` - Get review statistics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 👥 Team

- **WatchBuy Team** - Development and Design

## 📞 Support

For support and questions, please contact:
- Email: support@watchbuy.com
- Phone: +63 912 345 6789

---

**WatchBuy** - Premium Watches, Premium Experience
 
