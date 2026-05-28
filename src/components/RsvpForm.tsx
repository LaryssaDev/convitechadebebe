import React, { useState, useEffect } from 'react';
import { Heart, Plus, Minus, CheckCircle, Car, Bus, User, Users, ChevronRight, HelpCircle } from 'lucide-react';
import { addRSVP } from '../storage';
import { Companion, TransportType } from '../types';

interface RsvpFormProps {
  onSuccess: () => void;
}

export default function RsvpForm({ onSuccess }: RsvpFormProps) {
  // Main form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [hasCompanions, setHasCompanions] = useState<boolean>(false);
  const [companionsCount, setCompanionsCount] = useState<number>(1);
  const [companions, setCompanions] = useState<Companion[]>([{ id: '1', firstName: '', lastName: '' }]);
  const [transport, setTransport] = useState<TransportType>('car');

  // Status states
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update companions array size dynamically as the companionsCount number grows or shrinks
  useEffect(() => {
    if (!hasCompanions) {
      setCompanions([]);
      return;
    }

    const count = Math.max(1, companionsCount);
    setCompanions((prev) => {
      const updated = [...prev];
      if (updated.length < count) {
        // Need to add fields
        for (let i = updated.length; i < count; i++) {
          updated.push({
            id: `new-comp-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
            firstName: '',
            lastName: ''
          });
        }
      } else if (updated.length > count) {
        // Need to remove fields
        return updated.slice(0, count);
      }
      return updated;
    });
  }, [companionsCount, hasCompanions]);

  // Handle companion field changes
  const handleCompanionFieldChange = (index: number, field: 'firstName' | 'lastName', value: string) => {
    setCompanions((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };

  // Toggle companion state
  const handleHasCompanionsChange = (val: boolean) => {
    setHasCompanions(val);
    if (val && companions.length === 0) {
      setCompanions([{ id: `comp-initial-${Date.now()}`, firstName: '', lastName: '' }]);
      setCompanionsCount(1);
    }
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors: string[] = [];

    // Fields trimming and validations
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();

    if (!cleanFirstName) newErrors.push('Por favor, informe seu nome.');
    if (!cleanLastName) newErrors.push('Por favor, informe seu sobrenome.');

    let cleanCompanions: Companion[] = [];
    if (hasCompanions) {
      if (companionsCount < 1) {
        newErrors.push('Por favor, informe pelo menos 1 acompanhante.');
      }
      
      companions.forEach((comp, idx) => {
        const compFirstName = comp.firstName.trim();
        const compLastName = comp.lastName.trim();
        if (!compFirstName || !compLastName) {
          newErrors.push(`Por favor, preencha o nome completo do acompanhante #${idx + 1}.`);
        } else {
          cleanCompanions.push({
            id: comp.id,
            firstName: compFirstName,
            lastName: compLastName
          });
        }
      });
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      // Auto scroll to top of form or list of errors
      return;
    }

    setErrors([]);
    setIsSubmitting(true);

    try {
      // Save with default/pending invitation type via storage helper
      await addRSVP({
        firstName: cleanFirstName,
        lastName: cleanLastName,
        hasCompanions,
        companionsCount: hasCompanions ? cleanCompanions.length : 0,
        companions: cleanCompanions,
        transport
      });

      setIsSubmitted(true);
      // Tell parent to refresh if needed (e.g. admin table updates)
      onSuccess();
    } catch (err) {
      console.error('Error submitting RSVP:', err);
      setErrors(['Erro ao salvar a sua confirmação no banco de dados. Por favor, tente novamente.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFirstName('');
    setLastName('');
    setHasCompanions(false);
    setCompanionsCount(1);
    setCompanions([{ id: '1', firstName: '', lastName: '' }]);
    setTransport('car');
    setIsSubmitted(false);
    setErrors([]);
  };

  if (isSubmitted) {
    return (
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 border border-pink-100 shadow-sm text-center max-w-lg mx-auto py-10 animate-fade-in">
        <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-pink-100">
          <Heart className="w-8 h-8 text-pink-500 fill-pink-300 animate-pulse" />
        </div>
        <h3 className="font-display font-bold text-2xl text-stone-800 tracking-tight mb-3">
          Prontinho!
        </h3>
        <p className="text-stone-600 font-medium text-base mb-6 leading-relaxed max-w-sm mx-auto">
          Presença confirmada com sucesso! Obrigada por fazer parte desse momento especial 💖
        </p>
        <div className="bg-pink-50/50 rounded-xl p-4 text-xs text-stone-500 max-w-xs mx-auto mb-8 border border-pink-100/50">
          <p className="font-semibold text-pink-700 mb-1">Guarde essas informações:</p>
          <p>📅 Dia 08 de Agosto | 📍 Chácara Guimarães</p>
          <p className="mt-1">
            Transporte: {transport === 'van' ? '🚍 Van / Organizador' : '🚗 Carro Próprio'}
          </p>
        </div>
        
        <button
          onClick={handleReset}
          className="px-6 py-3 bg-linear-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 shadow-sm hover:shadow-xs active:scale-98"
        >
          Confirmar outra resposta
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-pink-100 shadow-xs max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-pink-50 rounded-lg text-pink-500">
          <Heart className="w-5 h-5 fill-pink-200" />
        </div>
        <div>
          <h2 className="font-display font-bold text-xl text-stone-800">
            Confirmar Presença
          </h2>
          <p className="text-xs text-stone-400">Preencha os campos abaixo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error message list */}
        {errors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-1">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Atenção:</p>
            <ul className="text-xs text-stone-600 list-disc list-inside space-y-0.5">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Guest Full Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-stone-400" />
              Seu Nome *
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="ex: Mariana"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all placeholder:text-stone-300"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
              Seu Sobrenome *
            </label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="ex: Silva"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all placeholder:text-stone-300"
            />
          </div>
        </div>

        {/* Accompanists trigger question */}
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-stone-400" />
            Vai levar acompanhante ao evento? *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleHasCompanionsChange(false)}
              className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-150 border flex items-center justify-center gap-2 ${
                !hasCompanions
                  ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-xs'
                  : 'bg-stone-50/50 border-stone-100 hover:border-stone-200 text-stone-500'
              }`}
            >
              Não, vou sozinho(a)
            </button>
            <button
              type="button"
              onClick={() => handleHasCompanionsChange(true)}
              className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-150 border flex items-center justify-center gap-2 ${
                hasCompanions
                  ? 'bg-pink-50 border-pink-200 text-pink-700 shadow-xs'
                  : 'bg-stone-50/50 border-stone-100 hover:border-stone-200 text-stone-500'
              }`}
            >
              Sim, vou acompanhado(a)
            </button>
          </div>
        </div>

        {/* If has companions is True, show dynamic count and input fields */}
        {hasCompanions && (
          <div className="p-4 bg-pink-50/30 border border-pink-100/50 rounded-xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-pink-700 uppercase tracking-wider">
                  Quantos acompanhantes?
                </h4>
                <p className="text-[10px] text-stone-400">Insira a quantidade</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCompanionsCount(prev => Math.max(1, prev - 1))}
                  className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 active:scale-95 transition-all text-sm font-bold"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="w-10 text-center font-bold text-stone-800 text-base">
                  {companionsCount}
                </div>
                <button
                  type="button"
                  onClick={() => setCompanionsCount(prev => Math.min(10, prev + 1))}
                  className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 active:scale-95 transition-all text-sm font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Render dynamic inputs for every companion */}
            <div className="space-y-3 pt-3 border-t border-dashed border-pink-100">
              {companions.map((comp, idx) => (
                <div key={comp.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-pink-600 flex items-center gap-1">
                      <ChevronRight className="w-3 h-3 text-pink-400" />
                      Acompanhante #{idx + 1}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Nome do acompanhante"
                      value={comp.firstName}
                      onChange={(e) => handleCompanionFieldChange(idx, 'firstName', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-lg text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-pink-200 focus:border-pink-300 transition-all placeholder:text-stone-300"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Sobrenome do acompanhante"
                      value={comp.lastName}
                      onChange={(e) => handleCompanionFieldChange(idx, 'lastName', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-lg text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-pink-200 focus:border-pink-300 transition-all placeholder:text-stone-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transportation choice */}
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1">
            <Car className="w-3.5 h-3.5 text-stone-400" />
            Como você vai? *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Van transportation */}
            <button
              type="button"
              onClick={() => setTransport('van')}
              className={`p-4 rounded-xl border flex items-center gap-4 text-left transition-all duration-200 ${
                transport === 'van'
                  ? 'bg-blue-50/70 border-blue-200 text-blue-900 shadow-xs'
                  : 'bg-stone-50/50 border-stone-100 hover:border-stone-200 text-stone-600'
              }`}
            >
              <div className={`p-2 rounded-lg ${transport === 'van' ? 'bg-blue-100 text-blue-600' : 'bg-stone-100 text-stone-400'}`}>
                <Bus className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider leading-none">Van / Coletivo</p>
                <p className="text-[10px] mt-1 text-stone-400">Transporte organizado especial</p>
              </div>
            </button>

            {/* Individual car transport */}
            <button
              type="button"
              onClick={() => setTransport('car')}
              className={`p-4 rounded-xl border flex items-center gap-4 text-left transition-all duration-200 ${
                transport === 'car'
                  ? 'bg-pink-50/70 border-pink-200 text-pink-900 shadow-xs'
                  : 'bg-stone-50/50 border-stone-100 hover:border-stone-200 text-stone-600'
              }`}
            >
              <div className={`p-2 rounded-lg ${transport === 'car' ? 'bg-pink-100 text-pink-600' : 'bg-stone-100 text-stone-400'}`}>
                <Car className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider leading-none">Carro Próprio</p>
                <p className="text-[10px] mt-1 text-stone-400">Vou direto por minha conta</p>
              </div>
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-4 px-6 bg-linear-to-r from-pink-400 via-pink-400 to-blue-400 text-white font-display font-medium text-base rounded-xl hover:shadow-xs focus:outline-hidden select-none transition-all text-center tracking-wide flex items-center justify-center gap-2 ${
            isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-95 cursor-pointer active:scale-99'
          }`}
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white/35 border-t-white rounded-full"></span>
              Enviando...
            </>
          ) : (
            'Confirmar Presença ✨'
          )}
        </button>
      </form>
    </div>
  );
}
