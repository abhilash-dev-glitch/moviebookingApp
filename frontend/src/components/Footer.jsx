export default function Footer(){
  return (
    <footer className="bg-[#111528] text-white/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between py-6 gap-4">
          <div className="font-medium flex items-center gap-2">
            <span className="text-brand">List your Show</span>
            <span className="hidden sm:inline">Got a show, event, activity or a great experience? Partner with CineGo & get listed.</span>
          </div>
          <button className="px-4 py-2 rounded-md bg-brand hover:bg-brand-dark transition text-white text-sm">Contact today!</button>
        </div>
      </div>
      <div className="bg-[#0d1223]">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 text-center text-xs">
          <div className="opacity-80">24/7 CUSTOMER CARE</div>
          <div className="opacity-80">RESEND BOOKING CONFIRMATION</div>
          <div className="opacity-80">SUBSCRIBE TO THE NEWSLETTER</div>
          <div className="opacity-80">PARTNER WITH US</div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6 text-xs text-center text-white/40">© {new Date().getFullYear()} CineGo — Demo UI</div>
    </footer>
  )
}
