import React, { useState } from 'react';
import { 
  Heart, Sparkles, Sliders, ClipboardCheck, 
  MapPin, Gift, Map, MailOpen, User, Baby, Activity
} from 'lucide-react';
import Countdown from './components/Countdown';
import EventInfo from './components/EventInfo';
import RsvpForm from './components/RsvpForm';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [activeTab, setActiveTab] = useState<'rsvp' | 'admin'>('rsvp');
  const [rsvpSyncTrigger, setRsvpSyncTrigger] = useState(0);

  // Trigger state updates in admin panel when a new rsvp is submitted
  const handleRsvpSuccess = () => {
    setRsvpSyncTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-linear-to-tr from-pink-50 via-white to-blue-50/80 text-stone-700 font-sans selection:bg-pink-100 selection:text-pink-700 relative overflow-x-hidden">
      
      {/* Soft background floating light bubbles for baby theme */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-pink-100/60 blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-blue-100/50 blur-3xl -z-10 pointer-events-none"></div>

      {/* Primary elegant navigation header */}
      <header className="sticky top-0 bg-white/60 backdrop-blur-md border-b border-pink-100/60 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          
          {/* Logo / Event tag */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('rsvp')}>
            <div className="relative">
              <div className="absolute inset-0 bg-pink-100 rounded-full blur-xs"></div>
              <div className="relative p-1.5 bg-white rounded-full border border-pink-200">
                <Heart className="w-4 h-4 text-pink-500 fill-pink-300" />
              </div>
            </div>
            <div>
              <span className="font-display font-black text-sm text-stone-800 tracking-tight block">
                Convite Especial
              </span>
              <span className="text-[9px] uppercase tracking-wider font-semibold text-pink-500 -mt-0.5 block">
                Aniversário + Chá de Bebê
              </span>
            </div>
          </div>

          {/* Tab switching buttons */}
          <nav className="flex items-center gap-1.5 p-1 bg-stone-100/80 rounded-xl border border-stone-200/40">
            <button
              onClick={() => setActiveTab('rsvp')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'rsvp'
                  ? 'bg-white text-pink-600 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <MailOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Confirmar Presença</span>
              <span className="sm:hidden">RSVP</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'admin'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Painel Admin</span>
            </button>
          </nav>

        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-6xl mx-auto py-8 sm:py-12 relative z-10">
        
        {activeTab === 'rsvp' ? (
          /* Public RSVP View */
          <div className="space-y-12">
            
            {/* Soft, beautiful Intro Typography */}
            <div className="text-center max-w-2xl mx-auto px-4 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-linear-to-r from-pink-100 to-blue-100 text-stone-700 rounded-full text-xs font-semibold shadow-3xs">
                <Baby className="w-3 h-3 text-blue-500" />
                <span className="font-display">Vocês são nossos convidados de honra!</span>
                <Sparkles className="w-3 h-3 text-pink-500 animate-pulse" />
              </div>

              <h1 className="font-display font-black text-3xl sm:text-4xl text-stone-900 tracking-tight leading-tight">
                Confirme sua presença
              </h1>
              
              <p className="text-sm sm:text-base text-stone-500 leading-relaxed font-normal">
                Estamos preparando tudo com muito carinho e precisamos saber se você estará com a gente nesse momento especial.
              </p>
            </div>

            {/* Content cards: info and countdown at side (on desktop) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 items-start">
              
              {/* Event detail cards on left/right side */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Event info card with data, map, etc. */}
                <EventInfo />

                {/* Circular lovely countdown */}
                <Countdown />

                {/* Cute baby-theme quote sticker */}
                <div className="p-4 bg-linear-to-tr from-pink-50/50 to-blue-50/50 border border-white rounded-2xl flex items-center gap-3.5 text-xs text-stone-500 shadow-3xs">
                  <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shrink-0 border border-pink-100 shadow-3xs">
                    <Gift className="w-4 h-4 text-pink-400" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-800 block">Dica para o enxoval:</span>
                    A sua presença é o maior presente! Mas se quiser cooperar, teremos uma caixinha de mimos no local. 🌸
                  </div>
                </div>

              </div>

              {/* Main RSVP submission Form container on right side */}
              <div className="lg:col-span-7">
                <RsvpForm onSuccess={handleRsvpSuccess} />
              </div>

            </div>

          </div>
        ) : (
          /* Administrative Dashboard View */
          <div className="animate-fade-in" key={rsvpSyncTrigger}>
            <AdminPanel />
          </div>
        )}

      </main>

      {/* Decorative and informational footer */}
      <footer className="mt-20 border-t border-stone-200/50 py-8 bg-white/40 backdrop-blur-xs text-center text-xs text-stone-400">
        <p className="font-semibold uppercase tracking-wider text-[10px] text-stone-400 font-display">
          Convite Especial © 2026
        </p>
        <p className="mt-1">
          Aniversário + Chá de Bebê | 08 de Agosto | Chácara Guimarães
        </p>
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-[11px] text-stone-400">
          <span className="flex items-center gap-1 justify-center">
            <Heart className="w-3 h-3 text-pink-400 fill-pink-400 animate-pulse" />
            Feito com amor por toda a família
          </span>
          <span className="hidden sm:inline text-stone-300">|</span>
          <span className="font-medium text-stone-500">Feito e validado pela TechNova Systems</span>
        </div>
      </footer>

    </div>
  );
}
