import { useEffect, useState } from 'react'
import { MoviesAPI, ShowtimesAPI, api } from '../../lib/api'

export default function ManagerDashboard(){
  const [movies, setMovies] = useState([])
  const [showtimes, setShowtimes] = useState([])
  const [form, setForm] = useState({ movie:'', theater:'', startTime:'', endTime:'', price:200 })

  const load = async () => {
    const [ms, sts] = await Promise.all([
      MoviesAPI.list(),
      ShowtimesAPI.list({ sort: '-startTime' })
    ])
    setMovies(ms)
    setShowtimes(sts)
  }
  useEffect(()=>{ load() },[])

  const set = (k,v) => setForm(prev => ({...prev, [k]: v}))

  const create = async (e) => {
    e.preventDefault()
    // NOTE: backend requires theater access for managers; provide valid theater id associated with this user
    await api.post('/showtimes', {
      movie: form.movie,
      theater: form.theater,
      startTime: form.startTime,
      endTime: form.endTime,
      price: Number(form.price || 0)
    })
    setForm({ movie:'', theater:'', startTime:'', endTime:'', price:200 })
    load()
  }

  const remove = async (id) => { await api.delete(`/showtimes/${id}`); load() }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Theater Manager</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={create} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <h2 className="font-semibold">Add Show</h2>
          <label className="block text-sm">Movie</label>
          <select value={form.movie} onChange={e=>set('movie', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            <option value="">Select movie</option>
            {movies.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
          </select>
          <label className="block text-sm">Theater ID</label>
          <input placeholder="Theater ObjectId" value={form.theater} onChange={e=>set('theater', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"/>
          <label className="block text-sm">Start Time</label>
          <input type="datetime-local" value={form.startTime} onChange={e=>set('startTime', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"/>
          <label className="block text-sm">End Time</label>
          <input type="datetime-local" value={form.endTime} onChange={e=>set('endTime', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"/>
          <label className="block text-sm">Price</label>
          <input type="number" value={form.price} onChange={e=>set('price', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"/>
          <button className="px-4 py-2 rounded-md bg-brand hover:bg-brand-dark transition text-white">Create Show</button>
        </form>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h2 className="font-semibold mb-3">Upcoming Shows</h2>
          <div className="space-y-2 max-h-[520px] overflow-auto pr-2">
            {showtimes.map(s => (
              <div key={s._id} className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
                <div>
                  <div className="font-semibold">{s.movie?.title || s.movie}</div>
                  <div className="text-xs text-white/60">{new Date(s.startTime).toLocaleString()} • ₹{s.price}</div>
                </div>
                <button onClick={()=>remove(s._id)} className="text-red-300 text-sm">Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
