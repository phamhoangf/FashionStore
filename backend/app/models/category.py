from app import db
from datetime import datetime
from sqlalchemy.orm import validates
import re
import unicodedata

class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    image_url = db.Column(db.String(255))
    slug = db.Column(db.String(120), unique=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    products = db.relationship('Product', backref='category', lazy=True)
    children = db.relationship('Category', backref=db.backref('parent', remote_side=[id]), lazy=True)
    
    # Validations
    @validates('name')
    def validate_name(self, key, name):
        if not name or len(name.strip()) == 0:
            raise ValueError("Category name cannot be empty")
        return name
    
    @validates('slug')
    def validate_slug(self, key, slug):
        if slug and not re.match(r'^[a-z0-9-]+$', slug):
            raise ValueError("Slug can only contain lowercase letters, numbers, and hyphens")
        return slug
    
    def __init__(self, name, description=None, image_url=None, parent_id=None):
        self.name = name
        self.description = description
        self.image_url = image_url
        self.parent_id = parent_id
        # Generate slug from name if not provided
        if not hasattr(self, 'slug') or not self.slug:
            self.slug = self.generate_slug(name, parent_id)
    
    def generate_slug(self, name, parent_id=None):
        """Generate a URL-friendly slug from the category name"""
        # Chuyển đổi Unicode thành ASCII
        name = unicodedata.normalize('NFKD', name).encode('ASCII', 'ignore').decode('ASCII')
        # Convert to lowercase, replace spaces with hyphens, remove special chars
        slug = name.lower().strip()
        slug = re.sub(r'[^\w\s-]', '', slug)
        slug = re.sub(r'[\s_-]+', '-', slug)
        
        # Thêm parent_id vào slug để tránh trùng lặp
        if parent_id:
            slug = f"{slug}-{parent_id}"
            
        return slug
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'image_url': self.image_url,
            'slug': self.slug,
            'parent_id': self.parent_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'has_children': len(self.children) > 0 if self.children else False,
            'product_count': len(self.products) if self.products else 0
        }
    
    def get_all_children(self):
        """Get all child categories recursively"""
        all_children = []
        for child in self.children:
            all_children.append(child)
            all_children.extend(child.get_all_children())
        return all_children
    
    def get_products_count(self):
        """Count all products in this category and its sub-categories"""
        count = len(self.products)
        for child in self.children:
            count += child.get_products_count()
        return count
    
    @classmethod
    def get_category_tree(cls):
        """Return a hierarchical representation of all categories"""
        # Get all root categories (no parent)
        root_categories = cls.query.filter_by(parent_id=None).all()
        
        def build_tree(category):
            return {
                'id': category.id,
                'name': category.name,
                'slug': category.slug,
                'image_url': category.image_url,
                'children': [build_tree(child) for child in category.children]
            }
        
        return [build_tree(category) for category in root_categories]