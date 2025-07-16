'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./checkout.module.css";

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    district: "",
    note: "",
    shipping: "economy",
    payment: "cod"
  });
  const [cart] = useState([
    { name: "Động cơ rèm tự động Tuya Smart Curtain Motor x 1", price: 1900000 }
  ]);
  const [shippingFee, setShippingFee] = useState(20000);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Kiểm tra đăng nhập và tự động nhập thông tin
  useEffect(() => {
    if (!user) {
      // Chưa đăng nhập, chuyển về trang login
      router.push('/login?redirect=/checkout');
      return;
    }

    // Tự động nhập thông tin user nếu có
    if (user) {
      setForm(prev => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        district: user.district || ""
      }));
    }
    
    setLoading(false);
  }, [user, router]);

  // Tính tổng tiền - lấy giảm giá từ localStorage nếu có
  let subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  let discount = 0;
  let discountCode = "";
  
  // Lấy thông tin giảm giá từ cart (nếu có)
  if (typeof window !== 'undefined') {
    const cartDiscount = localStorage.getItem('cartDiscount');
    if (cartDiscount) {
      const discountData = JSON.parse(cartDiscount);
      discount = discountData.amount || 0;
      discountCode = discountData.code || "";
    }
  }
  
  let total = subtotal + shippingFee - discount;
  if (total < 0) total = 0;  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra lại đăng nhập
    if (!user) {
      setError("Vui lòng đăng nhập để thanh toán!");
      router.push('/login?redirect=/checkout');
      return;
    }
    
    // Kiểm tra thiếu trường
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.address || !form.city || !form.district) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc!");
      setTimeout(() => setError(""), 2500);
      return;
    }    try {
      // Chuẩn bị dữ liệu đơn hàng
      const orderData = {
        userId: user.id || user.username, // Fallback to username if no id
        customerInfo: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city,
          district: form.district,
          note: form.note
        },
        items: cart.map(item => ({
          name: item.name,
          price: item.price,
          quantity: 1 // Hiện tại mặc định là 1, có thể cải thiện sau
        })),
        subtotal: subtotal,
        shippingFee: shippingFee,
        discount: discount,
        discountCode: discountCode,
        finalTotal: total,
        shippingMethod: form.shipping,
        paymentMethod: form.payment
      };

      // Gửi đơn hàng lên API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        // Xóa giỏ hàng và mã giảm giá sau khi đặt hàng thành công
        localStorage.removeItem('cart');
        localStorage.removeItem('cartDiscount');
        
        // Chuyển sang trang thành công với ID đơn hàng
        router.push(`/checkout-success?orderId=${result.order.id}`);
      } else {
        setError("Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!");
        setTimeout(() => setError(""), 2500);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setError("Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!");
      setTimeout(() => setError(""), 2500);
    }
  };

  // Hiển thị loading nếu đang kiểm tra đăng nhập
  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Đang kiểm tra thông tin...</h2>
      </div>
    );
  }

  // Hiển thị thông báo nếu chưa đăng nhập
  if (!user) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Vui lòng đăng nhập để thanh toán</h2>        <button onClick={() => router.push('/login?redirect=/checkout')} 
                className="btn-brand btn-lg"
                style={{ padding: '12px 24px', marginTop: '20px' }}>
          Đăng nhập ngay
        </button>
      </div>
    );
  }
  return (
    <div className="container">
      <div className="row">
        {/* Form bên trái */}
        <div className="col-7 col-md-12 col-sm-12">
          <form className={styles.checkoutForm} onSubmit={handleSubmit}>
            <h2>THÔNG TIN THANH TOÁN</h2>
            {error && (
              <div style={{background:'#ffeaea',color:'#e11d48',padding:'8px 12px',borderRadius:6,marginBottom:8,fontWeight:600,textAlign:'center',boxShadow:'0 2px 8px #0001'}}>
                {error}
              </div>
            )}
            <div style={{display:'flex',gap:12}}>
              <input required placeholder="Tên*" style={{flex:1}} value={form.firstName} onChange={e=>setForm(f=>({...f,firstName:e.target.value}))} />
              <input required placeholder="Họ*" style={{flex:1}} value={form.lastName} onChange={e=>setForm(f=>({...f,lastName:e.target.value}))} />
            </div>
            <input placeholder="Tên công ty (tuỳ chọn)" style={{marginTop:8}} />
            <div style={{display:'flex',gap:12,marginTop:8}}>
              <select required value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} style={{flex:1}}>
                <option value="">Chọn một tỉnh thành...</option>
                <option value="Hà Nội">Hà Nội</option>
                <option value="Hồ Chí Minh">Hồ Chí Minh</option>
              </select>
              <select required value={form.district} onChange={e=>setForm(f=>({...f,district:e.target.value}))} style={{flex:1}}>
                <option value="">Chọn một quận/huyện...</option>
                <option value="Q1">Quận 1</option>
                <option value="Q2">Quận 2</option>
              </select>
            </div>
            <input required placeholder="Địa chỉ*" style={{marginTop:8}} value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} />            <input required placeholder="Số điện thoại*" style={{marginTop:8}} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
            <input required placeholder="Địa chỉ email*" style={{marginTop:8}} value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
            <textarea placeholder="Ghi chú đơn hàng (tuỳ chọn)" style={{marginTop:8}} value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} />
          </form>
        </div>
        
        {/* Bảng đơn hàng bên phải */}
        <div className="col-5 col-md-12 col-sm-12">
          <div className={styles.orderSummary} style={{background:'#fff',borderRadius:8,boxShadow:'0 2px 8px #0001',padding:24,position:'relative'}}>
            <h2>ĐƠN HÀNG CỦA BẠN</h2>            <table style={{width:'100%',marginBottom:12}}>
              <thead>
                <tr><th style={{textAlign:'left'}}>SẢN PHẨM</th></tr>
              </thead>
              <tbody>
                {cart.map((item,i)=>(
                  <tr key={i}>
                    <td>{item.name}</td>
                  </tr>
                ))}
                <tr style={{fontWeight:600}}>
                  <td>Tạm tính: {subtotal.toLocaleString('vi-VN')} VND</td>
                </tr>
                {discount > 0 && (
                  <tr style={{color:'#e11d48'}}>
                    <td>Mã giảm giá: {discountCode} -{discount.toLocaleString('vi-VN')} VND</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div style={{margin:'16px 0'}}>
              <div>Giao hàng</div>
              <div style={{marginTop:4}}>
                <label><input type="radio" name="shipping" checked={form.shipping==='economy'} onChange={()=>{setForm(f=>({...f,shipping:'economy'}));setShippingFee(20000);}} /> Giao hàng tiết kiệm: 20.000 VND</label><br/>
                <label><input type="radio" name="shipping" checked={form.shipping==='fast'} onChange={()=>{setForm(f=>({...f,shipping:'fast'}));setShippingFee(50000);}} /> Giao hàng nhanh: 50.000 VND</label>
              </div>
            </div>
            <div style={{fontWeight:600,fontSize:18,margin:'12px 0'}}>Tổng: {total.toLocaleString('vi-VN')} VND</div>
            <div style={{margin:'16px 0'}}>
              <div>Chọn hình thức thanh toán</div>
              <div style={{marginTop:4}}>
                <label><input type="radio" name="payment" checked={form.payment==='cod'} onChange={()=>setForm(f=>({...f,payment:'cod'}))}/> Thanh toán khi nhận hàng</label><br/>
                <label><input type="radio" name="payment" checked={form.payment==='bank'} onChange={()=>setForm(f=>({...f,payment:'bank'}))}/> Chuyển khoản ngân hàng</label><br/>
                <label><input type="radio" name="payment" checked={form.payment==='momo'} onChange={()=>setForm(f=>({...f,payment:'momo'}))}/> Ví điện tử Momo</label><br/>
              </div>
              {/* Block chi tiết động cho từng phương thức thanh toán */}
              {form.payment==='bank' && (
                <div style={{marginTop:16,background:'#f8fafc',border:'1px solid #e0e7ef',borderRadius:8,padding:16}}>
                  <div style={{fontWeight:600,marginBottom:8}}>Thông tin chuyển khoản ngân hàng:</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:12,alignItems:'center',marginBottom:8}}>
                    <img src="/images/vietcombank.png" alt="VCB" style={{height:32}}/>
                    <span style={{fontWeight:500}}>Ngân hàng Vietcombank</span>
                  </div>
                  <div>Số tài khoản: <b>0123456789</b></div>
                  <div>Tên chủ tài khoản: <b>NGUYEN VAN A</b></div>
                  <div>Nội dung chuyển khoản: <b>Thanh toan don hang #{Math.floor(Math.random()*100000)}</b></div>
                  <div style={{marginTop:8,fontSize:13,color:'#888'}}>Vui lòng chuyển khoản đúng nội dung để đơn hàng được xác nhận nhanh chóng.</div>
                  <div style={{marginTop:12,display:'flex',flexWrap:'wrap',gap:8}}>
                    <img src="/images/vietinbank.png" alt="Vietin" style={{height:28}}/>
                    <img src="/images/mbbank.png" alt="MB" style={{height:28}}/>
                    <img src="/images/acb.png" alt="ACB" style={{height:28}}/>
                    <img src="/images/techcombank.png" alt="TCB" style={{height:28}}/>
                    {/* ...thêm các logo ngân hàng khác nếu cần... */}
                  </div>
                </div>
              )}
              {form.payment==='momo' && (
                <div style={{marginTop:16,background:'#f8fafc',border:'1px solid #e0e7ef',borderRadius:8,padding:16}}>
                  <div style={{fontWeight:600,marginBottom:8}}>Thanh toán qua ví Momo</div>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                    <img src="/images/momo.png" alt="Momo" style={{height:32}}/>
                    <span>Số điện thoại: <b>0901234567</b></span>
                  </div>
                  <div>Mã QR chuyển khoản:</div>
                  <img src="/images/momo-qr.png" alt="QR Momo" style={{height:100,margin:'8px 0'}}/>
                  <div style={{fontSize:13,color:'#888'}}>Quét mã QR hoặc nhập số điện thoại để chuyển khoản.</div>
                </div>
              )}
            </div>
            
            {/* Nút thanh toán */}
            <button onClick={handleSubmit} className={styles.checkoutBtn} style={{width:'100%',marginTop:24,padding:'16px',fontSize:'1.1rem',fontWeight:'bold'}}>
              THANH TOÁN NGAY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
