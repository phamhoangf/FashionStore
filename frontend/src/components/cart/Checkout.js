import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { CartContext } from '../../context/CartContext';

const Checkout = ({ onSubmit }) => {
  const { cart } = useContext(CartContext);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  
  const validationSchema = Yup.object({
    fullName: Yup.string().required('Vui lòng nhập họ tên'),
    phone: Yup.string()
      .required('Vui lòng nhập số điện thoại')
      .matches(/^[0-9]{10}$/, 'Số điện thoại không hợp lệ'),
    email: Yup.string()
      .email('Email không hợp lệ')
      .required('Vui lòng nhập email'),
    address: Yup.string().required('Vui lòng nhập địa chỉ'),
    city: Yup.string().required('Vui lòng chọn thành phố'),
    district: Yup.string().required('Vui lòng chọn quận/huyện'),
    ward: Yup.string().required('Vui lòng chọn phường/xã'),
  });

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  return (
    <div className="row">
      <div className="col-md-8">
        <div className="card mb-4">
          <div className="card-body">
            <h4 className="mb-4">Thông tin giao hàng</h4>
            
            <Formik
              initialValues={{
                fullName: '',
                phone: '',
                email: '',
                address: '',
                city: '',
                district: '',
                ward: '',
                notes: ''
              }}
              validationSchema={validationSchema}
              onSubmit={(values) => {
                onSubmit({
                  ...values,
                  paymentMethod
                });
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="fullName" className="form-label">Họ tên</label>
                      <Field
                        type="text"
                        id="fullName"
                        name="fullName"
                        className="form-control"
                      />
                      <ErrorMessage name="fullName" component="div" className="text-danger mt-1" />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="phone" className="form-label">Số điện thoại</label>
                      <Field
                        type="text"
                        id="phone"
                        name="phone"
                        className="form-control"
                      />
                      <ErrorMessage name="phone" component="div" className="text-danger mt-1" />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <Field
                      type="email"
                      id="email"
                      name="email"
                      className="form-control"
                    />
                    <ErrorMessage name="email" component="div" className="text-danger mt-1" />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="address" className="form-label">Địa chỉ</label>
                    <Field
                      type="text"
                      id="address"
                      name="address"
                      className="form-control"
                    />
                    <ErrorMessage name="address" component="div" className="text-danger mt-1" />
                  </div>
                  
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label htmlFor="city" className="form-label">Tỉnh/Thành phố</label>
                      <Field
                        as="select"
                        id="city"
                        name="city"
                        className="form-select"
                      >
                        <option value="">Chọn Tỉnh/Thành phố</option>
                        <option value="hanoi">Hà Nội</option>
                        <option value="hcm">TP. Hồ Chí Minh</option>
                        <option value="danang">Đà Nẵng</option>
                      </Field>
                      <ErrorMessage name="city" component="div" className="text-danger mt-1" />
                    </div>
                    
                    <div className="col-md-4 mb-3">
                      <label htmlFor="district" className="form-label">Quận/Huyện</label>
                      <Field
                        as="select"
                        id="district"
                        name="district"
                        className="form-select"
                      >
                        <option value="">Chọn Quận/Huyện</option>
                        <option value="quan1">Quận 1</option>
                        <option value="quan2">Quận 2</option>
                        <option value="quan3">Quận 3</option>
                      </Field>
                      <ErrorMessage name="district" component="div" className="text-danger mt-1" />
                    </div>
                    
                    <div className="col-md-4 mb-3">
                      <label htmlFor="ward" className="form-label">Phường/Xã</label>
                      <Field
                        as="select"
                        id="ward"
                        name="ward"
                        className="form-select"
                      >
                        <option value="">Chọn Phường/Xã</option>
                        <option value="phuong1">Phường 1</option>
                        <option value="phuong2">Phường 2</option>
                        <option value="phuong3">Phường 3</option>
                      </Field>
                      <ErrorMessage name="ward" component="div" className="text-danger mt-1" />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="notes" className="form-label">Ghi chú</label>
                    <Field
                      as="textarea"
                      id="notes"
                      name="notes"
                      className="form-control"
                      rows="3"
                    />
                  </div>
                  
                  <h4 className="mb-3">Phương thức thanh toán</h4>
                  
                  <div className="mb-4">
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="paymentMethod"
                        id="cod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={handlePaymentMethodChange}
                      />
                      <label className="form-check-label" htmlFor="cod">
                        Thanh toán khi nhận hàng (COD)
                      </label>
                    </div>
                    
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="paymentMethod"
                        id="bank"
                        value="bank"
                        checked={paymentMethod === 'bank'}
                        onChange={handlePaymentMethodChange}
                      />
                      <label className="form-check-label" htmlFor="bank">
                        Chuyển khoản ngân hàng
                      </label>
                    </div>
                    
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="paymentMethod"
                        id="momo"
                        value="momo"
                        checked={paymentMethod === 'momo'}
                        onChange={handlePaymentMethodChange}
                      />
                      <label className="form-check-label" htmlFor="momo">
                        Thanh toán qua Momo
                      </label>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : null}
                    Đặt hàng
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
      
      <div className="col-md-4">
        <div className="card mb-4">
          <div className="card-body">
            <h4 className="mb-3">Đơn hàng của bạn</h4>
            
            <div className="mb-3">
              {cart.items.map(item => (
                <div key={item.id} className="d-flex justify-content-between mb-2">
                  <div>
                    <span>{item.product.name}</span>
                    <br />
                    <small className="text-muted">
                      {item.quantity} x {item.product.price.toLocaleString('vi-VN')} VNĐ
                      {item.size && ` - ${item.size}`}
                    </small>
                  </div>
                  <div className="text-end">
                    {(item.quantity * item.product.price).toLocaleString('vi-VN')} VNĐ
                  </div>
                </div>
              ))}
            </div>
            
            <hr />
            
            <div className="d-flex justify-content-between mb-2">
              <span>Tạm tính:</span>
              <span>{cart.total.toLocaleString('vi-VN')} VNĐ</span>
            </div>
            
            <div className="d-flex justify-content-between mb-2">
              <span>Phí vận chuyển:</span>
              <span>Miễn phí</span>
            </div>
            
            <div className="d-flex justify-content-between mb-3">
              <strong>Tổng cộng:</strong>
              <strong>{cart.total.toLocaleString('vi-VN')} VNĐ</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;