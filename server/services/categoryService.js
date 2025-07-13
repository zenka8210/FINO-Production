const BaseService = require('./baseService');
const Category = require('../models/CategorySchema');
const Product = require('../models/ProductSchema');
const { AppError } = require('../middlewares/errorHandler');
const { QueryUtils } = require('../utils/queryUtils');

class CategoryService extends BaseService {
    constructor() {
        super(Category);
    }

    // ============= BASIC CRUD OPERATIONS =============

    async getAllCategories(queryOptions = {}) {
        const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'asc' } = queryOptions;
        const skip = (page - 1) * limit;
        const filter = { isActive: true };

        // Search by name or description
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        try {
            const categories = await Category.find(filter)
                .populate('parent', 'name')
                .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Category.countDocuments(filter);

            return {
                data: categories,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            throw new AppError('Lỗi lấy danh sách danh mục', 500);
        }
    }

    async getCategoryById(categoryId) {
        try {
            const category = await Category.findById(categoryId)
                .populate('parent', 'name description');
            
            if (!category || !category.isActive) {
                throw new AppError('Không tìm thấy danh mục', 404);
            }
            return category;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi lấy thông tin danh mục', 500);
        }
    }

    async createCategory(categoryData) {
        try {
            // Business Logic: Validate parent exists if provided
            if (categoryData.parent) {
                await this.validateParentCategory(categoryData.parent);
            }

            const newCategory = new Category(categoryData);
            await newCategory.save();
            
            // Populate parent info for response
            await newCategory.populate('parent', 'name');
            return newCategory;
        } catch (error) {
            if (error instanceof AppError) throw error;
            if (error.code === 11000) {
                throw new AppError('Tên danh mục đã tồn tại', 400);
            }
            throw new AppError('Lỗi tạo danh mục mới', 400);
        }
    }

    async updateCategory(categoryId, updateData) {
        try {
            // Business Logic: Validate parent if being updated
            if (updateData.parent) {
                await this.validateParentCategory(updateData.parent, categoryId);
                await this.checkCircularReference(categoryId, updateData.parent);
            }

            const category = await Category.findByIdAndUpdate(
                categoryId, 
                updateData, 
                { new: true, runValidators: true }
            ).populate('parent', 'name');
            
            if (!category) {
                throw new AppError('Không tìm thấy danh mục', 404);
            }
            return category;
        } catch (error) {
            if (error instanceof AppError) throw error;
            if (error.code === 11000) {
                throw new AppError('Tên danh mục đã tồn tại', 400);
            }
            throw new AppError('Lỗi cập nhật danh mục', 400);
        }
    }

    async deleteCategory(categoryId) {
        try {
            // Business Logic: Check if category can be deleted
            await this.canDeleteCategory(categoryId);

            const category = await Category.findByIdAndUpdate(
                categoryId,
                { isActive: false },
                { new: true }
            );
            
            if (!category) {
                throw new AppError('Không tìm thấy danh mục', 404);
            }
            
            return { message: 'Xóa danh mục thành công' };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi xóa danh mục', 500);
        }
    }

    // ============= BUSINESS LOGIC METHODS =============

    /**
     * Business Logic: Kiểm tra danh mục cha có tồn tại và active không
     */
    async validateParentCategory(parentId, excludeId = null) {
        if (!parentId) return true;

        // Không thể set parent là chính nó
        if (excludeId && parentId.toString() === excludeId.toString()) {
            throw new AppError('Danh mục không thể làm cha của chính nó', 400);
        }

        const parentCategory = await Category.findById(parentId);
        if (!parentCategory || !parentCategory.isActive) {
            throw new AppError('Danh mục cha không tồn tại hoặc đã bị vô hiệu hóa', 400);
        }

        return true;
    }

    /**
     * Business Logic: Kiểm tra circular reference trong hierarchy
     */
    async checkCircularReference(categoryId, newParentId) {
        if (!newParentId) return true;

        // Lấy tất cả ancestors của newParent
        const ancestors = await this.getCategoryAncestors(newParentId);
        
        // Kiểm tra xem categoryId có nằm trong ancestors không
        if (ancestors.some(ancestor => ancestor._id.toString() === categoryId.toString())) {
            throw new AppError('Không thể tạo vòng tròn trong phân cấp danh mục', 400);
        }

        return true;
    }

    /**
     * Business Logic: Lấy tất cả tổ tiên của một danh mục
     */
    async getCategoryAncestors(categoryId) {
        const ancestors = [];
        let currentCategory = await Category.findById(categoryId);

        while (currentCategory && currentCategory.parent) {
            const parent = await Category.findById(currentCategory.parent);
            if (parent) {
                ancestors.push(parent);
                currentCategory = parent;
            } else {
                break;
            }
        }

        return ancestors;
    }

    /**
     * Business Logic: Kiểm tra danh mục có thể xóa không
     * Nghiệp vụ: Không được xóa danh mục nếu còn sản phẩm đang sử dụng hoặc có danh mục con
     */
    async canDeleteCategory(categoryId) {
        try {
            // Kiểm tra danh mục có tồn tại không
            const category = await this.getCategoryById(categoryId);

            // Kiểm tra có danh mục con không
            const childCategories = await Category.countDocuments({ 
                parent: categoryId, 
                isActive: true 
            });
            
            if (childCategories > 0) {
                throw new AppError(`Không thể xóa danh mục "${category.name}" vì còn ${childCategories} danh mục con`, 400);
            }

            // Kiểm tra có sản phẩm đang sử dụng không
            const productsCount = await Product.countDocuments({ 
                category: categoryId 
            });
            
            if (productsCount > 0) {
                throw new AppError(`Không thể xóa danh mục "${category.name}" vì còn ${productsCount} sản phẩm đang sử dụng`, 400);
            }

            return {
                canDelete: true,
                category: category.name,
                message: `Danh mục "${category.name}" có thể xóa an toàn`
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi kiểm tra khả năng xóa danh mục: ' + error.message, 500);
        }
    }

    /**
     * Business Logic: Lấy cây danh mục phân cấp
     */
    async getCategoryTree() {
        try {
            const categories = await Category.find({ isActive: true })
                .sort({ name: 1 });
            
            // Build tree structure
            const categoryMap = {};
            const tree = [];
            
            // First pass: create map
            categories.forEach(cat => {
                categoryMap[cat._id] = { 
                    ...cat.toObject(), 
                    children: [] 
                };
            });
            
            // Second pass: build tree
            categories.forEach(cat => {
                if (cat.parent && categoryMap[cat.parent]) {
                    categoryMap[cat.parent].children.push(categoryMap[cat._id]);
                } else if (!cat.parent) {
                    tree.push(categoryMap[cat._id]);
                }
            });
            
            return tree;
        } catch (error) {
            throw new AppError('Lỗi lấy cây danh mục', 500);
        }
    }

    /**
     * Business Logic: Lấy danh mục gốc (root categories)
     */
    async getRootCategories() {
        try {
            const rootCategories = await Category.find({ 
                parent: null, 
                isActive: true 
            }).sort({ name: 1 });
            
            return rootCategories;
        } catch (error) {
            throw new AppError('Lỗi lấy danh mục gốc', 500);
        }
    }

    /**
     * Business Logic: Lấy danh mục con của một danh mục
     */
    async getChildCategories(parentId) {
        try {
            await this.getCategoryById(parentId); // Validate parent exists
            
            const childCategories = await Category.find({ 
                parent: parentId, 
                isActive: true 
            }).sort({ name: 1 });
            
            return childCategories;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi lấy danh mục con', 500);
        }
    }

    /**
     * Business Logic: Lấy đường dẫn đầy đủ của danh mục (breadcrumb)
     */
    async getCategoryPath(categoryId) {
        try {
            const category = await this.getCategoryById(categoryId);
            const ancestors = await this.getCategoryAncestors(categoryId);
            
            // Reverse để có thứ tự từ gốc đến lá
            const path = [...ancestors.reverse(), category];
            
            return {
                category,
                path,
                breadcrumb: path.map(cat => ({
                    _id: cat._id,
                    name: cat.name
                }))
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi lấy đường dẫn danh mục', 500);
        }
    }

    /**
     * Lấy thống kê về danh mục
     */
    async getCategoryStats(categoryId) {
        try {
            const category = await this.getCategoryById(categoryId);
            
            const [childrenCount, productsCount] = await Promise.all([
                Category.countDocuments({ parent: categoryId, isActive: true }),
                Product.countDocuments({ category: categoryId })
            ]);
            
            return {
                category,
                stats: {
                    childrenCount,
                    productsCount,
                    hasChildren: childrenCount > 0,
                    hasProducts: productsCount > 0,
                    canDelete: childrenCount === 0 && productsCount === 0
                }
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Lỗi lấy thống kê danh mục', 500);
        }
    }

    /**
     * Get all categories using new Query Middleware
     * @param {Object} queryParams - Query parameters from request
     * @returns {Object} Query results with pagination
     */
    async getAllCategoriesWithQuery(queryParams) {
        try {
            // Sử dụng QueryUtils với pre-configured setup cho Category
            const result = await QueryUtils.getCategories(Category, queryParams);
            
            return result;
        } catch (error) {
            throw new AppError(
                `Error fetching categories: ${error.message}`,
                'CATEGORY_FETCH_FAILED',
                500
            );
        }
    }
}

module.exports = CategoryService;
