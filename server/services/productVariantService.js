const BaseService = require('./baseService');
const ProductVariant = require('../models/ProductVariantSchema');
const Product = require('../models/ProductSchema');
const Color = require('../models/ColorSchema');
const Size = require('../models/SizeSchema');
const { AppError } = require('../middlewares/errorHandler');
const {
  productVariantMessages,
  productMessages,
  colorMessages,
  sizeMessages,
  generalMessages,
  PAGINATION
} = require('../config/constants');

class ProductVariantService extends BaseService {
  constructor() {
    super(ProductVariant);
  }

  async _validateReferences(productId, colorId, sizeId) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError(productMessages.PRODUCT_NOT_FOUND, 404);
    }
    const color = await Color.findById(colorId);
    if (!color) {
      throw new AppError(colorMessages.COLOR_NOT_FOUND, 404);
    }
    const size = await Size.findById(sizeId);
    if (!size) {
      throw new AppError(sizeMessages.SIZE_NOT_FOUND, 404);
    }
  }

  async createProductVariant(data) {
    const { product, color, size, price, stock, images } = data;
    await this._validateReferences(product, color, size);

    // Check for existing variant with the same product, color, and size
    const existingVariant = await this.Model.findOne({ product, color, size });
    if (existingVariant) {
      throw new AppError(productVariantMessages.VARIANT_EXISTS, 409);
    }

    const newVariant = new this.Model({ product, color, size, price, stock, images });
    await newVariant.save();
    return newVariant.populate('product color size');
  }

  async getAllProductVariants(queryParams) {
    const {
      page = PAGINATION.DEFAULT_PAGE, // Use PAGINATION
      limit = PAGINATION.DEFAULT_LIMIT, // Use PAGINATION
      sortBy = 'createdAt',
      sortOrder = 'desc',
      product,
      color,
      size,
      minPrice,
      maxPrice,
      minStock,
      maxStock
    } = queryParams;

    // Direct implementation of buildQuery logic
    const query = {};
    if (product) query.product = product;
    if (color) query.color = color;
    if (size) query.size = size;

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
    }

    if (minStock !== undefined || maxStock !== undefined) {
      query.stock = {};
      if (minStock !== undefined) query.stock.$gte = parseInt(minStock, 10);
      if (maxStock !== undefined) query.stock.$lte = parseInt(maxStock, 10);
    }
    
    const totalVariants = await this.Model.countDocuments(query);
    const variants = await this.Model.find(query)
      .populate('product color size')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10)) // Ensure page and limit are numbers for calculation
      .limit(parseInt(limit, 10));

    return {
      data: variants,
      // Direct implementation of applyPagination logic
      total: totalVariants,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(totalVariants / parseInt(limit, 10)),
    };
  }

  async getProductVariantById(id) {
    const variant = await this.Model.findById(id).populate('product color size');
    if (!variant) {
      throw new AppError(productVariantMessages.VARIANT_NOT_FOUND, 404);
    }
    return variant;
  }

  async updateProductVariantById(id, updateData) {
    const { product, color, size, ...restOfData } = updateData;

    const variant = await this.Model.findById(id);
    if (!variant) {
      throw new AppError(productVariantMessages.VARIANT_NOT_FOUND, 404);
    }

    if (product || color || size) {
      const currentProduct = product || variant.product;
      const currentColor = color || variant.color;
      const currentSize = size || variant.size;
      await this._validateReferences(currentProduct, currentColor, currentSize);

      // Check if the new combination of product, color, and size already exists for another variant
      if ( (product && product.toString() !== variant.product.toString()) || 
           (color && color.toString() !== variant.color.toString()) || 
           (size && size.toString() !== variant.size.toString()) ) {
        const existingVariant = await this.Model.findOne({ 
          product: currentProduct, 
          color: currentColor, 
          size: currentSize,
          _id: { $ne: id } 
        });
        if (existingVariant) {
          throw new AppError(productVariantMessages.VARIANT_EXISTS, 409);
        }
      }
      if(product) variant.product = product;
      if(color) variant.color = color;
      if(size) variant.size = size;
    }
    
    Object.assign(variant, restOfData);
    await variant.save();
    return variant.populate('product color size');
  }

  async deleteProductVariantById(id) {
    const variant = await this.Model.findById(id);
    if (!variant) {
      throw new AppError(productVariantMessages.VARIANT_NOT_FOUND, 404);
    }
    // Add any checks here if a variant cannot be deleted (e.g., if it's part of an active order)
    // For now, we allow direct deletion.
    await this.Model.findByIdAndDelete(id);
    return { message: productVariantMessages.VARIANT_DELETED_SUCCESSFULLY };
  }

  // Specific method to get variants for a single product (can be public)
  async getVariantsByProductId(productId, queryParams) {
    const {
      page = PAGINATION.DEFAULT_PAGE, // Use PAGINATION
      limit = PAGINATION.DEFAULT_LIMIT, // Use PAGINATION
      sortBy = 'createdAt',
      sortOrder = 'desc',
      color,
      size,
      minPrice,
      maxPrice,
      minStock,
      maxStock
    } = queryParams;

    const productExists = await Product.findById(productId);
    if (!productExists) {
        throw new AppError(productMessages.PRODUCT_NOT_FOUND, 404);
    }

    // Direct implementation of buildQuery logic
    const query = { product: productId };
    if (color) query.color = color;
    if (size) query.size = size;

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
    }

    if (minStock !== undefined || maxStock !== undefined) {
      query.stock = {};
      if (minStock !== undefined) query.stock.$gte = parseInt(minStock, 10);
      if (maxStock !== undefined) query.stock.$lte = parseInt(maxStock, 10);
    }

    const totalVariants = await this.Model.countDocuments(query);
    const variants = await this.Model.find(query)
      .populate('color size') // Product info is redundant here as it's fixed by productId
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10)) // Ensure page and limit are numbers
      .limit(parseInt(limit, 10));
    
    return {
      data: variants,
      // Direct implementation of applyPagination logic
      total: totalVariants,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(totalVariants / parseInt(limit, 10)),
    };
  }

  // Specific method to update stock (can be used internally or by specific admin endpoints)
  async updateStock(variantId, quantityChange, operation = 'decrease') {
    const variant = await this.Model.findById(variantId);
    if (!variant) {
      throw new AppError(productVariantMessages.VARIANT_NOT_FOUND, 404);
    }

    if (operation === 'decrease') {
      if (variant.stock < quantityChange) {
        throw new AppError(productVariantMessages.INSUFFICIENT_STOCK, 400);
      }
      variant.stock -= quantityChange;
    } else if (operation === 'increase') {
      variant.stock += quantityChange;
    } else {
      throw new AppError(generalMessages.INVALID_OPERATION, 400);
    }
    
    await variant.save();
    return variant;
  }
}

module.exports = ProductVariantService;
