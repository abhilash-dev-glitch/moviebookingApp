import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Carousel({ items, autoSlide = true, interval = 5000 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === items.length - 1 ? 0 : prevIndex + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? items.length - 1 : prevIndex - 1));
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (!autoSlide || isPaused) return;

    const timer = setTimeout(() => {
      nextSlide();
    }, interval);

    return () => clearTimeout(timer);
  }, [currentIndex, isPaused, autoSlide, interval]);

  return (
    <div 
      className="relative w-full h-full overflow-hidden rounded-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {items.map((item, index) => (
          <div key={index} className="w-full flex-shrink-0 h-full relative">
            <img 
              src={item.image} 
              alt={item.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl w-full mx-auto px-8 text-white">
                <div className="max-w-2xl">
                  {item.tag && (
                    <span className="inline-block px-3 py-1 text-xs font-semibold bg-brand/90 text-white rounded-full mb-4">
                      {item.tag}
                    </span>
                  )}
                  <h2 className="text-3xl md:text-5xl font-bold mb-4">{item.title}</h2>
                  <p className="text-gray-200 mb-6">{item.description}</p>
                  <div className="flex flex-wrap gap-3">
                    {item.ctaPrimary && (
                      <Link 
                        to={item.ctaPrimary.link} 
                        className="px-6 py-3 bg-brand hover:bg-brand-dark text-white font-medium rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        {item.ctaPrimary.text}
                      </Link>
                    )}
                    {item.ctaSecondary && (
                      <Link 
                        to={item.ctaSecondary.link} 
                        className="px-6 py-3 border border-white/20 hover:bg-white/5 text-white font-medium rounded-lg transition-all"
                      >
                        {item.ctaSecondary.text}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full focus:outline-none z-10 transition-all"
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full focus:outline-none z-10 transition-all"
        aria-label="Next slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${currentIndex === index ? 'bg-white w-6' : 'bg-white/50'}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
