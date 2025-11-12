import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BookingAPI, ShowtimesAPI } from '../lib/api'

function Seat({ seat, onToggle }){
  const isUnavailable = seat.status === 'booked' || seat.status === 'locked'
  const isSelected = seat.selected
  return (
    <button disabled={isUnavailable} onClick={onToggle} className={
      `w-8 h-8 text-xs rounded grid place-items-center border transition ${
        isUnavailable ? 'bg-white/10 text-white/30 border-white/10' : isSelected ? 'bg-brand text-white border-brand' : 'bg-white/5 border-white/15 hover:bg-white/10'
      }`
    }>
      {seat.seat}
    </button>
  )
}

export default function SeatSelection(){
  const { showtimeId } = useParams()
  const navigate = useNavigate()
  const [meta, setMeta] = useState(null)
  const [grid, setGrid] = useState([])
  const [selected, setSelected] = useState([])

  useEffect(()=>{
    ShowtimesAPI.get(showtimeId).then(setMeta)
    BookingAPI.lockedSeats(showtimeId).then(({lockedSeats, bookedSeats}) => {
      // Build a simple 7-row x 20-seat layout for demo; adjust with real data when available
      const rows = 'ABCDEFG'.split('')
      const seats = Array.from({length:20}, (_,i)=> i+1)
      const setStatus = (row, seat) => {
        const k = `${row}-${seat}`
        if (bookedSeats.find(s => `${s.row}-${s.seat}`===k)) return 'booked'
        if (lockedSeats.find(s => `${s.row}-${s.seat}`===k)) return 'locked'
        return 'available'
      }
      const g = rows.map(r => seats.map(n => ({row:r, seat:n, status:setStatus(r,n)})))
      setGrid(g)
    })
  }, [showtimeId])

  const toggle = (rIdx, cIdx) => {
    setGrid(prev => prev.map((row,ri)=> row.map((s,ci)=>{
      if(ri===rIdx && ci===cIdx){
        if(s.status==='booked' || s.status==='locked') return s
        const selected = !s.selected
        if(selected) setSelected(prev=>[...prev,{row:s.row, seat:s.seat, price: meta?.price || 200}])
        else setSelected(prev=> prev.filter(p=> !(p.row===s.row && p.seat===s.seat)))
        return {...s, selected}
      }
      return s
    })))
  }

  const proceed = async () => {
    navigate(`/checkout/temp`, { state: { showtime: id, seats: selected } })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{meta?.theater?.name} • {new Date(meta?.startTime).toLocaleString()}</h3>
          <div className="text-sm text-white/60">Selected: {selected.length}</div>
        </div>
        <div className="overflow-x-auto">
          <div className="space-y-2 w-max mx-auto">
            {grid.map((row, ri) => (
              <div key={ri} className="flex items-center gap-2">
                <div className="w-6 text-white/50 text-xs">{"ABCDEFG"[ri]}</div>
                {row.map((s, ci)=> (
                  <Seat key={ci} seat={s} onToggle={() => toggle(ri, ci)} />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 text-center">
          <button onClick={proceed} disabled={!selected.length} className="px-6 py-3 rounded-lg bg-brand disabled:opacity-50 disabled:cursor-not-allowed">Pay ₹{selected.reduce((a,b)=>a+(b.price||0),0)}</button>
        </div>
      </div>
    </div>
  )
}
