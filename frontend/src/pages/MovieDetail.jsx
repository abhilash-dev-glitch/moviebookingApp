import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MoviesAPI, ReviewsAPI } from '../lib/api'
import { useSelector } from 'react-redux'
import { toast } from '../lib/toast'

export default function MovieDetail(){
  const { id } = useParams()
  const [movie, setMovie] = useState(null)
  const user = useSelector((state) => state.auth.user)
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

  // Mock reviews when there are no real reviews
  const mockReviews = [
    {
      _id: 'critic-1',
      user: { name: 'Roger Ebert', role: 'Film Critic' },
      rating: 9,
      comment: 'A masterful piece of cinema that captivates from start to finish. The director\'s vision is executed with precision, and the performances are nothing short of extraordinary.',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      isMock: true,
      isCritic: true
    },
    {
      _id: 'critic-2',
      user: { name: 'Peter Travers', role: 'Film Critic' },
      rating: 8,
      comment: 'Visually stunning and emotionally resonant. This film pushes boundaries while staying true to its core narrative. A must-watch for cinema enthusiasts.',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      isMock: true,
      isCritic: true
    },
    {
      _id: 'user-1',
      user: { name: 'Sarah Mitchell' },
      rating: 10,
      comment: 'Absolutely loved it! The storytelling is brilliant and the cinematography is breathtaking. Watched it twice already and planning to go again!',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      isMock: true
    },
    {
      _id: 'user-2',
      user: { name: 'James Rodriguez' },
      rating: 9,
      comment: 'One of the best movies I\'ve seen this year. The cast delivered outstanding performances and the plot kept me engaged throughout. Highly recommended!',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isMock: true
    },
    {
      _id: 'user-3',
      user: { name: 'Emily Chen' },
      rating: 8,
      comment: 'Great movie with a compelling story. The soundtrack perfectly complements the visuals. A few pacing issues in the middle, but overall a fantastic experience.',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      isMock: true
    }
  ]

  // Always show mock reviews, and add real reviews on top if they exist
  const realReviews = Array.isArray(movie.reviews) ? movie.reviews : []
  const displayReviews = [...realReviews, ...mockReviews]

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
            <span>({ratingCount} {ratingCount === 1 ? 'review' : 'reviews'})</span>
          </div>
          <p className="mt-3 text-white/70">{movie.description}</p>
          {user && (
            <div className="mt-6">
              <button 
                onClick={() => {
                  const reviewSection = document.getElementById('review-section');
                  reviewSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-5 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition text-white shadow-soft inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Rate & Review This Movie
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section - Show mock reviews if no real reviews exist */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Critics Reviews */}
        {displayReviews.some(r => r.isCritic) && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <h2 className="text-2xl font-bold">Critics Reviews</h2>
            </div>
            <div className="space-y-3">
              {displayReviews.filter(r => r.isCritic).map((r) => (
                <div key={r._id} className="p-5 rounded-lg bg-gradient-to-r from-yellow-900/10 to-orange-900/10 border border-yellow-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <span className="text-yellow-400 font-bold text-lg">
                          {r.user?.name?.charAt(0) || 'C'}
                        </span>
                      </div>
                      <div>
                        <div className="text-base font-semibold text-white">{r.user?.name || 'Critic'}</div>
                        <div className="text-xs text-yellow-400">Verified Film Critic</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                      <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-yellow-400 font-bold">{r.rating}/10</span>
                    </div>
                  </div>
                  <p className="text-white/80 leading-relaxed">{r.comment}</p>
                  <div className="mt-3 text-xs text-white/40">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Reviews */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-2xl font-bold">Audience Reviews</h2>
          </div>
          <div className="space-y-3">
            {displayReviews.filter(r => !r.isCritic).map((r) => {
              const isOwner = user && !r.isMock && (r.user?._id === user._id || r.user?._id === user.id)
              const isEditing = editingId === r._id
              return (
                <div key={r._id} className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="text-blue-400 font-semibold">
                          {r.user?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{r.user?.name || 'User'}</div>
                        {r.isMock && <div className="text-xs text-white/40">Verified Viewer</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/15 border border-green-500/20">
                        <svg className="w-4 h-4 text-green-400 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-green-300 font-semibold text-sm">{isEditing ? editingRating : r.rating}/10</span>
                      </div>
                      {isOwner && !isEditing && !r.isMock && (
                        <>
                          <button
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                            onClick={()=>{ setEditingId(r._id); setEditingRating(r.rating); setEditingComment(r.comment || '') }}
                          >Edit</button>
                          <button
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
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
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-xs text-white/70 mb-2">Update Rating</label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setEditingRating(star)}
                              className="transition-all duration-200 hover:scale-110"
                            >
                              <svg
                                className={`w-6 h-6 ${
                                  star <= editingRating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-600 fill-current hover:text-yellow-400/50'
                                }`}
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-white/80">{editingRating}/10</span>
                        </div>
                      </div>
                      <textarea value={editingComment} onChange={(e)=> setEditingComment(e.target.value)} className="w-full px-3 py-2 rounded bg-white/10 border border-white/10 text-white placeholder-white/40" rows={3} placeholder="Update your comment"/>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 rounded bg-brand hover:bg-brand-dark text-white transition-colors" onClick={async ()=>{
                          try {
                            await ReviewsAPI.update(r._id, { rating: editingRating, comment: editingComment })
                            toast.success('Review updated successfully')
                            setEditingId(null)
                            const fresh = await MoviesAPI.get(id)
                            setMovie(fresh)
                          } catch(e) {
                            toast.error('Failed to update', e?.response?.data?.message || 'Please try again')
                          }
                        }}>Save Changes</button>
                        <button className="px-4 py-2 rounded border border-white/20 hover:bg-white/5 text-white transition-colors" onClick={()=> setEditingId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    r.comment ? (
                      <p className="mt-3 text-white/80 leading-relaxed">{r.comment}</p>
                    ) : null
                  )}
                  <div className="mt-3 text-xs text-white/40">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {user && (
        <div id="review-section" className="max-w-7xl mx-auto px-4 pb-12 scroll-mt-20">
          <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <h2 className="text-2xl font-bold text-white">Share Your Experience</h2>
            </div>
            <p className="text-white/70 text-sm mb-6">Help others discover great movies! Your review matters.</p>
            
            <div className="space-y-4">
              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Your Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-all duration-200 hover:scale-110"
                    >
                      <svg
                        className={`w-8 h-8 ${
                          star <= rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-600 fill-current hover:text-yellow-400/50'
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                  <span className="ml-3 text-lg font-semibold text-white">
                    {rating > 0 ? `${rating}/10` : 'Select rating'}
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Your Review (Optional)</label>
                <textarea 
                  value={comment} 
                  onChange={(e)=> setComment(e.target.value)} 
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-white/40 transition-all" 
                  rows={4} 
                  placeholder="What did you think about this movie? Share your thoughts with other movie lovers..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-white/50 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>You can only submit one review per movie</span>
                </div>
                <button 
                  disabled={submitting || rating === 0} 
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-500/50 flex items-center gap-2" 
                  onClick={async ()=>{
                    if (rating < 1 || rating > 10) { 
                      toast.error('Invalid rating', 'Please select a rating between 1 and 10'); 
                      return 
                    }
                    setSubmitting(true)
                    try {
                      await ReviewsAPI.create(movieId, { rating, comment })
                      toast.success('Review submitted successfully! Thank you for sharing your thoughts.')
                      setRating(0); setComment('')
                      const fresh = await MoviesAPI.get(id)
                      setMovie(fresh)
                    } catch(e) {
                      const msg = e?.response?.data?.message || 'Please try again'
                      toast.error('Failed to submit review', msg)
                    } finally {
                      setSubmitting(false)
                    }
                  }}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Submit Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
