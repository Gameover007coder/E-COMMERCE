// ========== PRODUCT DATABASE ==========
const productsDB = [
    { id: 1, name: "MacBook Pro 14", category: "Electronics", price: 149900, originalPrice: 169900, rating: 4.8, stock: 12, icon: "💻", discount: 12 },
    { id: 2, name: "iPhone 15 Pro", category: "Electronics", price: 129900, originalPrice: 139900, rating: 4.9, stock: 25, icon: "📱", discount: 7 },
    { id: 3, name: "Sony WH-1000XM5", category: "Electronics", price: 29990, originalPrice: 34990, rating: 4.7, stock: 18, icon: "🎧", discount: 14 },
    { id: 4, name: "Nike Air Max", category: "Fashion", price: 8999, originalPrice: 12999, rating: 4.5, stock: 30, icon: "👟", discount: 31 },
    { id: 5, name: "Levi's Jeans", category: "Fashion", price: 2999, originalPrice: 4999, rating: 4.3, stock: 45, icon: "👖", discount: 40 },
    { id: 6, name: "Smart Watch", category: "Electronics", price: 19999, originalPrice: 24999, rating: 4.4, stock: 15, icon: "⌚", discount: 20 },
    { id: 7, name: "Samsung TV 55\"", category: "Electronics", price: 54999, originalPrice: 69999, rating: 4.6, stock: 8, icon: "📺", discount: 21 },
    { id: 8, name: "Dyson Vacuum", category: "Home", price: 39990, originalPrice: 49990, rating: 4.7, stock: 6, icon: "🧹", discount: 20 },
    { id: 9, name: "Coffee Maker", category: "Home", price: 5999, originalPrice: 8999, rating: 4.2, stock: 20, icon: "☕", discount: 33 },
    { id: 10, name: "Yoga Mat", category: "Sports", price: 1499, originalPrice: 2499, rating: 4.4, stock: 50, icon: "🧘", discount: 40 },
    { id: 11, name: "Fiction Novel", category: "Books", price: 499, originalPrice: 799, rating: 4.6, stock: 100, icon: "📚", discount: 38 },
    { id: 12, name: "Gaming Chair", category: "Home", price: 15999, originalPrice: 22999, rating: 4.5, stock: 10, icon: "💺", discount: 30 },
    { id: 13, name: "Wireless Mouse", category: "Electronics", price: 1999, originalPrice: 3499, rating: 4.3, stock: 60, icon: "🖱️", discount: 43 },
    { id: 14, name: "Backpack", category: "Fashion", price: 2499, originalPrice: 3999, rating: 4.4, stock: 35, icon: "🎒", discount: 38 },
    { id: 15, name: "Fitness Tracker", category: "Sports", price: 3999, originalPrice: 5999, rating: 4.2, stock: 28, icon: "🏃", discount: 33 }
];

// ========== OOP CLASSES ==========
class Product {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.category = data.category;
        this.price = data.price;
        this.originalPrice = data.originalPrice;
        this.rating = data.rating;
        this._stock = data.stock;
        this.icon = data.icon;
        this.discount = data.discount;
    }

    getStock() { return this._stock; }
    reduceStock(qty) { if (qty <= this._stock) { this._stock -= qty; return true; } return false; }
    increaseStock(qty) { this._stock += qty; }
}

class CartItem {
    constructor(product, quantity) {
        this.product = product;
        this.quantity = quantity;
    }
    getSubtotal() { return this.product.price * this.quantity; }
}

class ShoppingCart {
    constructor() {
        this.items = new Map();
    }
    
    addItem(product, quantity) {
        if (product.getStock() >= quantity) {
            if (this.items.has(product.id)) {
                const existing = this.items.get(product.id);
                const newQty = existing.quantity + quantity;
                if (product.getStock() >= newQty) {
                    existing.quantity = newQty;
                } else return false;
            } else {
                this.items.set(product.id, new CartItem(product, quantity));
            }
            product.reduceStock(quantity);
            return true;
        }
        return false;
    }
    
    removeItem(productId) {
        const item = this.items.get(productId);
        if (item) {
            item.product.increaseStock(item.quantity);
            this.items.delete(productId);
        }
    }
    
    updateQuantity(productId, quantity) {
        const item = this.items.get(productId);
        if (item && quantity > 0) {
            const diff = quantity - item.quantity;
            if (diff > 0 && item.product.getStock() >= diff) {
                item.product.reduceStock(diff);
                item.quantity = quantity;
                return true;
            } else if (diff < 0) {
                item.product.increaseStock(-diff);
                item.quantity = quantity;
                return true;
            }
        } else if (quantity === 0) {
            this.removeItem(productId);
            return true;
        }
        return false;
    }
    
    getTotal() {
        let total = 0;
        for (const item of this.items.values()) total += item.getSubtotal();
        return total;
    }
    
    getItemCount() {
        let count = 0;
        for (const item of this.items.values()) count += item.quantity;
        return count;
    }
    
    clear() { this.items.clear(); }
    getItems() { return Array.from(this.items.values()); }
}

class Wishlist {
    constructor() {
        this.items = new Map();
    }
    
    addItem(product) {
        if (!this.items.has(product.id)) {
            this.items.set(product.id, product);
            return true;
        }
        return false;
    }
    
    removeItem(productId) { this.items.delete(productId); }
    getItems() { return Array.from(this.items.values()); }
    getItemCount() { return this.items.size; }
}

class Order {
    static nextOrderId = 1000;
    
    constructor(customer, items, total, paymentMethod) {
        this.orderId = Order.nextOrderId++;
        this.customer = { ...customer };
        this.items = items.map(item => ({ name: item.product.name, quantity: item.quantity, price: item.product.price }));
        this.total = total;
        this.paymentMethod = paymentMethod;
        this.status = "Confirmed";
        this.date = new Date();
    }
}

// ========== E-COMMERCE APP ==========
class ECommerceApp {
    constructor() {
        this.products = productsDB.map(p => new Product(p));
        this.cart = new ShoppingCart();
        this.wishlist = new Wishlist();
        this.orders = [];
        this.currentUser = null;
        this.currentCategory = "all";
        this.currentFilters = { priceMax: 50000, ratings: [], inStockOnly: false };
        this.init();
    }
    
    init() {
        this.renderProducts();
        this.setupEventListeners();
    }
    
    getProducts() {
        let filtered = [...this.products];
        
        // Category filter
        if (this.currentCategory !== "all") {
            filtered = filtered.filter(p => p.category === this.currentCategory);
        }
        
        // Price filter
        filtered = filtered.filter(p => p.price <= this.currentFilters.priceMax);
        
        // Rating filter
        if (this.currentFilters.ratings.length > 0) {
            const minRating = Math.min(...this.currentFilters.ratings);
            filtered = filtered.filter(p => p.rating >= minRating);
        }
        
        // Stock filter
        if (this.currentFilters.inStockOnly) {
            filtered = filtered.filter(p => p.getStock() > 0);
        }
        
        // Search filter
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
        }
        
        // Sort
        const sortBy = document.getElementById('sortSelect')?.value;
        if (sortBy === 'priceLow') filtered.sort((a,b) => a.price - b.price);
        if (sortBy === 'priceHigh') filtered.sort((a,b) => b.price - a.price);
        if (sortBy === 'rating') filtered.sort((a,b) => b.rating - a.rating);
        
        return filtered;
    }
    
    renderProducts() {
        const container = document.getElementById('productsContainer');
        if (!container) return;
        
        const products = this.getProducts();
        
        if (products.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:2rem;">No products found</div>';
            return;
        }
        
        container.innerHTML = products.map(product => `
            <div class="product-card">
                ${product.discount > 0 ? `<div class="product-badge">-${product.discount}%</div>` : ''}
                <div class="product-image">
                    ${product.icon}
                    <div class="wishlist-icon ${this.wishlist.items.has(product.id) ? 'active' : ''}" onclick="app.toggleWishlist(${product.id}); event.stopPropagation();">
                        <i class="fas fa-heart"></i>
                    </div>
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="product-category">${product.category}</div>
                    <div class="product-rating">
                        ${this.renderStars(product.rating)} (${product.rating})
                    </div>
                    <div class="product-price">
                        ₹${product.price.toLocaleString()}
                        ${product.originalPrice > product.price ? `<span class="original-price">₹${product.originalPrice.toLocaleString()}</span>` : ''}
                    </div>
                    <div class="product-stock ${product.getStock() > 0 ? 'in-stock' : 'out-stock'}">
                        ${product.getStock() > 0 ? `In Stock: ${product.getStock()}` : 'Out of Stock'}
                    </div>
                    <button class="add-to-cart" onclick="app.addToCart(${product.id}, 1)" ${product.getStock() === 0 ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '';
        for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
        if (hasHalfStar) stars += '<i class="fas fa-star-half-alt"></i>';
        for (let i = stars.length/2; i < 5; i++) stars += '<i class="far fa-star"></i>';
        return stars;
    }
    
    renderCart() {
        const container = document.getElementById('cartItems');
        const subtotalEl = document.getElementById('cartSubtotal');
        const totalEl = document.getElementById('cartTotal');
        const countEl = document.getElementById('cartCount');
        
        if (!container) return;
        
        const items = this.cart.getItems();
        
        if (items.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:2rem; color:#999;">Your cart is empty</div>';
            if (subtotalEl) subtotalEl.innerText = '₹0';
            if (totalEl) totalEl.innerText = '₹0';
            if (countEl) countEl.innerText = '0';
            return;
        }
        
        container.innerHTML = items.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">${item.product.icon}</div>
                <div class="cart-item-details">
                    <h4>${item.product.name}</h4>
                    <div class="cart-item-price">₹${item.product.price.toLocaleString()}</div>
                    <div class="cart-item-actions">
                        <button class="quantity-btn" onclick="app.updateCartQuantity(${item.product.id}, ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="app.updateCartQuantity(${item.product.id}, ${item.quantity + 1})">+</button>
                        <button class="remove-btn" onclick="app.removeFromCart(${item.product.id})">Remove</button>
                    </div>
                </div>
                <div style="font-weight: bold;">₹${item.getSubtotal().toLocaleString()}</div>
            </div>
        `).join('');
        
        const subtotal = this.cart.getTotal();
        const shipping = subtotal > 999 ? 0 : 99;
        const total = subtotal + shipping;
        
        if (subtotalEl) subtotalEl.innerText = `₹${subtotal.toLocaleString()}`;
        if (totalEl) totalEl.innerText = `₹${total.toLocaleString()}`;
        if (countEl) countEl.innerText = this.cart.getItemCount();
        document.getElementById('shippingCost').innerText = shipping === 0 ? 'Free' : `₹${shipping}`;
    }
    
    renderWishlist() {
        const container = document.getElementById('wishlistItems');
        const countEl = document.getElementById('wishlistCount');
        
        if (!container) return;
        
        const items = this.wishlist.getItems();
        
        if (items.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:2rem; color:#999;">Your wishlist is empty</div>';
            if (countEl) countEl.innerText = '0';
            return;
        }
        
        container.innerHTML = items.map(product => `
            <div class="cart-item">
                <div class="cart-item-image">${product.icon}</div>
                <div class="cart-item-details">
                    <h4>${product.name}</h4>
                    <div class="cart-item-price">₹${product.price.toLocaleString()}</div>
                    <button class="add-to-cart" style="margin-top: 0.5rem;" onclick="app.addToCart(${product.id}, 1); app.toggleWishlist(${product.id});">
                        Move to Cart
                    </button>
                </div>
                <button class="remove-btn" onclick="app.toggleWishlist(${product.id})">Remove</button>
            </div>
        `).join('');
        
        if (countEl) countEl.innerText = items.length;
    }
    
    addToCart(productId, quantity) {
        const product = this.products.find(p => p.id === productId);
        if (product && this.cart.addItem(product, quantity)) {
            this.showToast('Added to cart!', 'success');
            this.renderCart();
            this.renderProducts();
        } else {
            this.showToast('Insufficient stock!', 'error');
        }
    }
    
    removeFromCart(productId) {
        this.cart.removeItem(productId);
        this.renderCart();
        this.renderProducts();
        this.showToast('Removed from cart', 'info');
    }
    
    updateCartQuantity(productId, quantity) {
        if (quantity === 0) {
            this.removeFromCart(productId);
        } else {
            this.cart.updateQuantity(productId, quantity);
            this.renderCart();
            this.renderProducts();
        }
    }
    
    toggleWishlist(productId) {
        const product = this.products.find(p => p.id === productId);
        if (this.wishlist.items.has(productId)) {
            this.wishlist.removeItem(productId);
            this.showToast('Removed from wishlist', 'info');
        } else {
            this.wishlist.addItem(product);
            this.showToast('Added to wishlist!', 'success');
        }
        this.renderWishlist();
        this.renderProducts();
    }
    
    createOrder(shippingInfo, paymentMethodType) {
        if (this.cart.getItemCount() === 0) {
            this.showToast('Cart is empty!', 'error');
            return null;
        }
        
        const order = new Order(
            shippingInfo,
            this.cart.getItems(),
            this.cart.getTotal(),
            paymentMethodType
        );
        
        this.orders.push(order);
        this.cart.clear();
        this.renderCart();
        this.renderProducts();
        this.showToast('Order placed successfully!', 'success');
        return order;
    }
    
    filterByCategory(category) {
        this.currentCategory = category;
        document.querySelectorAll('.category').forEach(cat => {
            if (cat.dataset.category === category) cat.classList.add('active');
            else cat.classList.remove('active');
        });
        document.getElementById('categoryTitle').innerText = category === 'all' ? 'All Products' : `${category} Products`;
        this.renderProducts();
    }
    
    applyFilters() {
        const priceRange = document.getElementById('priceRange');
        if (priceRange) this.currentFilters.priceMax = parseInt(priceRange.value);
        
        const ratingChecks = document.querySelectorAll('.rating-filter input:checked');
        this.currentFilters.ratings = Array.from(ratingChecks).map(cb => parseInt(cb.value));
        
        const inStockOnly = document.getElementById('inStockOnly');
        if (inStockOnly) this.currentFilters.inStockOnly = inStockOnly.checked;
        
        this.renderProducts();
    }
    
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.innerText = message;
        toast.style.background = type === 'error' ? '#ff4757' : type === 'success' ? '#28a745' : '#667eea';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
    
    setupEventListeners() {
        // Price range
        const priceRange = document.getElementById('priceRange');
        const priceValue = document.getElementById('priceValue');
        if (priceRange && priceValue) {
            priceRange.addEventListener('input', (e) => {
                priceValue.innerText = e.target.value;
                this.applyFilters();
            });
        }
        
        // Rating filters
        document.querySelectorAll('.rating-filter input').forEach(cb => {
            cb.addEventListener('change', () => this.applyFilters());
        });
        
        // Stock filter
        const stockFilter = document.getElementById('inStockOnly');
        if (stockFilter) stockFilter.addEventListener('change', () => this.applyFilters());
        
        // Search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.addEventListener('input', () => this.renderProducts());
        
        // Sort
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) sortSelect.addEventListener('change', () => this.renderProducts());
        
        // Categories
        document.querySelectorAll('.category').forEach(cat => {
            cat.addEventListener('click', () => this.filterByCategory(cat.dataset.category));
        });
    }
}

// ========== UI FUNCTIONS ==========
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new ECommerceApp();
});

function toggleCart() {
    document.getElementById('cartSidebar').classList.toggle('open');
    document.getElementById('wishlistSidebar')?.classList.remove('open');
}

function toggleWishlist() {
    document.getElementById('wishlistSidebar').classList.toggle('open');
    document.getElementById('cartSidebar')?.classList.remove('open');
}

function toggleUserMenu() {
    document.getElementById('userMenu').classList.toggle('show');
}

function filterByCategory(category) {
    app.filterByCategory(category);
}

function clearFilters() {
    const priceRange = document.getElementById('priceRange');
    if (priceRange) priceRange.value = '50000';
    document.querySelectorAll('.rating-filter input').forEach(cb => cb.checked = false);
    const stockFilter = document.getElementById('inStockOnly');
    if (stockFilter) stockFilter.checked = false;
    app.applyFilters();
}

function showCheckout() {
    if (app.cart.getItemCount() === 0) {
        app.showToast('Cart is empty!', 'error');
        return;
    }
    
    const modal = document.getElementById('checkoutModal');
    const summary = document.getElementById('checkoutSummary');
    
    const items = app.cart.getItems();
    summary.innerHTML = `
        ${items.map(item => `
            <div style="display:flex; justify-content:space-between; margin:0.5rem 0;">
                <span>${item.product.name} x ${item.quantity}</span>
                <span>₹${(item.product.price * item.quantity).toLocaleString()}</span>
            </div>
        `).join('')}
        <div style="display:flex; justify-content:space-between; margin-top:1rem; padding-top:0.5rem; border-top:1px solid #ddd; font-weight:bold;">
            <span>Total:</span>
            <span>₹${app.cart.getTotal().toLocaleString()}</span>
        </div>
    `;
    
    modal.style.display = 'block';
    toggleCart();
}

function closeModal() {
    document.getElementById('checkoutModal').style.display = 'none';
}

function placeOrder() {
    const fullName = document.getElementById('fullName')?.value;
    const email = document.getElementById('email')?.value;
    const phone = document.getElementById('phone')?.value;
    const address = document.getElementById('address')?.value;
    const city = document.getElementById('city')?.value;
    const postalCode = document.getElementById('postalCode')?.value;
    
    if (!fullName || !email || !phone || !address || !city || !postalCode) {
        app.showToast('Please fill all shipping details', 'error');
        return;
    }
    
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
    
    const shippingInfo = { fullName, email, phone, address, city, postalCode };
    const order = app.createOrder(shippingInfo, paymentMethod);
    
    if (order) {
        closeModal();
        app.showToast(`Order #${order.orderId} placed successfully!`, 'success');
    }
}

function toggleLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
    document.getElementById('userMenu').classList.remove('show');
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const tabs = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        tabs[0].classList.add('active');
    } else {
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
        tabs[1].classList.add('active');
    }
}

function login() {
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    
    if (email && password) {
        app.currentUser = { email, name: email.split('@')[0] };
        document.getElementById('userName').innerText = app.currentUser.name;
        document.getElementById('userEmail').innerText = app.currentUser.email;
        closeLoginModal();
        app.showToast(`Welcome back, ${app.currentUser.name}!`, 'success');
    } else {
        app.showToast('Please enter email and password', 'error');
    }
}

function signup() {
    const name = document.getElementById('signupName')?.value;
    const email = document.getElementById('signupEmail')?.value;
    const password = document.getElementById('signupPassword')?.value;
    
    if (name && email && password) {
        app.currentUser = { name, email };
        document.getElementById('userName').innerText = name;
        document.getElementById('userEmail').innerText = email;
        closeLoginModal();
        app.showToast(`Account created! Welcome ${name}!`, 'success');
    } else {
        app.showToast('Please fill all fields', 'error');
    }
}

function showOrders() {
    const modal = document.getElementById('ordersModal');
    const ordersList = document.getElementById('ordersList');
    
    if (app.orders.length === 0) {
        ordersList.innerHTML = '<div style="text-align:center; padding:2rem;">No orders yet</div>';
    } else {
        ordersList.innerHTML = app.orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <strong>Order #${order.orderId}</strong>
                    <span>${new Date(order.date).toLocaleDateString()}</span>
                </div>
                <div><strong>Status:</strong> ${order.status}</div>
                <div class="order-items">
                    <strong>Items:</strong>
                    ${order.items.map(item => `
                        <div class="order-item">
                            <span>${item.name} x ${item.quantity}</span>
                            <span>₹${(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
                <div><strong>Total:</strong> ₹${order.total.toLocaleString()}</div>
                <div><strong>Payment:</strong> ${order.paymentMethod}</div>
            </div>
        `).join('');
    }
    
    modal.style.display = 'block';
    document.getElementById('userMenu').classList.remove('show');
}

function closeOrdersModal() {
    document.getElementById('ordersModal').style.display = 'none';
}

function showAddressBook() {
    app.showToast('Address book feature coming soon!', 'info');
}

// Payment method toggle
document.addEventListener('DOMContentLoaded', () => {
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    paymentRadios?.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const creditFields = document.getElementById('creditCardFields');
            const paypalFields = document.getElementById('paypalFields');
            
            if (e.target.value === 'credit') {
                if (creditFields) creditFields.style.display = 'block';
                if (paypalFields) paypalFields.style.display = 'none';
            } else if (e.target.value === 'paypal') {
                if (creditFields) creditFields.style.display = 'none';
                if (paypalFields) paypalFields.style.display = 'block';
            } else {
                if (creditFields) creditFields.style.display = 'none';
                if (paypalFields) paypalFields.style.display = 'none';
            }
        });
    });
});

// Close modals on outside click
window.onclick = function(event) {
    const checkoutModal = document.getElementById('checkoutModal');
    const loginModal = document.getElementById('loginModal');
    const ordersModal = document.getElementById('ordersModal');
    
    if (event.target === checkoutModal) closeModal();
    if (event.target === loginModal) closeLoginModal();
    if (event.target === ordersModal) closeOrdersModal();
}
