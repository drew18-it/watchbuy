// WatchBuy Enhanced Notification System
class NotificationSystem {
    constructor() {
        this.container = this.createContainer();
        this.notifications = [];
        this.maxNotifications = 5;
    }

    createContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    show(options) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = 4000,
            showClose = true,
            icon = this.getIcon(type),
            position = 'top-right'
        } = options;

        // Limit number of notifications
        if (this.notifications.length >= this.maxNotifications) {
            this.remove(this.notifications[0]);
        }

        const notification = this.createNotification(type, title, message, showClose, icon);
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }

        // Close button event
        const closeBtn = notification.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.remove(notification));
        }

        // Auto-close on click (for non-error notifications)
        if (type !== 'error') {
            notification.addEventListener('click', () => this.remove(notification));
        }

        return notification;
    }

    getIcon(type) {
        const icons = {
            success: '<i class="bi bi-check-circle-fill"></i>',
            error: '<i class="bi bi-x-circle-fill"></i>',
            warning: '<i class="bi bi-exclamation-triangle-fill"></i>',
            info: '<i class="bi bi-info-circle-fill"></i>',
            loading: '<i class="bi bi-arrow-clockwise spin"></i>'
        };
        return icons[type] || icons.info;
    }

    createNotification(type, title, message, showClose, icon) {
        const notification = document.createElement('div');
        notification.className = `toast toast-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');

        const iconClass = type === 'loading' ? 'toast-icon loading' : 'toast-icon';
        
        const content = `
            <div class="toast-content">
                <div class="${iconClass}">${icon}</div>
                <div class="toast-body">
                    ${title ? `<div class="toast-title">${title}</div>` : ''}
                    ${message ? `<div class="toast-message">${message}</div>` : ''}
                </div>
                ${showClose ? '<button class="toast-close" aria-label="Close"><i class="bi bi-x"></i></button>' : ''}
            </div>
            <div class="toast-progress"></div>
        `;

        notification.innerHTML = content;
        return notification;
    }

    remove(notification) {
        if (notification && notification.parentNode) {
            notification.classList.remove('show');
            notification.classList.add('hide');
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                const index = this.notifications.indexOf(notification);
                if (index > -1) {
                    this.notifications.splice(index, 1);
                }
            }, 300);
        }
    }

    // Convenience methods
    success(title, message, duration = 4000) {
        return this.show({ type: 'success', title, message, duration });
    }
    
    error(title, message, duration = 6000) {
        return this.show({ type: 'error', title, message, duration });
    }
    
    warning(title, message, duration = 5000) {
        return this.show({ type: 'warning', title, message, duration });
    }
    
    info(title, message, duration = 4000) {
        return this.show({ type: 'info', title, message, duration });
    }
    
    loading(title, message = 'Please wait...') {
        return this.show({
            type: 'loading',
            title,
            message,
            duration: 0,
            showClose: false
        });
    }
    
    clearAll() {
        this.notifications.forEach(notification => this.remove(notification));
    }
}

// Global notification instance
window.notify = new NotificationSystem();

// Enhanced fetch with notifications
window.fetchWithNotification = async (url, options = {}, notificationOptions = {}) => {
    const { 
        loadingMessage = 'Processing request...', 
        successMessage = 'Operation completed successfully',
        errorMessage = 'An error occurred',
        showLoading = true,
        showSuccess = true,
        showError = true,
        successDuration = 3000,
        errorDuration = 5000
    } = notificationOptions;

    let loadingNotification = null;
    
    try {
        if (showLoading) {
            loadingNotification = notify.loading('Processing', loadingMessage);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeout);

        if (loadingNotification) {
            notify.remove(loadingNotification);
        }

        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (response.ok) {
            if (showSuccess) {
                notify.success('Success', successMessage, successDuration);
            }
            return data;
        } else {
            if (showError) {
                const errorMsg = data.message || data.error || errorMessage;
                notify.error('Error', errorMsg, errorDuration);
            }
            throw new Error(data.message || data.error || errorMessage);
        }
    } catch (error) {
        if (loadingNotification) {
            notify.remove(loadingNotification);
        }
        
        if (showError) {
            const errorMsg = error.name === 'AbortError' ? 'Request timed out' : (error.message || errorMessage);
            notify.error('Error', errorMsg, errorDuration);
        }
        throw error;
    }
};

// Form submission with notifications
window.submitFormWithNotification = async (formElement, options = {}) => {
    const {
        loadingMessage = 'Submitting form...',
        successMessage = 'Form submitted successfully',
        errorMessage = 'Failed to submit form',
        redirectUrl = null,
        redirectDelay = 1500,
        resetForm = false
    } = options;

    const formData = new FormData(formElement);
    const url = formElement.action || window.location.pathname;
    const method = formElement.method || 'POST';

    try {
        const data = await fetchWithNotification(url, {
            method: method,
            body: formData
        }, {
            loadingMessage,
            successMessage,
            errorMessage
        });

        if (resetForm) {
            formElement.reset();
        }

        if (redirectUrl) {
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, redirectDelay);
        }

        return data;
    } catch (error) {
        console.error('Form submission error:', error);
        return null;
    }
};

// Cart operations with notifications
window.cartOperations = {
    addToCart: async (productId, quantity = 1) => {
        try {
            const data = await fetchWithNotification('/api/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productId, quantity })
            }, {
                loadingMessage: 'Adding to cart...',
                successMessage: 'Item added to cart successfully',
                errorMessage: 'Failed to add item to cart'
            });
            return data;
        } catch (error) {
            return null;
        }
    },

    removeFromCart: async (productId) => {
        try {
            const data = await fetchWithNotification('/api/cart/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productId })
            }, {
                loadingMessage: 'Removing from cart...',
                successMessage: 'Item removed from cart',
                errorMessage: 'Failed to remove item from cart'
            });
            return data;
        } catch (error) {
            return null;
        }
    },

    updateQuantity: async (productId, quantity) => {
        try {
            const data = await fetchWithNotification('/api/cart/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productId, quantity })
            }, {
                loadingMessage: 'Updating cart...',
                successMessage: 'Cart updated successfully',
                errorMessage: 'Failed to update cart'
            });
            return data;
        } catch (error) {
            return null;
        }
    }
};

// Authentication operations with notifications
window.authOperations = {
    login: async (email, password) => {
        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);

            const data = await fetchWithNotification('/login', {
                method: 'POST',
                body: formData
            }, {
                loadingMessage: 'Signing in...',
                successMessage: 'Login successful! Redirecting...',
                errorMessage: 'Invalid email or password',
                redirectUrl: '/'
            });
            return data;
        } catch (error) {
            return null;
        }
    },

    register: async (userData) => {
        try {
            const formData = new FormData();
            Object.keys(userData).forEach(key => {
                formData.append(key, userData[key]);
            });

            const data = await fetchWithNotification('/register', {
                method: 'POST',
                body: formData
            }, {
                loadingMessage: 'Creating account...',
                successMessage: 'Account created successfully! Please login.',
                errorMessage: 'Failed to create account',
                redirectUrl: '/login'
            });
            return data;
        } catch (error) {
            return null;
        }
    },

    logout: async () => {
        try {
            const data = await fetchWithNotification('/logout', {
                method: 'GET'
            }, {
                loadingMessage: 'Signing out...',
                successMessage: 'Logged out successfully',
                errorMessage: 'Failed to logout',
                redirectUrl: '/'
            });
            return data;
        } catch (error) {
            return null;
        }
    }
};

// Admin operations with notifications
window.adminOperations = {
    createProduct: async (productData) => {
        try {
            const data = await fetchWithNotification('/api/admin/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            }, {
                loadingMessage: 'Creating product...',
                successMessage: 'Product created successfully',
                errorMessage: 'Failed to create product'
            });
            return data;
        } catch (error) {
            return null;
        }
    },

    updateProduct: async (productId, productData) => {
        try {
            const data = await fetchWithNotification(`/api/admin/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            }, {
                loadingMessage: 'Updating product...',
                successMessage: 'Product updated successfully',
                errorMessage: 'Failed to update product'
            });
            return data;
        } catch (error) {
            return null;
        }
    },

    deleteProduct: async (productId) => {
        try {
            const data = await fetchWithNotification(`/api/admin/products/${productId}`, {
                method: 'DELETE'
            }, {
                loadingMessage: 'Deleting product...',
                successMessage: 'Product deleted successfully',
                errorMessage: 'Failed to delete product'
            });
            return data;
        } catch (error) {
            return null;
        }
    },

    updateOrderStatus: async (orderId, status) => {
        try {
            const data = await fetchWithNotification(`/api/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            }, {
                loadingMessage: 'Updating order status...',
                successMessage: 'Order status updated successfully',
                errorMessage: 'Failed to update order status'
            });
            return data;
        } catch (error) {
            return null;
        }
    }
};

// Initialize notification system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Show welcome notification on homepage
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        setTimeout(() => {
            notify.info('Welcome to WatchBuy', 'Discover our premium collection of luxury timepieces');
        }, 1000);
    }

    // Add global error handler
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error);
        notify.error('System Error', 'An unexpected error occurred. Please refresh the page.');
    });

    // Add unhandled promise rejection handler
    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled promise rejection:', e.reason);
        notify.error('Network Error', 'A network error occurred. Please check your connection.');
    });
}); 