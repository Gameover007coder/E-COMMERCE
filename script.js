// ========== CONSTANTS & HELPERS ==========
const PRICE_MAX = 150000;          // must match the slider's max in index.html
const FREE_SHIPPING_MIN = 1000;    // orders at or above this ship free
const SHIPPING_FEE = 99;
const BRAND_COLORS = ['#561370', '#C71573', '#F51E6B', '#FF6A12', '#FFA10A'];

const $ = (id) => document.getElementById(id);
const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
                existing.quantity += quantity;
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

// ========== ANIMATION TOOLKIT ==========
const FX = {
    // Tween a number inside an element (used for cart totals)
    animateNumber(el, to, duration = 550) {
        if (!el) return;
        const from = el._val ?? 0;
        el._val = to;
        cancelAnimationFrame(el._raf);
        if (reducedMotion() || from === to) { el.textContent = fmt(to); return; }
        const start = performance.now();
        const step = (now) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = fmt(Math.round(from + (to - from) * eased));
            if (p < 1) el._raf = requestAnimationFrame(step);
        };
        el._raf = requestAnimationFrame(step);
    },

    // The product emoji arcs from its card into the cart icon
    flyToCart(sourceEl, emoji) {
        return new Promise((resolve) => {
            const target = $('cartBtn');
            if (!sourceEl || !target || reducedMotion() || !sourceEl.animate) return resolve();

            const a = sourceEl.getBoundingClientRect();
            const b = target.getBoundingClientRect();
            const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
            const dy = (b.top + b.height / 2) - (a.top + a.height / 2);

            const el = document.createElement('div');
            el.className = 'fly-item';
            el.textContent = emoji;
            el.style.left = a.left + 'px';
            el.style.top = a.top + 'px';
            el.style.width = a.width + 'px';
            el.style.height = a.height + 'px';
            el.style.fontSize = Math.max(a.height * 0.85, 30) + 'px';
            el.style.textAlign = 'center';
            document.body.appendChild(el);

            const anim = el.animate([
                { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
                { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 110}px) scale(.7) rotate(140deg)`, opacity: 1, offset: 0.55 },
                { transform: `translate(${dx}px, ${dy}px) scale(.15) rotate(320deg)`, opacity: .85 }
            ], { duration: 780, easing: 'cubic-bezier(.45,0,.7,.6)' });

            anim.onfinish = () => { el.remove(); resolve(); };
            anim.oncancel = () => { el.remove(); resolve(); };
        });
    },

    // Small DOM-particle burst. Used for hearts, confetti and the free-shipping unlock.
    burst(x, y, opts = {}) {
        if (reducedMotion()) return;
        const {
            count = 14, colors = BRAND_COLORS, chars = null, spread = 90,
            gravity = 70, duration = 900, size = 8
        } = opts;

        for (let i = 0; i < count; i++) {
            const p = document.createElement('span');
            p.className = 'particle';
            p.style.left = x + 'px';
            p.style.top = y + 'px';
            const color = pick(colors);
            if (chars) {
                p.textContent = pick(chars);
                p.style.color = color;
                p.style.fontSize = rand(size, size * 1.8) + 'px';
            } else {
                p.style.width = rand(size * .6, size) + 'px';
                p.style.height = rand(size * .4, size * 1.6) + 'px';
                p.style.background = color;
                p.style.borderRadius = Math.random() > .6 ? '50%' : '2px';
            }
            document.body.appendChild(p);

            const angle = rand(0, Math.PI * 2);
            const dist = spread * rand(.4, 1);
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist;
            const anim = p.animate([
                { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
                { transform: `translate(${dx}px, ${dy + gravity}px) scale(.4) rotate(${rand(-360, 360)}deg)`, opacity: 0 }
            ], { duration: duration * rand(.75, 1.15), easing: 'cubic-bezier(.1,.7,.3,1)', delay: rand(0, 120) });
            anim.onfinish = () => p.remove();
        }
    },

    confetti() {
        // two cannons from the lower corners plus a centre pop
        const w = window.innerWidth, h = window.innerHeight;
        const base = { count: 55, spread: 520, gravity: 360, duration: 1900, size: 11 };
        this.burst(w * 0.12, h * 0.85, { ...base, spread: 600 });
        this.burst(w * 0.88, h * 0.85, { ...base, spread: 600 });
        this.burst(w * 0.5, h * 0.4, { ...base, count: 40, spread: 380 });
    },

    // Hero: products fall into the bag, and it squishes on every landing
    initHeroBag() {
        const bag = $('heroBag');
        const itemsLayer = $('bagItems');
        const stage = $('heroStage');
        const hero = document.querySelector('.hero');
        if (!bag || !itemsLayer || !hero) return;

        const icons = productsDB.map(p => p.icon);
        let last = '';
        let timer = null;
        let visible = true;

        const squish = () => {
            bag.classList.remove('squish');
            void bag.offsetWidth;
            bag.classList.add('squish');
        };

        const drop = () => {
            if (reducedMotion() || !itemsLayer.animate) return;
            let icon;
            do { icon = pick(icons); } while (icon === last);
            last = icon;

            const h = bag.offsetHeight;
            const el = document.createElement('span');
            el.className = 'bag-item';
            el.textContent = icon;
            el.style.left = rand(34, 66) + '%';
            itemsLayer.appendChild(el);

            const dur = rand(950, 1200);
            const startY = -h * 0.28;
            const endY = h * 0.5;
            const r0 = rand(-40, 40), r1 = rand(-200, 200);
            const anim = el.animate([
                { transform: `translateY(${startY}px) rotate(${r0}deg)`, opacity: 0 },
                { opacity: 1, offset: .15 },
                { transform: `translateY(${endY}px) rotate(${r1}deg)`, opacity: 1 }
            ], { duration: dur, easing: 'cubic-bezier(.5,0,.9,.55)' });

            setTimeout(squish, dur * 0.66);
            anim.onfinish = () => el.remove();
        };

        const start = () => {
            if (timer || reducedMotion()) return;
            timer = setInterval(drop, 1500);
        };
        const stop = () => { clearInterval(timer); timer = null; };

        // opening sequence: three items right after the bag appears
        if (!reducedMotion()) {
            setTimeout(drop, 900);
            setTimeout(drop, 1350);
            setTimeout(drop, 1800);
        }
        setTimeout(start, 2000);

        if ('IntersectionObserver' in window) {
            new IntersectionObserver((entries) => {
                visible = entries[0].isIntersecting;
                visible && !document.hidden ? start() : stop();
            }, { threshold: 0.1 }).observe(hero);
        }
        document.addEventListener('visibilitychange', () => {
            document.hidden || !visible ? stop() : start();
        });

        // gentle parallax following the pointer
        hero.addEventListener('pointermove', (e) => {
            if (e.pointerType !== 'mouse' || reducedMotion()) return;
            const r = hero.getBoundingClientRect();
            stage.style.setProperty('--px', (((e.clientX - r.left) / r.width) - 0.5) * 2);
            stage.style.setProperty('--py', (((e.clientY - r.top) / r.height) - 0.5) * 2);
        });
        hero.addEventListener('pointerleave', () => {
            stage.style.setProperty('--px', 0);
            stage.style.setProperty('--py', 0);
        });
    },

    // Countdown to the end of the current month
    initCountdown() {
        const ids = ['cdD', 'cdH', 'cdM', 'cdS'];
        const els = ids.map($);
        if (els.some(e => !e)) return;
        const pad = (n) => String(n).padStart(2, '0');
        const prev = [];

        const update = () => {
            const now = new Date();
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            let s = Math.max(0, Math.floor((end - now) / 1000));
            const vals = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60].map(pad);
            vals.forEach((v, i) => {
                if (prev[i] !== v) {
                    els[i].textContent = v;
                    if (prev[i] !== undefined && !reducedMotion()) {
                        els[i].classList.remove('tick');
                        void els[i].offsetWidth;
                        els[i].classList.add('tick');
                    }
                    prev[i] = v;
                }
            });
        };
        update();
        setInterval(update, 1000);
    },

    // Search placeholder types itself out
    initTypewriter() {
        const input = $('searchInput');
        if (!input || reducedMotion()) return;
        const phrases = ['Search laptops', 'Search sneakers', 'Search headphones', 'Search yoga mats', 'Search coffee makers'];
        let pi = 0, ci = 0, deleting = false;

        const tick = () => {
            if (document.activeElement === input || input.value) {
                input.placeholder = 'Search products';
                return setTimeout(tick, 800);
            }
            const word = phrases[pi];
            ci += deleting ? -1 : 1;
            input.placeholder = word.slice(0, ci) || 'Search';
            let delay = deleting ? 35 : 75;
            if (!deleting && ci === word.length) { deleting = true; delay = 1500; }
            else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; delay = 350; }
            setTimeout(tick, delay);
        };
        setTimeout(tick, 1800);
    },

    // Cards tilt towards the pointer and catch a moving highlight
    initCardTilt() {
        const grid = $('productsContainer');
        if (!grid) return;
        const reset = (card) => {
            card.classList.remove('tilting');
            card.style.removeProperty('--rx');
            card.style.removeProperty('--ry');
        };
        grid.addEventListener('pointermove', (e) => {
            if (e.pointerType !== 'mouse' || reducedMotion()) return;
            const card = e.target.closest('.product-card');
            if (!card) return;
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            card.classList.add('tilting');
            card.style.setProperty('--ry', ((px - .5) * 9).toFixed(2) + 'deg');
            card.style.setProperty('--rx', ((.5 - py) * 7).toFixed(2) + 'deg');
            card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
            card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        });
        grid.addEventListener('pointerout', (e) => {
            const card = e.target.closest('.product-card');
            if (card && !card.contains(e.relatedTarget)) reset(card);
        });
    },

    // Header shrinks on scroll; back-to-top button with a progress ring
    initScrollEffects() {
        const header = $('siteHeader');
        const toTop = $('toTop');
        const ring = $('toTopRing');
        let ticking = false;

        const onScroll = () => {
            const y = window.scrollY;
            header.classList.toggle('scrolled', y > 40);
            toTop.classList.toggle('show', y > 600);
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const pct = max > 0 ? Math.min(1, y / max) : 0;
            if (ring) ring.style.strokeDashoffset = 132 * (1 - pct);
            ticking = false;
        };
        window.addEventListener('scroll', () => {
            if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
        }, { passive: true });
        onScroll();

        // keep sticky offsets in sync with the real header height
        if ('ResizeObserver' in window) {
            new ResizeObserver(() => {
                document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
            }).observe(header);
        }
    },

    // Sliding pill behind the active category
    moveCategoryIndicator() {
        const ind = $('catIndicator');
        const active = document.querySelector('.category.active');
        if (!ind || !active) return;
        ind.style.width = active.offsetWidth + 'px';
        ind.style.height = active.offsetHeight + 'px';
        ind.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
    }
};

// ========== E-COMMERCE APP ==========
class ECommerceApp {
    constructor() {
        this.products = productsDB.map(p => new Product(p));
        this.cart = new ShoppingCart();
        this.wishlist = new Wishlist();
        this.orders = [];
        this.currentUser = null;
        this.currentCategory = "all";
        this.currentFilters = { priceMax: PRICE_MAX, ratings: [], inStockOnly: false };
        this.lastAddedId = null;
        this._shipDone = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderCart();
        this.renderWishlist();
        this.showSkeletons();
        // brief shimmer, then the cards arrive one after another
        setTimeout(() => this.renderProducts({ animate: true }), reducedMotion() ? 0 : 750);
    }

    getShipping(subtotal) {
        if (subtotal === 0) return 0;
        return subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;
    }

    getProducts() {
        let filtered = [...this.products];

        if (this.currentCategory !== "all") {
            filtered = filtered.filter(p => p.category === this.currentCategory);
        }

        // At the slider's maximum the price filter is off, so the priciest items stay visible
        if (this.currentFilters.priceMax < PRICE_MAX) {
            filtered = filtered.filter(p => p.price <= this.currentFilters.priceMax);
        }

        if (this.currentFilters.ratings.length > 0) {
            const minRating = Math.min(...this.currentFilters.ratings);
            filtered = filtered.filter(p => p.rating >= minRating);
        }

        if (this.currentFilters.inStockOnly) {
            filtered = filtered.filter(p => p.getStock() > 0);
        }

        const searchTerm = $('searchInput')?.value.trim().toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm) || p.category.toLowerCase().includes(searchTerm));
        }

        const sortBy = $('sortSelect')?.value;
        if (sortBy === 'priceLow') filtered.sort((a, b) => a.price - b.price);
        if (sortBy === 'priceHigh') filtered.sort((a, b) => b.price - a.price);
        if (sortBy === 'rating') filtered.sort((a, b) => b.rating - a.rating);

        return filtered;
    }

    showSkeletons() {
        const container = $('productsContainer');
        if (!container) return;
        container.innerHTML = Array.from({ length: 8 }, () => `
            <div class="skeleton-card" aria-hidden="true">
                <div class="sk sk-img"></div>
                <div class="sk-body">
                    <div class="sk sk-line"></div>
                    <div class="sk sk-line w60"></div>
                    <div class="sk sk-line w40"></div>
                    <div class="sk sk-btn"></div>
                </div>
            </div>`).join('');
    }

    renderProducts({ animate = false } = {}) {
        const container = $('productsContainer');
        if (!container) return;

        const products = this.getProducts();
        const countEl = $('resultCount');
        if (countEl) countEl.textContent = `${products.length} ${products.length === 1 ? 'product' : 'products'}`;

        if (products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-emoji">🛍️</span>
                    <h3>Nothing matches those filters</h3>
                    <p>Try a wider price range or clear the filters.</p>
                    <button type="button" class="clear-filters" onclick="clearFilters()">Clear all filters</button>
                </div>`;
            return;
        }

        container.innerHTML = products.map((product, i) => {
            const stock = product.getStock();
            const stockHtml = stock === 0
                ? '<div class="product-stock out-stock">Out of stock</div>'
                : stock <= 5
                    ? `<div class="product-stock low-stock"><span class="dot"></span>Only ${stock} left</div>`
                    : `<div class="product-stock in-stock">In stock: ${stock}</div>`;
            const wished = this.wishlist.items.has(product.id);

            return `
            <article class="product-card tint-${product.category} ${animate ? 'enter' : ''}" style="--i:${i}">
                ${product.discount > 0 ? `<div class="product-badge">-${product.discount}%</div>` : ''}
                <div class="product-image">
                    <span class="emoji" data-fly-src>${product.icon}</span>
                    <button type="button" class="wishlist-icon ${wished ? 'active' : ''}" data-id="${product.id}"
                        aria-label="${wished ? 'Remove from wishlist' : 'Add to wishlist'}" aria-pressed="${wished}"
                        onclick="app.toggleWishlist(${product.id}); event.stopPropagation();">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="product-category">${product.category}</div>
                    <div class="product-rating">
                        ${this.renderStars(product.rating)}<span>${product.rating}</span>
                    </div>
                    <div class="product-price">
                        ${fmt(product.price)}
                        ${product.originalPrice > product.price ? `<span class="original-price">${fmt(product.originalPrice)}</span>` : ''}
                    </div>
                    ${stockHtml}
                    <button type="button" class="add-to-cart" onclick="app.addToCart(${product.id}, 1, this)" ${stock === 0 ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            </article>`;
        }).join('');
    }

    renderStars(rating) {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5 ? 1 : 0;
        const empty = 5 - full - half;
        return '<i class="fas fa-star"></i>'.repeat(full)
            + (half ? '<i class="fas fa-star-half-alt"></i>' : '')
            + '<i class="far fa-star"></i>'.repeat(empty);
    }

    renderCart() {
        const container = $('cartItems');
        if (!container) return;

        const items = this.cart.getItems();
        const count = this.cart.getItemCount();
        const subtotal = this.cart.getTotal();
        const shipping = this.getShipping(subtotal);

        const badge = $('cartCount');
        badge.textContent = count;
        badge.classList.toggle('has', count > 0);

        if (items.length === 0) {
            container.innerHTML = `
                <div class="panel-empty">
                    <span class="empty-emoji">🛍️</span>
                    <strong>Your cart is empty</strong>
                    <p>Pick something from the sale and it will land here.</p>
                    <button type="button" class="clear-filters" onclick="closePanels()">Browse products</button>
                </div>`;
        } else {
            container.innerHTML = items.map(item => `
                <div class="cart-item tint-${item.product.category} ${item.product.id === this.lastAddedId ? 'new' : ''}">
                    <div class="cart-item-image"><span>${item.product.icon}</span></div>
                    <div class="cart-item-details">
                        <h4>${item.product.name}</h4>
                        <div class="cart-item-price">${fmt(item.product.price)}</div>
                        <div class="cart-item-actions">
                            <button type="button" class="quantity-btn" aria-label="Decrease quantity" onclick="app.updateCartQuantity(${item.product.id}, ${item.quantity - 1}, this)">-</button>
                            <span>${item.quantity}</span>
                            <button type="button" class="quantity-btn" aria-label="Increase quantity" onclick="app.updateCartQuantity(${item.product.id}, ${item.quantity + 1}, this)">+</button>
                            <button type="button" class="remove-btn" onclick="app.removeFromCart(${item.product.id}, this)">Remove</button>
                        </div>
                    </div>
                    <div class="line-total">${fmt(item.getSubtotal())}</div>
                </div>
            `).join('');
        }
        this.lastAddedId = null;

        FX.animateNumber($('cartSubtotal'), subtotal);
        FX.animateNumber($('cartTotal'), subtotal + shipping);
        $('shippingCost').textContent = items.length === 0 ? '-' : (shipping === 0 ? 'Free' : fmt(shipping));
        $('checkoutBtn').disabled = items.length === 0;

        // free-shipping progress
        const bar = document.querySelector('.ship-bar');
        const fill = $('shipFill');
        const text = $('shipText');
        const done = subtotal >= FREE_SHIPPING_MIN;
        fill.style.width = Math.min(100, (subtotal / FREE_SHIPPING_MIN) * 100) + '%';
        bar.classList.toggle('done', done);
        if (subtotal === 0) {
            text.textContent = `Free shipping on orders of ${fmt(FREE_SHIPPING_MIN)} or more`;
        } else if (done) {
            text.innerHTML = '<i class="fas fa-circle-check"></i> Free shipping unlocked';
        } else {
            text.innerHTML = `Add <strong>${fmt(FREE_SHIPPING_MIN - subtotal)}</strong> more for free shipping`;
        }
        if (done && !this._shipDone) {
            const r = bar.getBoundingClientRect();
            if ($('cartSidebar').classList.contains('open')) {
                FX.burst(r.left + r.width / 2, r.top, { count: 16, spread: 120, gravity: 60 });
            }
        }
        this._shipDone = done;
    }

    renderWishlist() {
        const container = $('wishlistItems');
        const countEl = $('wishlistCount');
        if (!container) return;

        const items = this.wishlist.getItems();
        countEl.textContent = items.length;
        countEl.classList.toggle('has', items.length > 0);

        if (items.length === 0) {
            container.innerHTML = `
                <div class="panel-empty">
                    <span class="empty-emoji">💜</span>
                    <strong>Your wishlist is empty</strong>
                    <p>Tap the heart on any product to save it for later.</p>
                </div>`;
            return;
        }

        container.innerHTML = items.map(product => `
            <div class="cart-item tint-${product.category}">
                <div class="cart-item-image"><span data-fly-src>${product.icon}</span></div>
                <div class="cart-item-details">
                    <h4>${product.name}</h4>
                    <div class="cart-item-price">${fmt(product.price)}</div>
                    <button type="button" class="add-to-cart" style="margin-top:.5rem;" onclick="app.moveToCart(${product.id}, this)" ${product.getStock() === 0 ? 'disabled' : ''}>
                        Move to Cart
                    </button>
                </div>
                <button type="button" class="remove-btn" onclick="app.toggleWishlist(${product.id})">Remove</button>
            </div>
        `).join('');
    }

    // ----- cart actions -----
    addToCart(productId, quantity, sourceEl) {
        const product = this.products.find(p => p.id === productId);
        if (!product || !this.cart.addItem(product, quantity)) {
            this.showToast('Not enough stock for that', 'error');
            return false;
        }
        // grab the emoji position before the grid re-renders
        const fromEl = sourceEl?.closest('.product-card, .cart-item')?.querySelector('[data-fly-src]');
        const flight = FX.flyToCart(fromEl, product.icon);

        this.lastAddedId = productId;
        this.showToast(`${product.name} added to cart`, 'success');
        this.renderCart();
        this.renderProducts();

        flight.then(() => {
            const btn = $('cartBtn');
            btn.classList.remove('bump');
            void btn.offsetWidth;
            btn.classList.add('bump');
        });
        return true;
    }

    moveToCart(productId, sourceEl) {
        if (this.addToCart(productId, 1, sourceEl)) {
            this.wishlist.removeItem(productId);
            this.renderWishlist();
            this.renderProducts();
        }
    }

    removeFromCart(productId, el) {
        const finish = () => {
            this.cart.removeItem(productId);
            this.renderCart();
            this.renderProducts();
            this.showToast('Removed from cart', 'info');
        };
        const row = el?.closest('.cart-item');
        if (row && !reducedMotion()) {
            row.classList.add('leaving');
            setTimeout(finish, 260);
        } else {
            finish();
        }
    }

    updateCartQuantity(productId, quantity, el) {
        if (quantity <= 0) {
            this.removeFromCart(productId, el);
            return;
        }
        if (!this.cart.updateQuantity(productId, quantity)) {
            this.showToast('No more stock available', 'error');
            return;
        }
        this.renderCart();
        this.renderProducts();
    }

    toggleWishlist(productId) {
        const product = this.products.find(p => p.id === productId);
        const adding = !this.wishlist.items.has(productId);
        if (adding) {
            this.wishlist.addItem(product);
            this.showToast(`${product.name} saved to wishlist`, 'success');
        } else {
            this.wishlist.removeItem(productId);
            this.showToast('Removed from wishlist', 'info');
        }
        this.renderWishlist();
        this.renderProducts();

        if (adding) {
            const heart = document.querySelector(`.wishlist-icon[data-id="${productId}"]`);
            if (heart) {
                heart.classList.add('pop');
                const r = heart.getBoundingClientRect();
                FX.burst(r.left + r.width / 2, r.top + r.height / 2, {
                    count: 9, chars: ['♥'], colors: ['#F51E6B', '#C71573', '#FF6A12'], spread: 56, gravity: -10, size: 11, duration: 800
                });
            }
        }
    }

    // ----- orders -----
    createOrder(shippingInfo, paymentMethodType) {
        if (this.cart.getItemCount() === 0) {
            this.showToast('Your cart is empty', 'error');
            return null;
        }

        const subtotal = this.cart.getTotal();
        const total = subtotal + this.getShipping(subtotal);
        const order = new Order(shippingInfo, this.cart.getItems(), total, paymentMethodType);

        this.orders.push(order);
        this.cart.clear();
        this.renderCart();
        this.renderProducts();
        return order;
    }

    // ----- filtering -----
    filterByCategory(category) {
        this.currentCategory = category;
        document.querySelectorAll('.category').forEach(cat => {
            cat.classList.toggle('active', cat.dataset.category === category);
        });
        FX.moveCategoryIndicator();
        $('categoryTitle').innerText = category === 'all' ? 'All Products' : `${category} Products`;
        this.renderProducts({ animate: true });
    }

    applyFilters({ animate = true, render = true } = {}) {
        const priceRange = $('priceRange');
        if (priceRange) {
            this.currentFilters.priceMax = parseInt(priceRange.value, 10);
            const pct = (priceRange.value / priceRange.max) * 100;
            priceRange.style.setProperty('--pct', pct + '%');
            const label = $('priceValue');
            if (label) label.textContent = fmt(priceRange.value) + (priceRange.value >= PRICE_MAX ? '+' : '');
        }

        const ratingChecks = document.querySelectorAll('.rating-filter input:checked');
        this.currentFilters.ratings = Array.from(ratingChecks).map(cb => parseInt(cb.value, 10));

        const inStockOnly = $('inStockOnly');
        if (inStockOnly) this.currentFilters.inStockOnly = inStockOnly.checked;

        if (render) this.renderProducts({ animate });
    }

    // ----- toast -----
    showToast(message, type = 'success') {
        const toast = $('toast');
        const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
        $('toastIcon').className = `fas ${icons[type] || icons.info}`;
        $('toastMsg').textContent = message;
        toast.classList.remove('show', 'success', 'error', 'info');
        void toast.offsetWidth; // restart the progress bar animation
        toast.classList.add('show', type);
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
    }

    setupEventListeners() {
        const priceRange = $('priceRange');
        if (priceRange) {
            // dragging the slider updates the grid live, without replaying the entrance
            priceRange.addEventListener('input', () => this.applyFilters({ animate: false }));
        }

        document.querySelectorAll('.rating-filter input').forEach(cb => {
            cb.addEventListener('change', () => this.applyFilters());
        });

        const stockFilter = $('inStockOnly');
        if (stockFilter) stockFilter.addEventListener('change', () => this.applyFilters());

        const searchInput = $('searchInput');
        if (searchInput) {
            let t;
            searchInput.addEventListener('input', () => {
                clearTimeout(t);
                t = setTimeout(() => this.renderProducts({ animate: true }), 140);
            });
        }

        const sortSelect = $('sortSelect');
        if (sortSelect) sortSelect.addEventListener('change', () => this.renderProducts({ animate: true }));

        document.querySelectorAll('.category').forEach(cat => {
            cat.addEventListener('click', () => this.filterByCategory(cat.dataset.category));
        });
    }
}

// ========== UI FUNCTIONS ==========
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new ECommerceApp();
    app.applyFilters({ render: false }); // sync slider fill + label only

    FX.initHeroBag();
    FX.initCountdown();
    FX.initTypewriter();
    FX.initCardTilt();
    FX.initScrollEffects();

    FX.moveCategoryIndicator();
    if (document.fonts?.ready) document.fonts.ready.then(() => FX.moveCategoryIndicator());
    window.addEventListener('resize', () => FX.moveCategoryIndicator());
});

// Panels (cart / wishlist)
function openPanel(id) {
    closeUserMenu();
    ['cartSidebar', 'wishlistSidebar'].forEach(p => $(p).classList.toggle('open', p === id));
    $('overlay').classList.add('show');
}

function closePanels() {
    $('cartSidebar').classList.remove('open');
    $('wishlistSidebar').classList.remove('open');
    $('overlay').classList.remove('show');
}

function toggleCart() {
    $('cartSidebar').classList.contains('open') ? closePanels() : openPanel('cartSidebar');
}

function toggleWishlist() {
    $('wishlistSidebar').classList.contains('open') ? closePanels() : openPanel('wishlistSidebar');
}

function toggleUserMenu() {
    $('userMenu').classList.toggle('show');
}

function closeUserMenu() {
    $('userMenu').classList.remove('show');
}

// Modals
function openModalEl(id) {
    const el = $(id);
    el.classList.remove('closing');
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModalEl(id) {
    const el = $(id);
    if (!el.classList.contains('open')) return;
    el.classList.add('closing');
    setTimeout(() => {
        el.classList.remove('open', 'closing');
        if (!document.querySelector('.modal.open')) document.body.style.overflow = '';
    }, reducedMotion() ? 0 : 180);
}

function filterByCategory(category) {
    app.filterByCategory(category);
}

function shopNow() {
    app.filterByCategory('all');
    $('products').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
}

function clearFilters() {
    const priceRange = $('priceRange');
    if (priceRange) priceRange.value = String(PRICE_MAX);
    document.querySelectorAll('.rating-filter input').forEach(cb => cb.checked = false);
    const stockFilter = $('inStockOnly');
    if (stockFilter) stockFilter.checked = false;
    const search = $('searchInput');
    if (search) search.value = '';
    app.applyFilters();
}

function markInvalid(ids) {
    let any = false;
    ids.forEach(id => {
        const el = $(id);
        if (!el) return;
        const bad = !el.value.trim();
        el.classList.remove('invalid');
        if (bad) {
            void el.offsetWidth;
            el.classList.add('invalid');
            any = true;
        }
    });
    return any;
}

// Checkout
function showCheckout() {
    if (app.cart.getItemCount() === 0) {
        app.showToast('Your cart is empty', 'error');
        return;
    }

    const items = app.cart.getItems();
    const subtotal = app.cart.getTotal();
    const shipping = app.getShipping(subtotal);

    $('checkoutSummary').innerHTML = `
        ${items.map(item => `
            <div class="row">
                <span>${item.product.name} x ${item.quantity}</span>
                <span>${fmt(item.product.price * item.quantity)}</span>
            </div>
        `).join('')}
        <div class="row"><span>Shipping</span><span>${shipping === 0 ? 'Free' : fmt(shipping)}</span></div>
        <div class="row sum"><span>Total</span><span>${fmt(subtotal + shipping)}</span></div>
    `;

    closePanels();
    openModalEl('checkoutModal');
}

function closeModal() {
    closeModalEl('checkoutModal');
}

function placeOrder() {
    const required = ['fullName', 'email', 'phone', 'address', 'city', 'postalCode'];
    if (markInvalid(required)) {
        app.showToast('Please fill in all shipping details', 'error');
        return;
    }
    const emailEl = $('email');
    if (!/^\S+@\S+\.\S+$/.test(emailEl.value.trim())) {
        emailEl.classList.remove('invalid');
        void emailEl.offsetWidth;
        emailEl.classList.add('invalid');
        app.showToast('Enter a valid email address', 'error');
        return;
    }

    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
    const shippingInfo = {};
    required.forEach(id => shippingInfo[id] = $(id).value.trim());

    const order = app.createOrder(shippingInfo, paymentMethod);
    if (!order) return;

    closeModalEl('checkoutModal');
    $('successText').textContent = `Order #${order.orderId} is confirmed. We'll send the details to ${shippingInfo.email}.`;
    setTimeout(() => {
        openModalEl('successModal');
        FX.confetti();
    }, reducedMotion() ? 0 : 220);
}

function closeSuccess() {
    closeModalEl('successModal');
}

// Login / sign up
function toggleLoginModal() {
    closeUserMenu();
    openModalEl('loginModal');
}

function closeLoginModal() {
    closeModalEl('loginModal');
}

function switchTab(tab) {
    const loginForm = $('loginForm');
    const signupForm = $('signupForm');
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

function setSignedIn(name, email) {
    app.currentUser = { name, email };
    $('userName').innerText = name;
    $('userEmail').innerText = email;
    const btn = $('userIcon');
    btn.innerHTML = `<span class="avatar">${name.trim().charAt(0).toUpperCase()}</span>`;
    closeLoginModal();
}

function login() {
    if (markInvalid(['loginEmail', 'loginPassword'])) {
        app.showToast('Enter your email and password', 'error');
        return;
    }
    const email = $('loginEmail').value.trim();
    setSignedIn(email.split('@')[0], email);
    app.showToast(`Welcome back, ${app.currentUser.name}`, 'success');
}

function signup() {
    if (markInvalid(['signupName', 'signupEmail', 'signupPassword'])) {
        app.showToast('Please fill in all fields', 'error');
        return;
    }
    const name = $('signupName').value.trim();
    setSignedIn(name, $('signupEmail').value.trim());
    app.showToast(`Account created. Welcome, ${name}`, 'success');
}

// Orders
function showOrders() {
    const ordersList = $('ordersList');

    if (app.orders.length === 0) {
        ordersList.innerHTML = `
            <div class="panel-empty">
                <span class="empty-emoji">📦</span>
                <strong>No orders yet</strong>
                <p>Your orders will show up here after checkout.</p>
            </div>`;
    } else {
        ordersList.innerHTML = [...app.orders].reverse().map((order, i) => `
            <div class="order-card" style="--i:${i}">
                <div class="order-header">
                    <strong>Order #${order.orderId}</strong>
                    <span>${new Date(order.date).toLocaleDateString('en-IN')}</span>
                </div>
                <div><strong>Status:</strong> ${order.status}</div>
                <div class="order-items">
                    <strong>Items:</strong>
                    ${order.items.map(item => `
                        <div class="order-item">
                            <span>${item.name} x ${item.quantity}</span>
                            <span>${fmt(item.price * item.quantity)}</span>
                        </div>
                    `).join('')}
                </div>
                <div><strong>Total:</strong> ${fmt(order.total)}</div>
                <div><strong>Payment:</strong> ${order.paymentMethod}</div>
            </div>
        `).join('');
    }

    closeUserMenu();
    openModalEl('ordersModal');
}

function closeOrdersModal() {
    closeModalEl('ordersModal');
}

function showAddressBook() {
    closeUserMenu();
    app.showToast('Address book is coming soon', 'info');
}

function subscribe() {
    const input = $('newsletterEmail');
    if (!/^\S+@\S+\.\S+$/.test(input.value.trim())) {
        app.showToast('Enter a valid email to subscribe', 'error');
        return;
    }
    input.value = '';
    app.showToast('You are subscribed', 'success');
}

// Payment method toggle
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const creditFields = $('creditCardFields');
            const paypalFields = $('paypalFields');
            creditFields.style.display = e.target.value === 'credit' ? 'block' : 'none';
            paypalFields.style.display = e.target.value === 'paypal' ? 'block' : 'none';
        });
    });
});

// Close things on outside click / Escape
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        closeModalEl(event.target.id);
    }
    const menu = $('userMenu');
    if (menu.classList.contains('show') && !menu.contains(event.target) && !$('userIcon').contains(event.target)) {
        closeUserMenu();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closePanels();
    closeUserMenu();
    document.querySelectorAll('.modal.open').forEach(m => closeModalEl(m.id));
});
