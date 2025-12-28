/**
 * ============================================
 * AHteam - web-ecommerce-001
 * Main JavaScript
 * ============================================
 * 
 * RULES:
 * - NO external API calls
 * - NO backend dependencies
 * - Config-driven behavior only
 * - Must work standalone after export
 * ============================================
 */

(function () {
    'use strict';

    /**
     * Initialize the application
     */
    function init() {
        initMobileMenu();
        initDarkMode();
        initCart();
        initScrollEffects();
    }

    /**
     * Mobile Menu Toggle
     */
    function initMobileMenu() {
        const toggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.main-nav');

        if (toggle && nav) {
            toggle.addEventListener('click', function () {
                nav.classList.toggle('active');
                toggle.classList.toggle('active');
            });
        }
    }

    /**
     * Dark Mode Toggle
     */
    function initDarkMode() {
        const toggle = document.querySelector('.dark-mode-toggle');
        const savedTheme = localStorage.getItem('theme');

        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }

        if (toggle) {
            toggle.addEventListener('click', function () {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
            });
        }
    }

    /**
     * Shopping Cart (Local Storage)
     */
    function initCart() {
        window.Cart = {
            items: JSON.parse(localStorage.getItem('cart')) || [],

            add: function (product) {
                const existing = this.items.find(item => item.id === product.id);

                if (existing) {
                    existing.quantity += 1;
                } else {
                    this.items.push({ ...product, quantity: 1 });
                }

                this.save();
                this.updateUI();
            },

            remove: function (productId) {
                this.items = this.items.filter(item => item.id !== productId);
                this.save();
                this.updateUI();
            },

            updateQuantity: function (productId, quantity) {
                const item = this.items.find(item => item.id === productId);

                if (item) {
                    item.quantity = Math.max(0, quantity);

                    if (item.quantity === 0) {
                        this.remove(productId);
                    } else {
                        this.save();
                        this.updateUI();
                    }
                }
            },

            getTotal: function () {
                return this.items.reduce((total, item) => {
                    return total + (item.price * item.quantity);
                }, 0);
            },

            getCount: function () {
                return this.items.reduce((count, item) => count + item.quantity, 0);
            },

            save: function () {
                localStorage.setItem('cart', JSON.stringify(this.items));
            },

            clear: function () {
                this.items = [];
                this.save();
                this.updateUI();
            },

            updateUI: function () {
                const countElements = document.querySelectorAll('.cart-count');
                const count = this.getCount();

                countElements.forEach(el => {
                    el.textContent = count;
                    el.style.display = count > 0 ? 'block' : 'none';
                });

                // Dispatch custom event
                document.dispatchEvent(new CustomEvent('cartUpdated', {
                    detail: { items: this.items, total: this.getTotal(), count: count }
                }));
            }
        };

        // Initialize cart UI
        window.Cart.updateUI();
    }

    /**
     * Scroll Effects
     */
    function initScrollEffects() {
        const header = document.querySelector('.site-header');
        let lastScroll = 0;

        window.addEventListener('scroll', function () {
            const currentScroll = window.pageYOffset;

            if (header) {
                if (currentScroll > 100) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }

                if (currentScroll > lastScroll && currentScroll > 200) {
                    header.classList.add('hidden');
                } else {
                    header.classList.remove('hidden');
                }
            }

            lastScroll = currentScroll;
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
