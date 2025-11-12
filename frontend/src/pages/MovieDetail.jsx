import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MoviesAPI, ReviewsAPI } from '../lib/api'
import { useAuth } from '../store/auth'
import { toast } from '../lib/toast'

export default function MovieDetail(){
  const { id } = useParams()
  const [movie, setMovie] = useState(null)
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingRating, setEditingRating] = useState(0)
  const [editingComment, setEditingComment] = useState('')

  useEffect(()=>{
    MoviesAPI.get(id).then(setMovie)
  }, [id])

  if(!movie) return <div className="max-w-7xl mx-auto px-4 py-10">Loading…</div>

  const poster = movie.poster || movie.image || 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963f?q=80&w=800&auto=format&fit=crop'
  const genresArr = Array.isArray(movie.genre) ? movie.genre : (Array.isArray(movie.genres) ? movie.genres : [])
  const ratingAvg = movie.ratingsAverage ?? movie.rating ?? 0
  const ratingCount = movie.ratingsCount ?? 0
  const movieId = movie._id || movie.id

  return (
    <div className="bg-gradient-to-b from-black/60 to-surface">
      <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-[280px,1fr] gap-8 items-start">
        <div className="relative">
          <div className="rounded-xl overflow-hidden border border-white/10 shadow-soft">
            <img src={poster} className="w-full h-[380px] object-cover"/>
          </div>
          <Link 
            to={`/movies/${movieId}/showtimes`}
            className="mt-4 w-full bg-brand hover:bg-brand-dark text-white font-medium py-3 px-6 rounded-lg text-center block transition-colors"
          >
            Book Tickets
          </Link>
        </div>
        <div>
          <h1 className="text-3xl font-bold">{movie.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {genresArr.map((g)=> (
              <span key={g} className="px-2 py-1 rounded bg-white/10 text-xs">{g}</span>
            ))}
            {movie.language && (
              <span className="px-2 py-1 rounded bg-white/10 text-xs">{movie.language}</span>
            )}
          </div>
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-white/80">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/15 text-green-300 border border-green-400/10">
              <span>★</span>
              <span className="font-semibold">{ratingAvg}</span>
            </span>
            <span>({ratingCount} ratings)</span>
          </div>
          <p className="mt-3 text-white/70">{movie.description}</p>
          <div className="mt-6">
            <Link to={`/movie/${movieId}/showtimes`} className="px-5 py-3 rounded-lg bg-brand hover:bg-brand-dark transition text-white shadow-soft">Book tickets</Link>
          </div>
        </div>
      </div>

      {Array.isArray(movie.reviews) && movie.reviews.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-12">
          <h2 className="text-xl font-bold mb-3">User Reviews</h2>
          <div className="space-y-3">
            {movie.reviews.map((r) => {
              const isOwner = user && (r.user?._id === user._id || r.user?._id === user.id)
              const isEditing = editingId === r._id
              return (
                <div key={r._id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white/80">
                      {r.user?.name || 'User'}
                      {r.user?.role ? <span className="ml-2 text-xs text-white/50">({r.user.role})</span> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm inline-flex items-center gap-1 text-green-300">
                        <span>★</span>
                        <span>{isEditing ? editingRating : r.rating}</span>
                      </div>
                      {isOwner && !isEditing && (
                        <>
                          <button
                            className="text-xs text-white/70 hover:text-white underline"
                            onClick={()=>{ setEditingId(r._id); setEditingRating(r.rating); setEditingComment(r.comment || '') }}
                          >Edit</button>
                          <button
                            className="text-xs text-red-300 hover:text-red-200 underline"
                            onClick={async ()=>{
                              try {
                                await ReviewsAPI.remove(r._id)
                                toast.success('Review deleted')
                                const fresh = await MoviesAPI.get(id)
                                setMovie(fresh)
                              } catch(e) {
                                toast.error('Failed to delete', e?.response?.data?.message || 'Please try again')
                              }
                            }}
                          >Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                  {isEditing ? (
                    <div className="mt-2 space-y-2">
                      <input type="number" min={0} max={10} step={0.5} value={editingRating} onChange={(e)=> setEditingRating(Number(e.target.value))} className="w-24 px-2 py-1 rounded bg-white/10 border border-white/10" />
                      <textarea value={editingComment} onChange={(e)=> setEditingComment(e.target.value)} className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" rows={3} placeholder="Update your comment"/>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 rounded bg-brand text-white" onClick={async ()=>{
                          try {
                            await ReviewsAPI.update(r._id, { rating: editingRating, comment: editingComment })
                            toast.success('Review updated')
                            setEditingId(null)
                            const fresh = await MoviesAPI.get(id)
                            setMovie(fresh)
                          } catch(e) {
                            toast.error('Failed to update', e?.response?.data?.message || 'Please try again')
                          }
                        }}>Save</button>
                        <button className="px-3 py-1 rounded border border-white/10" onClick={()=> setEditingId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    r.comment ? (
                      <p className="mt-2 text-white/70 text-sm">{r.comment}</p>
                    ) : null
                  )}
                  <div className="mt-2 text-xs text-white/50">{new Date(r.createdAt).toLocaleDateString()}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {user && (
        <div className="max-w-7xl mx-auto px-4 pb-12">
          <h2 className="text-xl font-bold mb-3">Write a review</h2>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <label className="text-sm">Rating</label>
              <input type="number" min={0} max={10} step={0.5} value={rating} onChange={(e)=> setRating(Number(e.target.value))} className="w-24 px-2 py-1 rounded bg-white/10 border border-white/10" />
            </div>
            <textarea value={comment} onChange={(e)=> setComment(e.target.value)} className="mt-3 w-full px-3 py-2 rounded bg-white/10 border border-white/10" rows={3} placeholder="Share your experience"/>
            <div className="mt-3">
              <button disabled={submitting} className="px-5 py-2 rounded bg-brand text-white disabled:opacity-60" onClick={async ()=>{
                if (rating < 0 || rating > 10) { toast.error('Invalid rating', 'Please provide a rating between 0 and 10'); return }
                setSubmitting(true)
                try {
                  await ReviewsAPI.create(movieId, { rating, comment })
                  toast.success('Review submitted')
                  setRating(0); setComment('')
                  const fresh = await MoviesAPI.get(id)
                  setMovie(fresh)
                } catch(e) {
                  const msg = e?.response?.data?.message || 'Please try again'
                  toast.error('Failed to submit review', msg)
                } finally {
                  setSubmitting(false)
                }
              }}>Submit</button>
            </div>
            <div className="mt-2 text-xs text-white/50">You can review only after booking; otherwise submission will be rejected.</div>
          </div>
        </div>
      )}
    </div>
  )
}
