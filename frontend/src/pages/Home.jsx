import { useEffect, useState } from 'react';
import { MoviesAPI } from '../lib/api';
import MovieCard from '../components/MovieCard';
import Carousel from '../components/Carousel';
import { toast } from '../lib/toast';

export default function Home(){
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState('active') // 'active' | 'new' | 'all' | 'inactive'

  useEffect(() => {
    setLoading(true)
    setError(null)
    const params =
      view === 'new'
        ? { view: 'new' }
        : view === 'all'
        ? { view: 'all', sort: '-releasedAt' }
        : view === 'inactive'
        ? { view: 'inactive' }
        : { view: 'active', sort: '-releasedAt' }
    MoviesAPI.list(params)
      .then(setMovies)
      .catch((e) => {
        setError('Failed to load movies')
        toast.error('Failed to load movies', e?.response?.data?.message || 'Please try again')
      })
      .finally(() => setLoading(false))
  }, [view])

  // Sample carousel items
  const carouselItems = [
    {
      id: 1,
      title: "Now in Theaters",
      description: "Experience the latest blockbusters in stunning 4K with Dolby Atmos sound. Book your tickets now for an unforgettable cinematic journey.",
      image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      tag: "NOW SHOWING",
      ctaPrimary: { text: "Book Tickets", link: "/movies?filter=now-showing" },
      ctaSecondary: { text: "View Showtimes", link: "/showtimes" }
    },
    {
      id: 2,
      title: "Summer Music Festival 2023",
      description: "Join us for the biggest music event of the year! Three days of non-stop performances from top international artists across multiple stages.",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      tag: "UPCOMING EVENT",
      ctaPrimary: { text: "Get Tickets", link: "/events/summer-festival-2023" },
      ctaSecondary: { text: "Learn More", link: "/events" }
    },
    {
      id: 3,
      title: "Special Offer: Family Package",
      description: "Enjoy a family movie night with our exclusive package: 4 tickets + 2 large popcorns + 4 drinks for just $49.99. Limited time offer!",
      image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1459&q=80",
      tag: "SPECIAL OFFER",
      ctaPrimary: { text: "Claim Offer", link: "/offers/family-package" },
      ctaSecondary: { text: "View All Offers", link: "/offers" }
    },
    {
      id: 4,
      title: "Classic Movie Nights",
      description: "Relive the golden era of cinema with our special screenings of timeless classics. Every Wednesday night at 7 PM.",
      image: "https://images.unsplash.com/photo-1536440136628-709d9faba1b8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      tag: "SPECIAL SCREENING",
      ctaPrimary: { text: "View Schedule", link: "/classics" },
      ctaSecondary: { text: "Learn More", link: "/about/classics" }
    }
  ];

  return (
    <div>
      {/* Hero Carousel Section */}
      <section className="bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="h-[500px] md:h-[600px] w-full">
            <Carousel items={carouselItems} autoSlide={true} interval={6000} />
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6" id="recommended">
          <div className="mb-4 md:mb-0">
            <h2 className="text-2xl font-bold text-white">Curated for You</h2>
            <p className="text-sm text-gray-400 mt-1">Handpicked selections based on what's trending and highly rated</p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-gray-900/50 p-1 rounded-lg">
            {[['active', 'Now Showing'], ['new', 'New Releases'], ['all', 'All Movies'], ['inactive', 'Coming Soon']].map(([v, label])=> (
              <button
                key={v}
                onClick={()=> setView(v)}
                className={`px-3 py-1 rounded border transition ${view===v ? 'bg-white/15 border-white/25 shadow-sm' : 'border-white/10 bg-white/[0.04] hover:bg-white/10 hover:border-white/25 hover:shadow'}`}
              >{label}</button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 mt-4">
            {Array.from({length:5}).map((_,i)=> (
              <div key={i} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse"/>
            ))}
          </div>
        ) : error ? (
          <div className="mt-4 text-sm text-red-300">{error}</div>
        ) : (
          movies.length === 0 ? (
            <div className="mt-6 text-white/70">No movies available right now. Please check back later.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 mt-4">
              {movies.map((m) => <MovieCard key={m._id || m.id} movie={m} />)}
            </div>
          )
        )}
      </section>

      {/* Events Section */}
      <section id="events" className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 text-xs font-semibold bg-brand/20 text-brand rounded-full mb-3">LIVE EVENTS</span>
          <h2 className="text-3xl font-bold text-white mb-2">Experience the Magic of Live</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">From electrifying concerts to captivating theater performances, be part of unforgettable moments that bring people together.</p>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Upcoming Events</h2>
          <a href="/events" className="text-sm font-medium text-brand hover:underline flex items-center">
            View all events
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Event Card 1 - Music Concert */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:border-brand/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="relative h-48">
              <img 
                src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                alt="Summer Music Festival"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="inline-block px-2 py-1 text-xs font-semibold bg-brand text-white rounded-full">Music</span>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center text-sm text-gray-400 mb-2">
                <svg className="w-4 h-4 mr-1.5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                June 15, 2023
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Summer Music Festival</h3>
              <p className="text-gray-400 text-sm mb-4">Immerse yourself in a weekend of electrifying performances across multiple stages, featuring chart-topping artists and emerging talents from around the globe. Food trucks, art installations, and unforgettable memories await!</p>
              <div className="flex justify-between items-center">
                <span className="text-brand font-medium">Starting at $49</span>
                <button className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-lg transition-colors">
                  Book Now
                </button>
              </div>
            </div>
          </div>

          {/* Event Card 2 - Stand-up Comedy */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:border-brand/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="relative h-48">
              <img 
                src="https://images.unsplash.com/photo-1505373876331-ff89baa7e7e1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                alt="Comedy Night"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="inline-block px-2 py-1 text-xs font-semibold bg-purple-500 text-white rounded-full">Comedy</span>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center text-sm text-gray-400 mb-2">
                <svg className="w-4 h-4 mr-1.5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                June 22, 2023
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Laugh Factory Night</h3>
              <p className="text-gray-400 text-sm mb-4">Get ready for a night where laughter is guaranteed! Our handpicked lineup of the country's funniest comedians will have you in stitches with their sharp wit and hilarious observations about everyday life. 18+ event.</p>
              <div className="flex justify-between items-center">
                <span className="text-brand font-medium">Starting at $29</span>
                <button className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-lg transition-colors">
                  Book Now
                </button>
              </div>
            </div>
          </div>

          {/* Event Card 3 - Theater Play */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:border-brand/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="relative h-48">
              <img 
                src="https://images.unsplash.com/photo-1507924538820-ede94a04019d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                alt="Theater Play"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="inline-block px-2 py-1 text-xs font-semibold bg-yellow-500 text-white rounded-full">Theater</span>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center text-sm text-gray-400 mb-2">
                <svg className="w-4 h-4 mr-1.5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                July 5-10, 2023
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Romeo & Juliet</h3>
              <p className="text-gray-400 text-sm mb-4">Experience Shakespeare's masterpiece like never before in this breathtaking modern adaptation. The National Theater Company brings a fresh perspective to the classic tale of star-crossed lovers, featuring stunning set design and powerful performances that will leave you spellbound.</p>
              <div className="flex justify-between items-center">
                <span className="text-brand font-medium">Starting at $39</span>
                <button className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-lg transition-colors">
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready for Your Next Adventure?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">Join thousands of entertainment lovers who trust us for their movie and event bookings. Never miss out on the best experiences in town.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="/signup" className="px-6 py-3 bg-brand hover:bg-brand-dark text-white font-medium rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg">
              Create Free Account
            </a>
            <a href="#recommended" className="px-6 py-3 border border-white/20 hover:bg-white/5 text-white font-medium rounded-lg transition-all">
              Browse Movies & Events
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
