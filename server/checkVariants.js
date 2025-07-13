// Quick script to check available product variants
import mongoose from 'mongoose';
import ProductVariantSchema from './models/ProductVariantSchema.js';
import './config/db.js';

setTimeout(async () => {
    try {
        const variants = await ProductVariantSchema.find().limit(10);
        console.log('Available Product Variants:');
        variants.forEach(v => {
            console.log(`ID: ${v._id}, Name: ${v.name}, Stock: ${v.stock}, Price: ${v.price}`);
        });
        
        if (variants.length === 0) {
            console.log('No product variants found. Need to create some for testing.');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}, 1000);
