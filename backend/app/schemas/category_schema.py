from marshmallow import Schema, fields, validate

class CategorySchema(Schema):
    """Schema for serializing and deserializing Category objects"""
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    description = fields.Str(allow_none=True)
    image_url = fields.Str(allow_none=True)
    slug = fields.Str(dump_only=True)
    parent_id = fields.Int(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    has_children = fields.Bool(dump_only=True)
    product_count = fields.Int(dump_only=True)

class CategoryCreateSchema(Schema):
    """Schema for creating a new Category"""
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    description = fields.Str(allow_none=True)
    image_url = fields.Str(allow_none=True)
    parent_id = fields.Int(allow_none=True)

class CategoryUpdateSchema(Schema):
    """Schema for updating an existing Category"""
    name = fields.Str(validate=validate.Length(min=2, max=100))
    description = fields.Str(allow_none=True)
    image_url = fields.Str(allow_none=True)
    parent_id = fields.Int(allow_none=True) 