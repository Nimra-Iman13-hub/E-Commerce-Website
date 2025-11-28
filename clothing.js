class ShoppingCart {
    constructor() {
        this.items = [];
        this.total = 0;
        this.init();
    }

    init() {
        this.loadCart();
        this.updateCartDisplay();
        this.bindEvents();
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                ...product,
                quantity: 1
            });
        }
        
        this.updateTotal();
        this.saveCart();
        this.updateCartDisplay();
        this.showNotification('Product added to cart!');
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.updateTotal();
        this.saveCart();
        this.updateCartDisplay();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(1, quantity);
            this.updateTotal();
            this.saveCart();
            this.updateCartDisplay();
        }
    }

    updateTotal() {
        this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    clearCart() {
        this.items = [];
        this.total = 0;
        this.saveCart();
        this.updateCartDisplay();
    }

    saveCart() {
        localStorage.setItem('mzb-cart', JSON.stringify({
            items: this.items,
            total: this.total
        }));
    }

    loadCart() {
        const savedCart = localStorage.getItem('mzb-cart');
        if (savedCart) {
            const cartData = JSON.parse(savedCart);
            this.items = cartData.items || [];
            this.total = cartData.total || 0;
        }
    }

    updateCartDisplay() {
        const cartCount = document.querySelector('.cart-count');
        const cartItems = document.querySelector('.cart-items');
        const cartTotal = document.querySelector('.cart-total h4');
        
        if (cartCount) {
            const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }

        if (cartItems) {
            cartItems.innerHTML = '';
            
            if (this.items.length === 0) {
                cartItems.innerHTML = '<p style="text-align: center; color: #666;">Your cart is empty</p>';
            } else {
                this.items.forEach(item => {
                    const cartItem = document.createElement('div');
                    cartItem.className = 'cart-item';
                    cartItem.style.cssText = `
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        padding: 1rem 0;
                        border-bottom: 1px solid #eee;
                    `;
                    
                    cartItem.innerHTML = `
                        <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                        <div style="flex: 1;">
                            <h5 style="margin: 0 0 0.5rem 0;">${item.name}</h5>
                            <p style="margin: 0; color:  #8B7E74; font-weight: 600;">$${item.price}</p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <button onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})" style="background: #f0f0f0; border: none; width: 25px; height: 25px; border-radius: 50%; cursor: pointer;">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})" style="background: #f0f0f0; border: none; width: 25px; height: 25px; border-radius: 50%; cursor: pointer;">+</button>
                        </div>
                        <button onclick="cart.removeItem('${item.id}')" style="background: none; border: none; color: #ff4444; cursor: pointer; font-size: 1.2rem;">×</button>
                    `;
                    
                    cartItems.appendChild(cartItem);
                });
            }
        }

        if (cartTotal) {
            cartTotal.textContent = `Total: $${this.total.toFixed(2)}`;
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background:  #8B7E74;
            color: white;
            padding: 1rem 2rem;
            border-radius: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }

    bindEvents() {
        // Cart toggle
        const cartIcon = document.querySelector('.img-cart');
        const cartSidebar = document.getElementById('cart');
        const closeCart = document.querySelector('.close-cart');
        
        if (cartIcon && cartSidebar) {
            cartIcon.addEventListener('click', (e) => {
                e.preventDefault();
                cartSidebar.classList.add('active');
            });
        }
        
        if (closeCart && cartSidebar) {
            closeCart.addEventListener('click', () => {
                cartSidebar.classList.remove('active');
            });
        }

        // Close cart when clicking outside
        document.addEventListener('click', (e) => {
            // Skip closing once if an add-to-cart just happened
            if (window.__skipCartCloseOnce) {
                window.__skipCartCloseOnce = false;
                return;
            }

            // Use composedPath to handle cases where the cart re-renders during the click
            const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
            const clickedInsideCart = cartSidebar && (
                cartSidebar.contains(e.target) || (Array.isArray(path) && path.includes(cartSidebar))
            );
            const clickedCartIcon = cartIcon && cartIcon.contains(e.target);
            if (cartSidebar && !clickedInsideCart && !clickedCartIcon) {
                cartSidebar.classList.remove('active');
            }
        });
    }
}

// Product Management
class ProductManager {
    constructor() {
        this.products = this.readProductsFromDOM();
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupFiltering();
    }


    bindEvents() {
        // Add to cart buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart')) {
                const productCard = e.target.closest('.product-card');
                const pid = productCard && productCard.dataset.pid;
                const product = this.products.find(p => p.id === pid);
                if (product) {
                    cart.addItem(product);
                    // Keep cart open and show it after adding
                    const cartSidebar = document.getElementById('cart');
                    if (cartSidebar) {
                        cartSidebar.classList.add('active');
                        // Prevent immediate outside-click handler from closing it
                        window.__skipCartCloseOnce = true;
                    }
                }
            }
        });

        // Quick view buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-view')) {
                const productCard = e.target.closest('.product-card');
                const pid = productCard && productCard.dataset.pid;
                const product = this.products.find(p => p.id === pid);
                if (product) {
                    this.showProductModal(product);
                }
            }
        });
    }

    setupFiltering() {
        const tabButtons = document.querySelectorAll('.tab-btn, .tab-btn-active');
        const productCards = document.querySelectorAll('.product-card');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Reset active state
                tabButtons.forEach(btn => {
                    btn.classList.remove('tab-btn-active');
                    btn.classList.add('tab-btn');
                });
                // Set active state on clicked
                button.classList.add('tab-btn-active');
                button.classList.remove('tab-btn');

                const category = button.dataset.category;

                productCards.forEach(card => {
                    if (category === 'all' || card.dataset.category === category) {
                        card.style.display = 'block';
                        card.style.animation = 'fadeIn 0.5s ease';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    readProductsFromDOM() {
        const cards = Array.from(document.querySelectorAll('.product-card'));
        const products = cards.map((card, index) => {
            const nameEl = card.querySelector('h3');
            const category = card.dataset.category || '';
            const priceText = (card.querySelector('.price')?.textContent || '').replace(/[^0-9.]/g, '');
            const price = parseFloat(priceText || '0');
            const imgEl = card.querySelector('.product-image img, img');
            const image = imgEl ? imgEl.getAttribute('src') : '';
            const name = nameEl ? nameEl.textContent.trim() : `Product ${index + 1}`;
            const id = `${category || 'item'}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

            // Persist id on DOM for easy lookup later
            card.dataset.pid = id;

            return {
                id,
                name,
                category,
                price,
                image,
                description: 'Beautifully crafted piece from Elven Threads.',
                sizes: ['XS', 'S', 'M', 'L', 'XL'],
                colors: ['Black', 'Navy', 'Beige']
            };
        });
        return products;
    }

    showProductModal(product) {
        const modal = document.getElementById('productModal');
        const modalBody = modal.querySelector('.modal-body');
        
        modalBody.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start;">
                <div>
                    <img src="${product.image}" alt="${product.name}" style="width: 100%; border-radius: 15px;">
                </div>
                <div>
                    <h2 style="margin-bottom: 1rem; color: #333;">${product.name}</h2>
                    <p style="color:#333 ; font-weight: 600; font-size: 1.2rem; margin-bottom: 1rem;">$${product.price}</p>
                    <p style="color:   #666; margin-bottom: 1.5rem; line-height: 1.6;">${product.description}</p>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <h4 style="margin-bottom: 0.5rem;">Available Sizes:</h4>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            ${product.sizes.map(size => `<span style="padding: 0.5rem 1rem; border: 1px solid; color:   #666;border-radius: 5px; cursor: pointer;">${size}</span>`).join('')}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <h4 style="margin-bottom: 0.5rem;">Available Colors:</h4>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            ${product.colors.map(color => `<span style="padding: 0.5rem 1rem; border: 1px solid #ddd; border-radius: 5px; cursor: pointer;">${color}</span>`).join('')}
                        </div>
                    </div>
                    
                    <button onclick="cart.addItem(${JSON.stringify(product)}); closeProductModal();" style="background: ; color: white; border: none; padding: 1rem 2rem; border-radius: 25px; cursor: pointer; font-weight: 600; width: 100%;">
                        Add to Cart - $${product.price}
                    </button>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
        // bind modal close button if present
        const modalClose = modal.querySelector('.close-modal');
        if (modalClose) {
            modalClose.onclick = closeProductModal;
        }
    }
}

// Utility Functions
function closeProductModal() {
    const modal = document.getElementById('productModal');
    modal.style.display = 'none';
}

// Newsletter Form
function setupNewsletter() {
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = newsletterForm.querySelector('input[type="email"]').value;
            
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.style.cssText = `
                background: #8e4cafff;
                color: white;
                padding: 1rem;
                border-radius: 5px;
                margin-top: 1rem;
                text-align: center;
            `;
            successMessage.textContent = 'Thank you for subscribing to our newsletter!';
            
            newsletterForm.appendChild(successMessage);
            newsletterForm.querySelector('input[type="email"]').value = '';
            
            setTimeout(() => {
                successMessage.remove();
            }, 3000);
        });
    }
}

// Smooth Scrolling
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // Let cart handler own this event
            if (this.classList.contains('img-cart') || this.getAttribute('href') === '#cart') {
                return;
            }

            const rawHref = this.getAttribute('href') || '';
            const aliasMap = {
                '#home': '#hero',
                '#collections': '#collection',
                '#contact': '.footer'
            };
            const selector = aliasMap[rawHref] || rawHref;
            const target = document.querySelector(selector);

            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            // if target not found, do not preventDefault so browser hash behavior applies (no-op)
        });
    });

    // "Shop Now" button should scroll to collections
    const shopBtn = document.querySelector('.shop');
    if (shopBtn) {
        shopBtn.addEventListener('click', (e) => {
            const collection = document.querySelector('#collection');
            if (collection) {
                e.preventDefault();
                collection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
}

// Mobile Navigation
function setupMobileNav() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
}

// Header Scroll Effect
function setupHeaderScroll() {
    const header = document.querySelector('.header');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.classList.add('is-scrolled');
        } else {
            header.classList.remove('is-scrolled');
        }
        
        lastScroll = currentScroll;
    });

    // Apply initial state
    if (window.pageYOffset > 100) {
        header.classList.add('is-scrolled');
    } else {
        header.classList.remove('is-scrolled');
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize cart
    window.cart = new ShoppingCart();
    
    // Initialize product manager
    window.productManager = new ProductManager();
    
    // Setup other functionality
    setupNewsletter();
    setupSmoothScrolling();
    setupMobileNav();
    setupHeaderScroll();
    
    // Close modal when clicking outside
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeProductModal();
            }
        });
    }
    
    // Close modal with close button
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', closeProductModal);
    }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .nav-menu.active {
        display: flex !important;
        flex-direction: column;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        padding: 1rem;
    }
    
    .hamburger.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }
    
    .hamburger.active span:nth-child(2) {
        opacity: 0;
    }
    
    .hamburger.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }

    /* Header scrolled state: keep your theme color via CSS, not inline */
    .header.is-scrolled {
        backdrop-filter: saturate(180%) blur(8px);
        box-shadow: 0 2px 20px rgba(0, 0, 0, 0.15);
    }
        #products-grid {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: none;
        justify-content: center;
        align-items: center;
        background: rgba(0, 0, 0, 0.5); /* overlay behind modal */
        z-index: 9999;
    }

    #products-grid .product-card {
        background: #d3d3d3; /* light grey background */
        color: #333;         /* dark text for contrast */
        border-radius: 15px;
        padding: 2rem;
        max-width: 800px;
        width: 90%;
        animation: fadeIn 0.3s ease;
    }
`;
document.head.appendChild(style);


