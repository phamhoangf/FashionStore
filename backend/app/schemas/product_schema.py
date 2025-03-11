from marshmallow import Schema, fields, validate

class CategorySchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    description = fields.Str()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    products_count = fields.Int(dump_only=True)

class ProductSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=3, max=200))
    description = fields.Str()
    price = fields.Float(required=True, validate=validate.Range(min=0))
    image_url = fields.Str()
    stock = fields.Int(required=True, validate=validate.Range(min=0))
    category_id = fields.Int(required=True)
    category = fields.Nested(CategorySchema, dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class ProductUpdateSchema(Schema):
    name = fields.Str(validate=validate.Length(min=3, max=200))
    description = fields.Str()
    price = fields.Float(validate=validate.Range(min=0))
    image_url = fields.Str()
    stock = fields.Int(validate=validate.Range(min=0))
    category_id = fields.Int()