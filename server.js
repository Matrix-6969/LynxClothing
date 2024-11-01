// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const userRoutes = require('./routes/user'); // User routes
const sessionRoutes = require('./routes/session'); // Session routes
const cartRoutes = require('./routes/cartroute'); // Cart routes
const productRoutes = require('./routes/productroute'); // Product routes
require('dotenv').config();

const app = express();

// MongoDB session store
const store = new MongoDBStore({
    uri: process.env.MONGODB_URI,
    collection: 'sessions',
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'fallbackSecret',
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Use routes
app.use('/user', userRoutes);
app.use('/session', sessionRoutes);
app.use('/cart', cartRoutes);
app.use('/products', productRoutes);

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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
