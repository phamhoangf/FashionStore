from flask import Blueprint, request, jsonify
from app import db
from app.models.category import Category
from app.utils.validators import validate_category_data
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.category_service import CategoryService

bp = Blueprint('categories', __name__, url_prefix='/api/categories')

@bp.route('', methods=['GET'])
def get_categories():
    categories = CategoryService.get_all_categories()
    return jsonify([c.to_dict() for c in categories]), 200

@bp.route('/<int:id>', methods=['GET'])
def get_category(id):
    category = CategoryService.get_category_by_id(id)
    return jsonify(category.to_dict()), 200

@bp.route('/tree', methods=['GET'])
def get_category_tree():
    tree = CategoryService.get_category_tree()
    return jsonify(tree), 200

@bp.route('', methods=['POST'])
@jwt_required()
def create_category():
    data = request.get_json()
    
    category, error = CategoryService.create_category(data)
    if error:
        return jsonify({"error": error}), 400
    
    return jsonify(category.to_dict()), 201

@bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_category(id):
    data = request.get_json()
    
    category, error = CategoryService.update_category(id, data)
    if error:
        return jsonify({"error": error}), 400
    
    return jsonify(category.to_dict()), 200

@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_category(id):
    success, error = CategoryService.delete_category(id)
    if not success:
        return jsonify({"error": error}), 400
    
    return jsonify({"message": "Category deleted successfully"}), 200