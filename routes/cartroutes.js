const express = require('express');
const router = express.Router();
const Cart = require('./models/cart'); // Adjust the path as necessary
const Product = require('./models/product'); // Adjust the path as necessary

// Middleware to ensure user is logged in
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
};

// Get cart for the logged-in user
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId; // Assuming user ID is stored in session
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        res.json(cart || { items: [] });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cart', error });
    }
});

// Add an item to the cart
router.post('/add', isAuthenticated, async (req, res) => {
    const { productId, size, quantity } = req.body;
    const userId = req.session.userId;

    try {
        // Find or create a cart for the user
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Check if the item already exists in the cart
        const existingItem = cart.items.find(item => item.productId.equals(productId) && item.size === size);

        if (existingItem) {
            // If it exists, update the quantity
            existingItem.quantity += quantity;
        } else {
            // If not, add a new item
            cart.items.push({ productId, size, quantity });
        }

        await cart.save();
        res.status(200).json({ message: 'Item added to cart', cart });
    } catch (error) {
        res.status(500).json({ message: 'Error adding item to cart', error });
    }
});

// Update item quantity in the cart
router.post('/update', isAuthenticated, async (req, res) => {
    const { productId, size, quantity } = req.body;
    const userId = req.session.userId;

    try {
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const existingItem = cart.items.find(item => item.productId.equals(productId) && item.size === size);

        if (existingItem) {
            existingItem.quantity = quantity;

            // Remove item if quantity is 0
            if (existingItem.quantity <= 0) {
                cart.items = cart.items.filter(item => item !== existingItem);
            }

            await cart.save();
            res.status(200).json({ message: 'Cart updated', cart });
        } else {
            res.status(404).json({ message: 'Item not found in cart' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating cart', error });
    }
});

// Remove an item from the cart
router.post('/remove', isAuthenticated, async (req, res) => {
    const { productId, size } = req.body;
    const userId = req.session.userId;

    try {
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => !(item.productId.equals(productId) && item.size === size));

        await cart.save();
        res.status(200).json({ message: 'Item removed from cart', cart });
    } catch (error) {
        res.status(500).json({ message: 'Error removing item from cart', error });
    }
});

module.exports = router;
