const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    sizes: { type: [String], required: true }, // e.g., ["S", "M", "L", "XL"]
});

const Product = mongoose.model('Product', productSchema);
module.exports = product;
