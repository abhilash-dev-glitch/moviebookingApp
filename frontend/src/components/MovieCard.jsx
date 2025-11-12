import { Link } from 'react-router-dom'

export default function MovieCard({ movie }) {
  const id = movie._id || movie.id
  const poster = movie.poster || movie.image || 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963f?q=80&w=600&auto=format&fit=crop'
  const genresArr = Array.isArray(movie.genre) ? movie.genre : (Array.isArray(movie.genres) ? movie.genres : [])
  const genresText = genresArr.length ? genresArr.join(', ') : 'Drama/Thriller'
  const ratingValue = movie.ratingsAverage ?? movie.rating ?? '8.7'
  const ratingCount = movie.ratingsCount ?? null
  return (
    <Link to={`/movies/${id}`} className="group block">
      <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-soft bg-white/5 border border-white/10 relative">
        <img src={poster} alt={movie.title} className="h-full w-full object-cover group-hover:scale-[1.03] transition duration-500"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 pointer-events-none"/>
        <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-500/20 text-green-300 border border-green-400/20">
          <span>★</span>
          <span>{ratingValue}</span>
          <span className="opacity-75">•</span>
          <span className="opacity-75">{ratingCount !== null ? ratingCount : '—'}</span>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="font-semibold text-white group-hover:text-brand transition">{movie.title}</h3>
        <p className="text-white/60 text-sm">{genresText}</p>
      </div>
    </Link>
  )
}
