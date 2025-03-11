from marshmallow import Schema, fields, validate

class OrderItemSchema(Schema):
    id = fields.Int(dump_only=True)
    product_id = fields.Int(required=True)
    quantity = fields.Int(required=True, validate=validate.Range(min=1))
    price = fields.Float(dump_only=True)
    product_name = fields.Str(dump_only=True)
    subtotal = fields.Float(dump_only=True)
    created_at = fields.DateTime(dump_only=True)

class OrderSchema(Schema):
    id = fields.Int(dump_only=True)
    user_id = fields.Int(dump_only=True)
    status = fields.Str(dump_only=True)
    total_amount = fields.Float(dump_only=True)
    shipping_address = fields.Str(required=True, validate=validate.Length(max=255))
    shipping_city = fields.Str(required=True, validate=validate.Length(max=100))
    shipping_phone = fields.Str(required=True, validate=validate.Length(max=20))
    payment_method = fields.Str(required=True, validate=validate.OneOf(['cod', 'vnpay', 'stripe']))
    payment_status = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    items = fields.Nested(OrderItemSchema, many=True, required=True)

class OrderUpdateSchema(Schema):
    status = fields.Str(validate=validate.OneOf(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']))
    payment_status = fields.Str(validate=validate.OneOf(['pending', 'paid', 'failed']))