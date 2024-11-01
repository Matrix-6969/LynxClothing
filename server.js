// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const MongoStore = require('connect-mongo'); // To store sessions in MongoDB
require('dotenv').config();

const app = express();

const jwtSecret = process.env.JWT_SECRET || 'fallbackSecret';
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: 'm&mnitkcv@1',
        resave: false,
        saveUninitialized: true,
        store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
        cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day session
    })
);

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};
connectDB();

// User schema and model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cart: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' } // Reference to Cart
});
const User = mongoose.model('User', userSchema);

// Cart schema and model
const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
        {
            productId: { type: String, required: true }, // Use a product schema in production
            quantity: { type: Number, required: true },
            size: { type: String, enum: ['S', 'M', 'L', 'XL', 'XXL'], required: true }
        }
    ]
});
const Cart = mongoose.model('Cart', cartSchema);

// Routes

// Signup Route
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    try {
        await newUser.save();
        res.status(201).json({ message: 'User created successfully!' });
    } catch (error) {
        res.status(400).json({ message: 'Error creating user.', error });
    }
});

// Login Route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
        const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '1h' });
        req.session.user = user; // Store user info in session
        return res.json({ token });
    }

    return res.status(401).json({ message: 'Invalid email or password.' });
});

// Logout Route
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.status(200).json({ message: 'Logged out successfully' });
    });
});

// Cart Routes

// Get or Create Cart
app.get('/cart', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    let cart = await Cart.findOne({ userId: req.session.user._id });
    if (!cart) {
        cart = await Cart.create({ userId: req.session.user._id, items: [] });
    }
    res.status(200).json(cart);
});

// Add Item to Cart
app.post('/cart/add', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { productId, quantity, size } = req.body;
    let cart = await Cart.findOne({ userId: req.session.user._id });

    const itemIndex = cart.items.findIndex(item => item.productId === productId && item.size === size);
    if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity; // Update quantity if item exists
    } else {
        cart.items.push({ productId, quantity, size }); // Add new item
    }
    await cart.save();
    res.status(200).json({ message: 'Item added to cart', cart });
});

// Remove Item from Cart
app.post('/cart/remove', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { productId, size } = req.body;
    let cart = await Cart.findOne({ userId: req.session.user._id });

    cart.items = cart.items.filter(item => !(item.productId === productId && item.size === size));
    await cart.save();
    res.status(200).json({ message: 'Item removed from cart', cart });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
