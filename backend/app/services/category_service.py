from app import db
from app.models.category import Category
from app.utils.validators import validate_category_data
from sqlalchemy.exc import IntegrityError

class CategoryService:
    @staticmethod
    def get_all_categories():
        """Get all categories"""
        return Category.query.all()
    
    @staticmethod
    def get_category_by_id(category_id):
        """Get a category by ID"""
        return Category.query.get_or_404(category_id)
    
    @staticmethod
    def get_category_tree():
        """Get hierarchical category tree"""
        return Category.get_category_tree()
    
    @staticmethod
    def create_category(data):
        """Create a new category"""
        # Validate data
        validation_result = validate_category_data(data)
        if validation_result:
            return None, validation_result
        
        try:
            category = Category(
                name=data['name'],
                description=data.get('description'),
                image_url=data.get('image_url'),
                parent_id=data.get('parent_id')
            )
            
            db.session.add(category)
            db.session.commit()
            return category, None
        except IntegrityError as e:
            db.session.rollback()
            if 'Duplicate entry' in str(e) and 'name' in str(e):
                return None, "Category name already exists"
            return None, str(e)
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def update_category(category_id, data):
        """Update an existing category"""
        category = Category.query.get_or_404(category_id)
        
        # Validate data
        validation_result = validate_category_data(data, update=True)
        if validation_result:
            return None, validation_result
        
        try:
            if 'name' in data:
                category.name = data['name']
            if 'description' in data:
                category.description = data['description']
            if 'image_url' in data:
                category.image_url = data['image_url']
            if 'parent_id' in data:
                category.parent_id = data['parent_id']
            
            db.session.commit()
            return category, None
        except IntegrityError as e:
            db.session.rollback()
            if 'Duplicate entry' in str(e) and 'name' in str(e):
                return None, "Category name already exists"
            return None, str(e)
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def delete_category(category_id):
        """Delete a category"""
        category = Category.query.get_or_404(category_id)
        
        # Check if category has products
        if category.get_products_count() > 0:
            return False, "Cannot delete category with products"
        
        # Check if category has children
        if category.children and len(category.children) > 0:
            return False, "Cannot delete category with subcategories"
        
        try:
            db.session.delete(category)
            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, str(e) 