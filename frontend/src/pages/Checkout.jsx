import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { BookingAPI, PaymentAPI } from '../lib/api'

export default function Checkout(){
  const { bookingId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const [gateways, setGateways] = useState([])
  const [creating, setCreating] = useState(false)

  useEffect(()=>{
    PaymentAPI.gateways().then(({gateways})=> setGateways(gateways))
  },[])

  const handleMockPay = async () => {
    try {
      setCreating(true)
      // Create booking first if we navigated from seats with transient data
      let createdBookingId = bookingId
      if(!createdBookingId){
        const booking = await BookingAPI.create({ showtime: state.showtime, seats: state.seats, paymentMethod: 'online' })
        createdBookingId = booking._id
      }
      const { payment } = await PaymentAPI.create({ bookingId: createdBookingId, paymentGateway: 'mock', paymentMethod: 'card' })
      await PaymentAPI.verify({ paymentId: payment._id, gatewayPaymentId: 'mock_payment', gatewayOrderId: 'mock_order' })
      navigate('/')
      alert('Payment successful! Booking confirmed.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-[1fr,320px] gap-8">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-4">Payment options</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {gateways.includes('mock') && (
            <button onClick={handleMockPay} disabled={creating} className="p-4 rounded-lg bg-brand/20 text-brand border border-brand/20 hover:bg-brand/30 transition">Mock Pay</button>
          )}
          {gateways.includes('razorpay') && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 opacity-60">Razorpay (wire later)</div>
          )}
          {gateways.includes('stripe') && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 opacity-60">Stripe (wire later)</div>
          )}
        </div>
      </div>
      <aside className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="text-sm text-white/60">Amount Payable</div>
        <div className="text-3xl font-bold">₹{state?.seats?.reduce((a,b)=> a+(b.price||0), 0) || '—'}</div>
      </aside>
    </div>
  )
}
