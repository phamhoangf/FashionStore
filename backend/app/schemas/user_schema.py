from marshmallow import Schema, fields, validate, validates, ValidationError
from ..models import User

class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    email = fields.Email(required=True)
    password = fields.Str(load_only=True, required=True, validate=validate.Length(min=6))
    first_name = fields.Str()
    last_name = fields.Str()
    phone = fields.Str(validate=validate.Length(max=20))
    address = fields.Str(validate=validate.Length(max=255))
    is_admin = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    
    @validates('email')
    def validate_email(self, value):
        if User.query.filter_by(email=value).first():
            raise ValidationError('Email already exists.')

class UserLoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)

class UserUpdateSchema(Schema):
    first_name = fields.Str()
    last_name = fields.Str()
    phone = fields.Str(validate=validate.Length(max=20))
    address = fields.Str(validate=validate.Length(max=255))
    current_password = fields.Str()
    new_password = fields.Str(validate=validate.Length(min=6))