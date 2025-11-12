import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom'
import { MoviesAPI, ShowtimesAPI } from '../lib/api'
import MovieCard from '../components/MovieCard'
import { toast } from '../lib/toast'

export default function Showtimes(){
  const { id } = useParams()
  const navigate = useNavigate()
  const [showtimes, setShowtimes] = useState([])
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0,10))
  const [searchParams, setSearchParams] = useSearchParams()
  const [related, setRelated] = useState([])
  
  // If no ID is provided, redirect to movies page
  useEffect(() => {
    if (!id) {
      navigate('/movies')
    }
  }, [id, navigate])

  // Filters synced with query params
  // Load defaults from localStorage if URL doesn't have them
  const saved = (()=>{ try { return JSON.parse(localStorage.getItem('showtimesFilters')||'{}') } catch { return {} } })()
  const priceParam = searchParams.get('price') || saved.price || 'all' // all | lte150 | 150-250 | 250-400 | gt400
  const timeParam = searchParams.get('time') || saved.time || 'all'   // all | morning | afternoon | evening | night
  const formatParam = searchParams.get('format') || saved.format || 'all' // all | 2D | 3D | IMAX | 4DX ...
  const langParam = searchParams.get('lang') || saved.lang || 'all' // all | en | hi | ml | ta ...

  // Persist to localStorage whenever params change
  useEffect(()=>{
    const data = { price: priceParam, time: timeParam, format: formatParam, lang: langParam }
    localStorage.setItem('showtimesFilters', JSON.stringify(data))
  }, [priceParam, timeParam, formatParam, langParam])

  useEffect(()=>{
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch movie details and showtimes in parallel
        const [movieData, showtimesResponse] = await Promise.all([
          MoviesAPI.get(id),
          MoviesAPI.showtimes(id)  // Using the correct endpoint from MoviesAPI
        ])
        
        setMovie(movieData)
        setShowtimes(showtimesResponse || [])
      } catch (err) {
        console.error('Error fetching showtimes:', err)
        setError('Failed to load showtimes. Please try again later.')
        toast.error('Failed to load showtimes')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [id])

  // Load related movies once movie is known
  useEffect(()=>{
    if(!movie) return
    const genres = Array.isArray(movie.genre) ? movie.genre : []
    if(genres.length === 0) return
    MoviesAPI.list({ view: 'active', sort: '-releasedAt' })
      .then(list => {
        const rel = list
          .filter(m => (m._id || m.id) !== (movie._id || movie.id))
          .filter(m => {
            const g = Array.isArray(m.genre) ? m.genre : (Array.isArray(m.genres) ? m.genres : [])
            return g.some(x => genres.includes(x))
          })
          .slice(0, 8)
        setRelated(rel)
      })
      .catch(()=> setRelated([]))
  }, [movie])

  const days = Array.from({length:7}).map((_,i)=>{
    const d = new Date(); d.setDate(d.getDate()+i)
    const key = d.toISOString().slice(0,10)
    const isToday = i===0
    const label = d.toLocaleDateString(undefined,{weekday:'short'})
    const dayNum = d.getDate().toString().padStart(2,'0')
    const mon = d.toLocaleDateString(undefined,{month:'short'})
    return {key,isToday,label,dayNum,mon}
  })

  const filteredByDate = useMemo(()=>
    showtimes.filter(st=> new Date(st.startTime).toISOString().slice(0,10) === selectedDate)
  ,[showtimes, selectedDate])

  const filteredByPrice = useMemo(()=>{
    if (priceParam === 'all') return filteredByDate
    return filteredByDate.filter(st => {
      const p = Number(st.price || 0)
      if (priceParam === 'lte150') return p <= 150
      if (priceParam === '150-250') return p >= 150 && p <= 250
      if (priceParam === '250-400') return p >= 250 && p <= 400
      if (priceParam === 'gt400') return p > 400
      return true
    })
  }, [filteredByDate, priceParam])

  const filteredByTime = useMemo(()=>{
    if (timeParam === 'all') return filteredByPrice
    return filteredByPrice.filter(st => {
      const h = new Date(st.startTime).getHours()
      if (timeParam === 'morning') return h >= 6 && h < 12
      if (timeParam === 'afternoon') return h >= 12 && h < 17
      if (timeParam === 'evening') return h >= 17 && h < 21
      if (timeParam === 'night') return h >= 21 || h < 6
      return true
    })
  }, [filteredByPrice, timeParam])
  
  const filteredByFormat = useMemo(()=>{
    if (formatParam === 'all') return filteredByTime
    return filteredByTime.filter(st => {
      const f1 = (st.format || '').toString().toLowerCase()
      const f2 = Array.isArray(st.formats) ? st.formats.map(x=> String(x).toLowerCase()) : []
      const target = formatParam.toLowerCase()
      return f1 === target || f2.includes(target)
    })
  }, [filteredByTime, formatParam])

  const filtered = useMemo(()=>{
    if (langParam === 'all') return filteredByFormat
    return filteredByFormat.filter(st => {
      const sLang = (st.language || st.audioLanguage || '').toString().toLowerCase()
      return sLang === langParam.toLowerCase()
    })
  }, [filteredByFormat, langParam])
  const byTheater = filtered.reduce((acc,st)=>{
    const th = st.theater?._id || 'unknown'
    if(!acc[th]) acc[th] = { theater: st.theater, items: [] }
    acc[th].items.push(st)
    return acc
  }, {})
  const theaterGroups = Object.values(byTheater).map(g=> ({...g, items: g.items.sort((a,b)=> new Date(a.startTime)-new Date(b.startTime))}))

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2">Loading showtimes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
          <p className="text-red-200">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Movie not found</h2>
          <p className="mb-4">The movie you're looking for doesn't exist or has been removed.</p>
          <Link 
            to="/movies" 
            className="inline-block bg-brand hover:bg-brand-dark text-white font-medium py-2 px-6 rounded-lg transition"
          >
            Browse Movies
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold">Select a Showtime</h1>
        {movie && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/70">
            <span className="font-semibold text-white">{movie.title}</span>
            {Array.isArray(movie.genre) && movie.genre.slice(0,3).map(g=> (
              <span key={g} className="px-2 py-0.5 rounded bg-white/10 text-xs">{g}</span>
            ))}
            {movie.language && <span className="px-2 py-0.5 rounded bg-white/10 text-xs">{movie.language}</span>}
            {movie.duration && <span className="px-2 py-0.5 rounded bg-white/10 text-xs">{movie.duration} min</span>}
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
        {days.map((d)=> (
          <button
            key={d.key}
            onClick={()=> setSelectedDate(d.key)}
            className={`min-w-[68px] px-3 py-2 rounded-lg border text-left transition ${selectedDate===d.key ? 'bg-white/15 border-white/25 shadow-sm' : 'border-white/10 bg-white/[0.04] hover:bg-white/10 hover:border-white/25 hover:shadow'}`}
          >
            <div className="text-[10px] uppercase tracking-wide opacity-75">{d.label}</div>
            <div className="text-lg font-semibold">{d.dayNum} <span className="text-xs font-normal align-top">{d.mon}</span></div>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4 text-xs">
        {movie?.language && (
          <span className="px-2 py-1 rounded bg-white/5 border border-white/10">{movie.language} - 2D</span>
        )}
        <div className="flex items-center gap-2">
          <span className="opacity-75">Price Range</span>
          {[
            {k:'all', label:'All'},
            {k:'lte150', label:'≤ ₹150'},
            {k:'150-250', label:'₹150–₹250'},
            {k:'250-400', label:'₹250–₹400'},
            {k:'gt400', label:'≥ ₹400'},
          ].map(opt=> (
            <button key={opt.k} onClick={()=> { searchParams.set('price', opt.k); setSearchParams(searchParams) }} className={`px-2 py-1 rounded border transition ${priceParam===opt.k ? 'bg-white/15 border-white/25 shadow-sm' : 'border-white/10 bg-white/[0.04] hover:bg-white/10 hover:border-white/25 hover:shadow'}`}>{opt.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="opacity-75">Preferred Time</span>
          {[
            {k:'all', label:'All'},
            {k:'morning', label:'Morning'},
            {k:'afternoon', label:'Afternoon'},
            {k:'evening', label:'Evening'},
            {k:'night', label:'Night'},
          ].map(opt=> (
            <button key={opt.k} onClick={()=> { searchParams.set('time', opt.k); setSearchParams(searchParams) }} className={`px-2 py-1 rounded border transition ${timeParam===opt.k ? 'bg-white/15 border-white/25 shadow-sm' : 'border-white/10 bg-white/[0.04] hover:bg-white/10 hover:border-white/25 hover:shadow'}`}>{opt.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="opacity-75">Format</span>
          {[
            {k:'all', label:'All'},
            {k:'2d', label:'2D'},
            {k:'3d', label:'3D'},
            {k:'imax', label:'IMAX'},
            {k:'4dx', label:'4DX'},
          ].map(opt=> (
            <button key={opt.k} onClick={()=> { searchParams.set('format', opt.k); setSearchParams(searchParams) }} className={`px-2 py-1 rounded border transition ${formatParam===opt.k ? 'bg-white/15 border-white/25 shadow-sm' : 'border-white/10 bg-white/[0.04] hover:bg-white/10 hover:border-white/25 hover:shadow'}`}>{opt.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="opacity-75">Language</span>
          {[
            {k:'all', label:'All'},
            {k:'en', label:'English'},
            {k:'hi', label:'Hindi'},
            {k:'ml', label:'Malayalam'},
            {k:'ta', label:'Tamil'},
            {k:'te', label:'Telugu'},
          ].map(opt=> (
            <button key={opt.k} onClick={()=> { searchParams.set('lang', opt.k); setSearchParams(searchParams) }} className={`px-2 py-1 rounded border transition ${langParam===opt.k ? 'bg-white/15 border-white/25 shadow-sm' : 'border-white/10 bg-white/[0.04] hover:bg-white/10 hover:border-white/25 hover:shadow'}`}>{opt.label}</button>
          ))}
        </div>
        <div className="flex-1"/>
        <button
          className="px-3 py-1.5 rounded bg-brand text-white shadow hover:bg-brand-dark hover:shadow-md transition"
          onClick={()=>{
            try { localStorage.removeItem('showtimesFilters') } catch {}
            const empty = new URLSearchParams()
            setSearchParams(empty)
          }}
        >Reset filters</button>
      </div>

      {theaterGroups.map(group => (
        <div key={group.theater?._id || 't'} className="rounded-xl border border-white/10 bg-white/5 mt-6">
          <div className="p-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              {group.theater?.logo && (
                <img src={group.theater.logo} alt={group.theater.name} className="h-8 w-8 rounded"/>
              )}
              <div>
                <div className="font-semibold">{group.theater?.name}</div>
                <div className="text-xs text-white/60">{group.theater?.location?.city}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.items.map(st => {
                const total = Number(st.totalSeats || 0)
                const remaining = Number(st.availableSeats ?? st.remainingSeats ?? (total || 0))
                const ratio = total > 0 ? remaining / total : 1
                const fast = ratio <= 0.3
                const soldOut = total > 0 && remaining === 0
                const classes = soldOut
                  ? 'px-3 py-2 rounded-md border transition bg-white/10 text-white/60 border-white/15 cursor-not-allowed'
                  : `px-3 py-2 rounded-md border transition ${fast ? 'bg-amber-500/15 text-amber-300 border-amber-400/20 hover:bg-amber-500/25' : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20 hover:bg-emerald-500/25'}`
                const content = (
                  <div className="flex items-center gap-2">
                    <span>{new Date(st.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    <span className={`text-[10px] uppercase tracking-wide ${soldOut ? 'text-white/60' : fast ? 'text-amber-300' : 'text-emerald-300'}`}>{soldOut ? 'Sold out' : fast ? 'Fast filling' : 'Available'}</span>
                  </div>
                )
                return soldOut ? (
                  <span key={st._id} className={classes}>{content}</span>
                ) : (
                  <Link key={st._id} to={`/showtimes/${st._id}/seats`} className={classes}>
                    {content}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      ))}

      {related.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold">Related Movies</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
            {related.map(m => (
              <MovieCard key={m._id || m.id} movie={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
