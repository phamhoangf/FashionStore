from flask import Blueprint, jsonify, current_app, request, send_from_directory
import os
from werkzeug.utils import secure_filename
import uuid

bp = Blueprint('debug', __name__, url_prefix='/api/debug')

@bp.route('/config', methods=['GET'])
def get_config():
    """Lấy thông tin cấu hình"""
    config = {
        'UPLOAD_FOLDER': current_app.config['UPLOAD_FOLDER'],
        'UPLOAD_FOLDER_EXISTS': os.path.exists(current_app.config['UPLOAD_FOLDER']),
        'API_URL': request.host_url.rstrip('/'),
        'STATIC_URL': request.host_url.rstrip('/') + '/static',
        'UPLOADS_URL': request.host_url.rstrip('/') + '/api/uploads'
    }
    return jsonify(config)

@bp.route('/payment-config', methods=['GET'])
def get_payment_config():
    """Lấy thông tin cấu hình thanh toán VNPay (ẩn thông tin nhạy cảm)"""
    payment_config = {
        'VNPAY_TMN_CODE': current_app.config.get('VNPAY_TMN_CODE', 'Not configured'),
        'VNPAY_HASH_SECRET_KEY': '********' if current_app.config.get('VNPAY_HASH_SECRET_KEY') else 'Not configured',
        'VNPAY_PAYMENT_URL': current_app.config.get('VNPAY_PAYMENT_URL', 'Not configured'),
        'VNPAY_RETURN_URL': current_app.config.get('VNPAY_RETURN_URL', 'Not configured'),
        'FRONTEND_URL': current_app.config.get('FRONTEND_URL', 'Not configured')
    }
    return jsonify(payment_config)

@bp.route('/image', methods=['GET'])
def check_image():
    """Kiểm tra đường dẫn ảnh"""
    url = request.args.get('url', '')
    
    if not url:
        return jsonify({'error': 'No URL provided'}), 400
    
    # Nếu URL bắt đầu bằng http hoặc https, không thể kiểm tra
    if url.startswith('http://') or url.startswith('https://'):
        return jsonify({
            'url': url,
            'type': 'external',
            'message': 'Cannot check external URLs'
        })
    
    # Nếu URL bắt đầu bằng /api/uploads/
    if url.startswith('/api/uploads/'):
        filename = url.replace('/api/uploads/', '')
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        exists = os.path.exists(filepath)
        return jsonify({
            'url': url,
            'type': 'api_uploads',
            'filename': filename,
            'filepath': filepath,
            'exists': exists
        })
    
    # Nếu URL bắt đầu bằng /uploads/
    if url.startswith('/uploads/'):
        filename = url.replace('/uploads/', '')
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        exists = os.path.exists(filepath)
        return jsonify({
            'url': url,
            'type': 'uploads',
            'filename': filename,
            'filepath': filepath,
            'exists': exists
        })
    
    # Nếu URL chỉ là tên file
    if '/' not in url:
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], url)
        exists = os.path.exists(filepath)
        return jsonify({
            'url': url,
            'type': 'filename',
            'filename': url,
            'filepath': filepath,
            'exists': exists
        })
    
    # Trường hợp khác
    return jsonify({
        'url': url,
        'type': 'unknown',
        'message': 'Unknown URL format'
    })

@bp.route('/uploads', methods=['GET'])
def list_uploads():
    """Liệt kê các file trong thư mục uploads"""
    upload_folder = current_app.config['UPLOAD_FOLDER']
    
    if not os.path.exists(upload_folder):
        return jsonify({
            'error': 'Upload folder does not exist',
            'path': upload_folder
        }), 404
    
    files = []
    for filename in os.listdir(upload_folder):
        filepath = os.path.join(upload_folder, filename)
        if os.path.isfile(filepath):
            files.append({
                'name': filename,
                'path': filepath,
                'size': os.path.getsize(filepath),
                'url': f'/api/uploads/{filename}'
            })
    
    return jsonify({
        'path': upload_folder,
        'files': files,
        'count': len(files)
    })

@bp.route('/upload-test', methods=['POST'])
def upload_test():
    """Test upload ảnh"""
    if 'image' not in request.files:
        return jsonify({'error': 'No image part in the request'}), 400
    
    image_file = request.files['image']
    if image_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if image_file:
        try:
            # Đảm bảo thư mục uploads tồn tại
            upload_folder = current_app.config['UPLOAD_FOLDER']
            os.makedirs(upload_folder, exist_ok=True)
            
            # Lưu file
            filename = secure_filename(image_file.filename)
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            image_path = os.path.join(upload_folder, unique_filename)
            
            current_app.logger.info(f"Saving test image to: {image_path}")
            image_file.save(image_path)
            
            # Kiểm tra xem file đã được lưu thành công chưa
            if os.path.exists(image_path):
                file_size = os.path.getsize(image_path)
                image_url = f"/api/uploads/{unique_filename}"
                
                return jsonify({
                    'success': True,
                    'message': 'File uploaded successfully',
                    'filename': unique_filename,
                    'path': image_path,
                    'size': file_size,
                    'url': image_url
                })
            else:
                return jsonify({
                    'error': 'Failed to save file',
                    'path': image_path
                }), 500
        except Exception as e:
            import traceback
            current_app.logger.error(traceback.format_exc())
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Unknown error'}), 500 