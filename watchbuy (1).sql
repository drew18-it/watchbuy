-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 05, 2025 at 08:08 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `watchbuy`
--

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`) VALUES
(15, 'Rolex 2025'),
(16, 'Citizen 2025'),
(17, 'Limited Edition 2025'),
(19, 'Sports Watch'),
(22, 'Sports Watches');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','paid','shipped','cancelled') NOT NULL DEFAULT 'pending',
  `total_amount` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `created_at`, `status`, `total_amount`) VALUES
(24, 7, '2025-07-29 01:15:06', 'paid', 0.00),
(26, 7, '2025-07-29 02:35:04', 'paid', 0.00),
(27, 8, '2025-07-29 13:00:17', 'paid', 0.00),
(30, 10, '2025-08-01 02:42:31', 'paid', 0.00),
(31, 7, '2025-08-01 08:20:19', 'paid', 0.00),
(32, 7, '2025-08-01 08:21:15', 'paid', 0.00),
(33, 10, '2025-08-01 08:47:05', 'paid', 0.00),
(34, 10, '2025-08-01 09:06:17', 'paid', 0.00),
(35, 10, '2025-08-01 09:14:15', 'paid', 0.00),
(36, 7, '2025-08-04 03:44:54', 'paid', 0.00),
(37, 10, '2025-08-04 03:48:27', 'paid', 0.00),
(38, 10, '2025-08-04 14:24:06', 'paid', 0.00),
(39, 10, '2025-08-04 14:36:55', 'paid', 0.00),
(40, 10, '2025-08-04 14:44:58', 'paid', 0.00),
(41, 10, '2025-08-05 01:05:00', 'paid', 78000.00),
(42, 10, '2025-08-05 03:25:53', 'paid', 163500.00),
(43, 10, '2025-08-05 04:38:34', 'paid', 300000.00),
(44, 10, '2025-08-05 04:48:38', 'paid', 15000.00),
(45, 10, '2025-08-05 04:57:52', 'paid', 480000.00);

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`) VALUES
(25, 24, 7, 1),
(28, 27, 19, 1),
(32, 30, 19, 3),
(33, 31, 7, 16),
(34, 32, 19, 1),
(35, 33, 19, 12),
(36, 33, 21, 15),
(37, 34, 19, 1),
(38, 35, 19, 12),
(39, 36, 7, 21),
(40, 37, 7, 5),
(41, 37, 21, 1),
(42, 37, 24, 1),
(43, 38, 7, 24),
(45, 40, 21, 14),
(47, 42, 7, 1),
(48, 42, 19, 1),
(49, 42, 21, 1),
(50, 42, 23, 1),
(51, 42, 24, 1),
(52, 42, 27, 2),
(53, 42, 28, 1),
(54, 43, 7, 15),
(55, 44, 19, 1),
(56, 45, 7, 24);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `quantity` int(11) DEFAULT 0,
  `category_id` int(11) DEFAULT NULL,
  `img_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `price` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `quantity`, `category_id`, `img_path`, `created_at`, `updated_at`, `price`) VALUES
(7, 'Rolex Daydate', 'Good Looking Watch', 160, 15, '/uploads/1753751405450-daydate.jpg', '2025-07-29 01:10:05', '2025-08-05 04:57:48', 20000.00),
(19, 'Rolex Batman and Batgirl', 'Good Looking Watch For Men', 48, 15, '/uploads/1754034660720-batman.jpg', '2025-07-29 01:35:30', '2025-08-05 04:48:33', 15000.00),
(21, 'Citizen', 'Good Looking Watch', 99, 16, '/uploads/1753794414427-citizen.jpg', '2025-07-29 13:06:54', '2025-08-05 02:51:20', 25000.00),
(23, 'Rolex Deep Sea Explorer', 'Good Looking Watch For Men', 64, 15, '/uploads/1754021968507-deep.jpg', '2025-08-01 04:19:28', '2025-08-05 02:51:29', 12000.00),
(24, 'Seiko Snowscape', 'Exclusive Watch', 54, 17, '/uploads/1754022203869-seiko snowscape.jpg', '2025-08-01 04:23:23', '2025-08-05 02:51:36', 9000.00),
(27, 'Rolex DateJust', 'Good Looking Watch For Men', 248, 17, NULL, '2025-08-05 02:54:48', '2025-08-05 03:18:49', 40000.00),
(28, 'Sport Pro', 'For Sports and Outside Activities', 1499, 19, NULL, '2025-08-05 02:55:30', '2025-08-05 02:56:07', 2500.00);

-- --------------------------------------------------------

--
-- Table structure for table `product_images`
--

CREATE TABLE `product_images` (
  `id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `img_path` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `img_path`) VALUES
(9, 7, '/uploads/1754038739535-daydate.jpg'),
(10, 19, '/uploads/1754038755145-batgirl.jpg'),
(11, 19, '/uploads/1754038755146-batman.jpg'),
(13, 23, '/uploads/1754038778949-deep.jpg'),
(14, 24, '/uploads/1754038790598-seiko snowscape.jpg'),
(17, 21, '/uploads/1754317711246-citizen.jpg'),
(22, 27, '/uploads/1754363865842-HERO-Rolex-Datejust-Palm-Dial-126234-scaled.jpg'),
(23, 28, '/uploads/1754363879767-Sport Pro.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `product_id`, `user_id`, `rating`, `comment`, `created_at`) VALUES
(8, 7, 10, 5, 'solid watches!', '2025-08-05 04:59:50');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `fname` varchar(100) NOT NULL,
  `lname` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `img_path` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `role` enum('customer','admin') DEFAULT 'customer',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `fname`, `lname`, `email`, `password`, `img_path`, `status`, `role`, `created_at`, `updated_at`) VALUES
(7, 'Deannuel', 'Cortez', 'drew123@gmail.com', '$2b$10$JNagxV.0hnGH9JBYt8lqW.rVMNWUkCE25z/lxQIi3AyKubJG18D4S', '/uploads/1754316127446-338216892.jpg', 'active', 'admin', '2025-07-29 01:14:44', '2025-08-04 14:25:58'),
(8, 'cyril', 'palma', 'cyrilmae11@gmail.com', '$2b$10$rT/uJCHyaKhT/km3VBSKJekyPqIif.m.HmOV5OVBcx6eF41H3rXNW', '/uploads/img_path-1753793995629-396885729.jpg', 'active', 'customer', '2025-07-29 12:59:55', '2025-07-29 12:59:55'),
(10, 'Deannuel', 'Cortez', 'cortezdrew454@gmail.com', '$2b$10$OQNl7hv6PfFtwOGuuWTATef7Lbvs4A4aJpUOKzjfONWUNFYhIQq7W', '/uploads/1754368151631-323536225.jpg', 'active', 'customer', '2025-08-01 02:39:41', '2025-08-05 04:29:11'),
(11, 'cyril', 'palma', 'cyril@gmail.com', '$2b$10$wByTv9vyswwMJZ/f6KOk0ey3OIyRetUNtwdtKglyhatmUSRO3qFpG', '/uploads/img_path-1754316825171-906277471.jpg', 'active', 'customer', '2025-08-04 14:13:45', '2025-08-04 14:13:45'),
(12, 'Drew', 'Cortez', 'drew@gmail.com', '$2b$10$ozF0UzlgQiAlr0Cvn2GwsuR7G4J3oP0oSc.vkx8lllIlWRjGMwoI6', '/uploads/img_path-1754318159188-74136618.jpg', 'active', 'admin', '2025-08-04 14:35:59', '2025-08-04 14:37:40'),
(13, 'Admin', 'User', 'admin@watchbuy.com', '$2b$10$lNpFCx/B.jzc.Li45u1hj.IM6LB4B7snXgYWnNMNo5UFT.2MH/DvW', NULL, 'active', 'admin', '2025-08-05 02:48:47', '2025-08-05 02:48:47');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_cart` (`user_id`,`product_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `idx_cart_user_id` (`user_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_orders_user_id` (`user_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `idx_products_category_id` (`category_id`);

--
-- Indexes for table `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_product_review` (`user_id`,`product_id`),
  ADD KEY `idx_reviews_product_id` (`product_id`),
  ADD KEY `idx_reviews_user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=87;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
