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

  /**
   * Business Rule: Check if variant can be added to cart
   * - Quantity must be > 0
   * - Must have sufficient stock
   */
  async validateCartAddition(variantId, quantity) {
    try {
      const variant = await this.Model.findById(variantId).populate('product', 'name isActive');
      
      if (!variant) {
        throw new AppError('Variant không tồn tại', 404, 'VARIANT_NOT_FOUND');
      }

      // Check if product is active
      if (!variant.product.isActive) {
        throw new AppError('Sản phẩm đã bị ẩn', 400, 'PRODUCT_INACTIVE');
      }

      // Check if variant is active
      if (!variant.isActive) {
        throw new AppError('Variant đã bị ẩn', 400, 'VARIANT_INACTIVE');
      }

      // Business Rule: Quantity must be > 0
      if (quantity <= 0) {
        throw new AppError('Số lượng phải lớn hơn 0', 400, 'INVALID_QUANTITY');
      }

      // Business Rule: Cannot add out of stock items to cart
      if (variant.stock <= 0) {
        throw new AppError('Sản phẩm đã hết hàng', 400, 'OUT_OF_STOCK');
      }

      // Business Rule: Cannot add more than available stock
      if (quantity > variant.stock) {
        throw new AppError(`Không đủ hàng. Còn lại: ${variant.stock}, yêu cầu: ${quantity}`, 400, 'INSUFFICIENT_STOCK');
      }

      return {
        canAdd: true,
        variant: variant,
        availableStock: variant.stock
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Lỗi kiểm tra variant cho giỏ hàng', 500, 'CART_VALIDATION_ERROR');
    }
  }

  /**
   * Business Rule: Check if all variants of a product are out of stock
   */
  async checkProductOutOfStock(productId) {
    try {
      const variants = await this.Model.find({ 
        product: productId, 
        isActive: true 
      });

      if (variants.length === 0) {
        return {
          allOutOfStock: true,
          reason: 'Sản phẩm không có variant nào'
        };
      }

      const inStockVariants = variants.filter(variant => variant.stock > 0);
      
      if (inStockVariants.length === 0) {
        return {
          allOutOfStock: true,
          reason: 'Tất cả variant đã hết hàng',
          totalVariants: variants.length,
          outOfStockVariants: variants.length
        };
      }

      return {
        allOutOfStock: false,
        totalVariants: variants.length,
        inStockVariants: inStockVariants.length,
        outOfStockVariants: variants.length - inStockVariants.length
      };
    } catch (error) {
      throw new AppError('Lỗi kiểm tra tồn kho sản phẩm', 500, 'STOCK_CHECK_ERROR');
    }
  }

  /**
   * Get all variants that are out of stock
   */
  async getOutOfStockVariants(queryParams = {}) {
    try {
      const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        product
      } = queryParams;

      const query = { 
        stock: { $lte: 0 },
        isActive: true
      };
      
      if (product) {
        query.product = product;
      }

      const totalVariants = await this.Model.countDocuments(query);
      const variants = await this.Model.find(query)
        .populate('product color size')
        .sort({ updatedAt: -1 })
        .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
        .limit(parseInt(limit, 10));

      return {
        data: variants,
        total: totalVariants,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(totalVariants / parseInt(limit, 10)),
      };
    } catch (error) {
      throw new AppError('Lỗi lấy danh sách variant hết hàng', 500, 'OUT_OF_STOCK_VARIANTS_ERROR');
    }
  }

  /**
   * Enhanced stock update with validation
   */
  async updateStockWithValidation(variantId, quantityChange, operation = 'decrease') {
    const variant = await this.Model.findById(variantId);
    if (!variant) {
      throw new AppError(productVariantMessages.VARIANT_NOT_FOUND, 404);
    }

    let newStock;
    if (operation === 'decrease') {
      if (variant.stock < quantityChange) {
        throw new AppError(`Không đủ hàng để trừ. Hiện có: ${variant.stock}, yêu cầu trừ: ${quantityChange}`, 400, 'INSUFFICIENT_STOCK');
      }
      newStock = variant.stock - quantityChange;
    } else if (operation === 'increase') {
      newStock = variant.stock + quantityChange;
    } else {
      throw new AppError('Thao tác không hợp lệ. Chỉ cho phép "increase" hoặc "decrease"', 400, 'INVALID_OPERATION');
    }

    // Ensure stock doesn't go negative
    if (newStock < 0) {
      throw new AppError('Tồn kho không được âm', 400, 'NEGATIVE_STOCK');
    }

    variant.stock = newStock;
    await variant.save();

    // Check if product should be hidden after stock update
    const stockCheck = await this.checkProductOutOfStock(variant.product);
    
    return {
      variant: await variant.populate('product color size'),
      stockInfo: stockCheck
    };
  }
}

module.exports = ProductVariantService;
