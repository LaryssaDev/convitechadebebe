import React from 'react';
import { Calendar, MapPin, Sparkles, Clock } from 'lucide-react';

export default function EventInfo() {
  const address = "Rua da Torre, 15 – Bairro dos Penhas, Franco da Rocha – SP";
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Chácara Guimarães, " + address)}`;

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-pink-100 shadow-xs relative overflow-hidden">
      {/* Delicate top pastel line ornament */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-pink-200 via-white to-blue-200"></div>

      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-50 text-pink-600 rounded-full text-xs font-semibold tracking-wide">
          <Sparkles className="w-3 h-3 animate-spin text-pink-400" />
          Aniversário + Chá de Bebê
        </span>
        <span className="text-xs font-medium text-blue-500">Convite Especial</span>
      </div>

      <h2 className="font-display font-bold text-2xl text-stone-800 tracking-tight leading-tight mb-2">
        Nossa Celebração
      </h2>
      <p className="text-sm text-stone-500 leading-relaxed mb-6">
        Prepare-se para um dia cheio de afeto, sorrisos e recordações inesquecíveis. Estamos ansiosos para comemorar em família!
      </p>

      <div className="space-y-4 text-stone-700">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-pink-50 rounded-xl text-pink-500 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs uppercase font-bold text-stone-400 tracking-wider">Data do Evento</h4>
            <p className="text-sm font-semibold text-stone-800">Sábado, 08 de Agosto de 2026</p>
            <p className="text-xs text-stone-500 mt-0.5">A partir das 11:00h</p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-500 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs uppercase font-bold text-stone-400 tracking-wider">Local do Evento</h4>
            <p className="text-sm font-semibold text-stone-800 truncate">Chácara Guimarães</p>
            <p className="text-xs text-stone-500 leading-relaxed mt-0.5 break-words">
              {address}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-dotted border-stone-100 flex justify-center">
        <a 
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 active:scale-95"
        >
          <MapPin className="w-3.5 h-3.5" />
          Como Chegar (Google Maps)
        </a>
      </div>
    </div>
  );
}
