import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, Bus, Car, Hourglass, Calendar, 
  Search, Eye, LogOut, Key, Mail, ShieldAlert, Download, 
  Trash2, ToggleLeft, Activity, Grid, ListFilter, ClipboardCheck, ArrowUpDown
} from 'lucide-react';
import { getRSVPs, updateInvitationType, deleteRSVP, getDaysLeft } from '../storage';
import { RSVP, Companion } from '../types';

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('convite_admin_logged') === 'true';
  });
  
  // Login credentials states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // RSVP records and view filters states
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [transportFilter, setTransportFilter] = useState<'all' | 'van' | 'car'>('all');
  const [invitationFilter, setInvitationFilter] = useState<'all' | 'weekend' | 'day' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchRSVPs = async () => {
    setIsLoading(true);
    try {
      const data = await getRSVPs();
      setRsvps(data);
    } catch (error) {
      console.error('Error fetching RSVPs from firestore:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchRSVPs();
    }
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().toLowerCase() === 'admin@convite.com' && password === 'admin123') {
      setIsLoggedIn(true);
      setLoginError('');
      localStorage.setItem('convite_admin_logged', 'true');
    } else {
      setLoginError('Credenciais inválidas. Verifique seu e-mail e senha.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('convite_admin_logged');
  };

  const handleUpdateInviteType = async (id: string, value: 'weekend' | 'day') => {
    try {
      await updateInvitationType(id, value);
      // Re-fetch automatically
      await fetchRSVPs();
    } catch (error) {
      console.error('Failed to update invite type:', error);
    }
  };

  const handleDeleteEntry = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a confirmação de "${name}"?`)) {
      try {
        await deleteRSVP(id);
        // Re-fetch automatically
        await fetchRSVPs();
      } catch (error) {
        console.error('Failed to delete RSVP:', error);
      }
    }
  };

  // Stats Calculations
  const stats = {
    totalConfirmations: rsvps.length, // total families/registrations
    totalGuests: rsvps.reduce((acc, r) => acc + 1 + r.companionsCount, 0), // main + companions
    vanCount: rsvps.reduce((acc, r) => {
      const ppl = 1 + r.companionsCount;
      return r.transport === 'van' ? acc + ppl : acc;
    }, 0),
    carCount: rsvps.reduce((acc, r) => {
      const ppl = 1 + r.companionsCount;
      return r.transport === 'car' ? acc + ppl : acc;
    }, 0),
    weekendCount: rsvps.reduce((acc, r) => {
      const ppl = 1 + r.companionsCount;
      return r.invitationType === 'weekend' ? acc + ppl : acc;
    }, 0),
    dayCount: rsvps.reduce((acc, r) => {
      const ppl = 1 + r.companionsCount;
      return r.invitationType === 'day' ? acc + ppl : acc;
    }, 0),
    daysLeft: getDaysLeft()
  };

  // Flatten RSVPs to show companions as individual rows too
  const guestRows = React.useMemo(() => {
    const rows: Array<{
      id: string; // unique row id
      rsvpId: string;
      firstName: string;
      lastName: string;
      isCompanion: boolean;
      parentGuestName: string | null;
      companionsCount: number;
      companions: Companion[];
      transport: 'van' | 'car';
      createdAt: string;
      invitationType: 'weekend' | 'day' | 'pending';
    }> = [];

    rsvps.forEach((rsvp) => {
      // 1. Add the main guest row
      rows.push({
        id: `main-${rsvp.id}`,
        rsvpId: rsvp.id,
        firstName: rsvp.firstName,
        lastName: rsvp.lastName,
        isCompanion: false,
        parentGuestName: null,
        companionsCount: rsvp.companionsCount,
        companions: rsvp.companions,
        transport: rsvp.transport,
        createdAt: rsvp.createdAt,
        invitationType: rsvp.invitationType,
      });

      // 2. Add companion rows
      rsvp.companions.forEach((comp) => {
        rows.push({
          id: `comp-${comp.id}-${rsvp.id}`,
          rsvpId: rsvp.id,
          firstName: comp.firstName,
          lastName: comp.lastName,
          isCompanion: true,
          parentGuestName: `${rsvp.firstName} ${rsvp.lastName}`,
          companionsCount: 0,
          companions: [],
          transport: rsvp.transport,
          createdAt: rsvp.createdAt,
          invitationType: rsvp.invitationType,
        });
      });
    });

    return rows;
  }, [rsvps]);

  // Live filtering of guestRows
  const filteredGuests = React.useMemo(() => {
    return guestRows.filter(guest => {
      // Search match
      const fullName = `${guest.firstName} ${guest.lastName}`.toLowerCase();
      const parentMatch = guest.parentGuestName 
        ? guest.parentGuestName.toLowerCase().includes(searchTerm.toLowerCase())
        : false;
      const companionMatches = guest.companions.some(comp => 
        `${comp.firstName} ${comp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const searchMatch = fullName.includes(searchTerm.toLowerCase()) || parentMatch || companionMatches;

      // Transport filter matching
      const transportMatch = transportFilter === 'all' || guest.transport === transportFilter;

      // Invitation filter matching
      const invitationMatch = invitationFilter === 'all' 
        || guest.invitationType === invitationFilter 
        || (invitationFilter === 'day' && guest.invitationType === 'pending');

      return searchMatch && transportMatch && invitationMatch;
    }).sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      } else {
        // Date descending
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [guestRows, searchTerm, transportFilter, invitationFilter, sortBy]);

  // Export to CSV helper using flattened rows
  const handleExportCSV = () => {
    if (guestRows.length === 0) return;
    
    // Header
    const csvContent = [
      ['Tipo Registro', 'Nome', 'Sobrenome', 'Acompanhante de', 'Transporte Escolhido', 'Tipo de Convite', 'Data/Hora Confirmacao'],
      ...guestRows.map(g => [
        g.isCompanion ? 'Acompanhante' : 'Convidado Principal',
        g.firstName,
        g.lastName,
        g.parentGuestName || '-',
        g.transport === 'van' ? 'Van / Coletivo' : 'Carro Próprio',
        g.invitationType === 'weekend' ? 'Fim de Semana' : 'Apenas o Dia',
        new Date(g.createdAt).toLocaleString('pt-BR')
      ])
    ].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rsvp_todos_confirmados_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper date formatter
  const formatDateLocale = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  // Login View
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-10 px-4">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 border border-pink-100 shadow-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-linear-to-tr from-pink-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ClipboardCheck className="w-6 h-6 text-pink-500" />
            </div>
            <h2 className="font-display font-black text-2xl text-stone-800 tracking-tight">
              Área Administrativa
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Faça login para gerenciar as confirmações de presença.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-semibold mb-5 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                E-mail de acesso
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@convite.com"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all placeholder:text-stone-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-stone-400" />
                Senha
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all placeholder:text-stone-300"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-5 bg-gradient-to-r from-pink-400 to-blue-400 hover:from-pink-500 hover:to-blue-500 text-white rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 shadow-sm active:scale-98 cursor-pointer mt-2"
            >
              Entrar no Painel ➜
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-[10px] text-stone-300">
              Uso restrito para os administradores do evento.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View for Logged-In Admin
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
      
      {/* Admin header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 mb-6 border-b border-pink-100 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-pink-100/60 rounded-xl text-pink-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-black text-xl text-stone-800 tracking-tight">
              Painel Admin
            </h1>
            <p className="text-xs text-stone-400">Controle e estatísticas em tempo real</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            disabled={rsvps.length === 0}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar (.CSV)
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </div>

      {/* KPI stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        
        {/* Total families count */}
        <div className="bg-white p-4 rounded-xl border border-pink-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-tight block">
            Famílias / Respostas
          </span>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="font-display font-bold text-2xl text-stone-800">{stats.totalConfirmations}</span>
            <Users className="w-4 h-4 text-stone-300" />
          </div>
          <span className="text-[9px] text-stone-400 mt-1 leading-none">Formulários enviados</span>
        </div>

        {/* Total general headcount */}
        <div className="bg-white p-4 rounded-xl border border-pink-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-tight block">
            Pessoas Confirmadas
          </span>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="font-display font-bold text-2xl text-pink-600">{stats.totalGuests}</span>
            <UserCheck className="w-4 h-4 text-pink-300" />
          </div>
          <span className="text-[9px] text-stone-400 mt-1 leading-none">Famílias + Acompanhantes</span>
        </div>

        {/* Van travelers counts */}
        <div className="bg-white p-4 rounded-xl border border-pink-100 shadow-xs flex flex-col justify-between col-span-1">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-tight block">
            Vão de Van
          </span>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="font-display font-bold text-2xl text-blue-600">{stats.vanCount}</span>
            <Bus className="w-4 h-4 text-blue-300" />
          </div>
          <span className="text-[9px] text-stone-400 mt-1 leading-none">Pessoas em transporte</span>
        </div>

        {/* Car counts */}
        <div className="bg-white p-4 rounded-xl border border-pink-100 shadow-xs flex flex-col justify-between col-span-1">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-tight block">
            Vão de Carro
          </span>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="font-display font-bold text-2xl text-stone-800">{stats.carCount}</span>
            <Car className="w-4 h-4 text-stone-300" />
          </div>
          <span className="text-[9px] text-stone-400 mt-1 leading-none">Por meios próprios</span>
        </div>

        {/* Weekend counts */}
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 shadow-xs flex flex-col justify-between col-span-1">
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest leading-tight block">
            Fim de Semana
          </span>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="font-display font-bold text-2xl text-blue-700">{stats.weekendCount}</span>
            <Calendar className="w-4 h-4 text-blue-300" />
          </div>
          <span className="text-[9px] text-stone-400 mt-1 leading-none">Com pernoite na chácara</span>
        </div>

        {/* Day-only counts */}
        <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100/50 shadow-xs flex flex-col justify-between col-span-1">
          <span className="text-[10px] font-bold text-pink-600 uppercase tracking-widest leading-tight block">
            Apenas o Dia
          </span>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="font-display font-bold text-2xl text-pink-700">{stats.dayCount}</span>
            <Eye className="w-4 h-4 text-pink-300" />
          </div>
          <span className="text-[9px] text-stone-400 mt-1 leading-none">Vão para passar o dia</span>
        </div>

        {/* Countdown in days */}
        <div className="bg-linear-to-tr from-pink-100/40 to-blue-100/40 p-4 rounded-xl border border-pink-100 shadow-xs flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest leading-tight block">
            Contagem Regr.
          </span>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="font-display font-extrabold text-2xl text-pink-600">{stats.daysLeft}</span>
            <Hourglass className="w-4 h-4 text-pink-400 animate-spin" />
          </div>
          <span className="text-[9px] text-stone-400 mt-1 leading-none">Dias restantes para o chá</span>
        </div>

      </div>

      {/* Roster database tools and filters */}
      <div className="bg-white rounded-2xl border border-pink-100 p-5 shadow-xs mb-10">
        
        {/* Real-time Search and Category toggles */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6 pb-5 border-b border-stone-100">
          
          {/* Quick search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Buscar convidado principal ou acompanhante..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* Sorting field layout */}
            <div className="flex items-center gap-1.5 bg-stone-50 p-1 rounded-xl border border-stone-100">
              <span className="text-[10px] font-bold text-stone-400 pl-2">Ordenar por:</span>
              <button
                onClick={() => setSortBy('date')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  sortBy === 'date' 
                    ? 'bg-white text-stone-800 shadow-xs' 
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                Data Confirmação
              </button>
              <button
                onClick={() => setSortBy('name')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  sortBy === 'name' 
                    ? 'bg-white text-stone-800 shadow-xs' 
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                Nome
              </button>
            </div>

            {/* Transport Filter */}
            <div className="flex items-center gap-1 bg-stone-50 p-1 rounded-xl border border-stone-100 text-xs font-semibold text-stone-600">
              <span className="px-2 text-[10px] font-bold text-stone-400 whitespace-nowrap">Transporte:</span>
              <select
                value={transportFilter}
                onChange={(e) => setTransportFilter(e.target.value as any)}
                className="bg-transparent border-0 outline-hidden font-semibold cursor-pointer pr-3"
              >
                <option value="all">Todos</option>
                <option value="van">Van</option>
                <option value="car">Carro próprio</option>
              </select>
            </div>

            {/* Invitation Type Filter */}
            <div className="flex items-center gap-1 bg-stone-50 p-1 rounded-xl border border-stone-100 text-xs font-semibold text-stone-600">
              <span className="px-2 text-[10px] font-bold text-stone-400 whitespace-nowrap">Acomodação:</span>
              <select
                value={invitationFilter}
                onChange={(e) => setInvitationFilter(e.target.value as any)}
                className="bg-transparent border-0 outline-hidden font-semibold cursor-pointer pr-3"
              >
                <option value="all">Ver Todos</option>
                <option value="weekend">Fim de semana</option>
                <option value="day">Apenas o dia</option>
              </select>
            </div>

          </div>
        </div>

        {/* Counter of filtered results */}
        <div className="mb-4 text-xs font-medium text-stone-400 flex items-center justify-between">
          <span>
            Mostrando <strong className="text-stone-700">{filteredGuests.length}</strong> de <strong className="text-stone-700">{guestRows.length}</strong> pessoas confirmadas.
          </span>
          <span className="text-[10px] text-pink-400 italic">
            * Altere o tipo de convite inline para recalcular as acomodações.
          </span>
        </div>

        {/* Roster display container */}
        {isLoading ? (
          <div className="text-center py-20 bg-stone-50/30 rounded-2xl border border-stone-200 flex flex-col items-center justify-center animate-pulse">
            <span className="animate-spin inline-block w-6 h-6 border-2 border-pink-200 border-t-pink-500 rounded-full mb-3"></span>
            <p className="text-xs font-semibold text-stone-500">Carregando dados do Firebase...</p>
          </div>
        ) : filteredGuests.length === 0 ? (
          <div className="text-center py-16 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
            <ClipboardCheck className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-stone-600">Nenhum convidado correspondente encontrado</p>
            <p className="text-xs text-stone-400 mt-1">Experimente alterar as palavras-chave ou remover filtros de busca.</p>
          </div>
        ) : (
          <>
            {/* Desktop View Table: Shown on Medium Screen + */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-stone-100">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 text-stone-500 font-bold border-b border-stone-100">
                    <th className="p-4 uppercase tracking-wider font-bold">Convidado</th>
                    <th className="p-4 uppercase tracking-wider font-bold">Acompanhantes</th>
                    <th className="p-4 uppercase tracking-wider font-bold">Transporte</th>
                    <th className="p-4 uppercase tracking-wider font-bold">Cadastro</th>
                    <th className="p-4 uppercase tracking-wider font-bold text-center">Tipo de Convite</th>
                    <th className="p-4 uppercase tracking-wider font-bold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 font-medium">
                  {filteredGuests.map((guest) => {
                    const guestFullName = `${guest.firstName} ${guest.lastName}`;
                    return (
                      <tr key={guest.id} className="hover:bg-pink-50/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {guest.isCompanion ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded">
                                Acompanhante
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 bg-pink-50 text-pink-700 text-[9px] font-bold rounded">
                                Titular
                              </span>
                            )}
                            <div className="font-bold text-stone-800 text-sm">{guestFullName}</div>
                          </div>
                          <div className="text-[10px] text-stone-400 font-normal">Grupo RSVP: {guest.rsvpId}</div>
                        </td>
                        <td className="p-4">
                          {guest.isCompanion ? (
                            <span className="text-stone-500 text-xs">
                              Acompanhante de <strong className="text-pink-600 font-medium">{guest.parentGuestName}</strong>
                            </span>
                          ) : guest.companions.length > 0 ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center px-2 py-0.5 bg-pink-50 text-pink-700 text-[10px] font-bold rounded-md">
                                {guest.companionsCount} {guest.companionsCount === 1 ? 'acompanhante' : 'acompanhantes'}
                              </span>
                              <div className="text-[11px] text-stone-500 leading-tight">
                                {guest.companions.map(c => `${c.firstName} ${c.lastName}`).join(', ')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-stone-300 italic font-mono">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            guest.transport === 'van' 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'bg-stone-100 text-stone-600'
                          }`}>
                            {guest.transport === 'van' ? (
                              <>
                                <Bus className="w-3 h-3" /> Van
                              </>
                            ) : (
                              <>
                                <Car className="w-3 h-3" /> Carro próprio
                              </>
                            )}
                          </span>
                        </td>
                        <td className="p-4 text-stone-400 text-[11px]">
                          {formatDateLocale(guest.createdAt)}
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleUpdateInviteType(guest.rsvpId, 'day')}
                              className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                guest.invitationType !== 'weekend'
                                  ? 'bg-pink-100 text-pink-800 ring-1 ring-pink-200'
                                  : 'bg-stone-50 text-stone-400 hover:text-stone-600 hover:bg-stone-100'
                              }`}
                            >
                              Apenas o Dia
                            </button>
                            <button
                              onClick={() => handleUpdateInviteType(guest.rsvpId, 'weekend')}
                              className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                guest.invitationType === 'weekend'
                                  ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-200'
                                  : 'bg-stone-50 text-stone-400 hover:text-stone-600 hover:bg-stone-100'
                              }`}
                            >
                              Fim de Semana
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              const deleteDisplayName = guest.isCompanion 
                                ? `${guest.parentGuestName} e seu grupo` 
                                : guestFullName;
                              handleDeleteEntry(guest.rsvpId, deleteDisplayName);
                            }}
                            className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 hover:border-red-100 border border-transparent transition-all cursor-pointer"
                            title="Remover Presença"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View Cards: Shown on Mobile (below md size) */}
            <div className="md:hidden space-y-4">
              {filteredGuests.map((guest) => {
                const guestFullName = `${guest.firstName} ${guest.lastName}`;
                return (
                  <div 
                    key={guest.id} 
                    className="p-4 rounded-xl border border-stone-100 bg-stone-50/40 hover:bg-white transition-all space-y-3"
                  >
                    
                    {/* Top line with name and delete */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          {guest.isCompanion ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[8px] uppercase font-bold rounded">
                              Acompanhante
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-pink-50 text-pink-700 text-[8px] uppercase font-bold rounded">
                              Titular
                            </span>
                          )}
                          <h4 className="font-bold text-stone-800 text-sm leading-tight">{guestFullName}</h4>
                        </div>
                        <span className="text-[10px] text-stone-400 block mt-0.5">Grupo: {guest.rsvpId}</span>
                      </div>
                      
                      <button
                        onClick={() => {
                          const deleteDisplayName = guest.isCompanion 
                            ? `${guest.parentGuestName} e seu grupo` 
                            : guestFullName;
                          handleDeleteEntry(guest.rsvpId, deleteDisplayName);
                        }}
                        className="p-1 text-stone-400 hover:text-red-500 active:scale-95 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Companion info */}
                    {guest.isCompanion ? (
                      <div className="p-2.5 bg-white rounded-lg border border-blue-100/55">
                        <p className="text-[11px] text-stone-600">
                          Acompanhante de <strong className="text-pink-600">{guest.parentGuestName}</strong>
                        </p>
                      </div>
                    ) : guest.companions.length > 0 ? (
                      <div className="p-2.5 bg-white rounded-lg border border-pink-100/50">
                        <div className="text-[10px] font-bold text-pink-600 uppercase tracking-wide leading-none mb-1">
                          {guest.companionsCount} {guest.companionsCount === 1 ? 'Acompanhante' : 'Acompanhantes'}:
                        </div>
                        <p className="text-[11px] text-stone-600 leading-tight">
                          {guest.companions.map(c => `${c.firstName} ${c.lastName}`).join(', ')}
                        </p>
                      </div>
                    ) : (
                      <div className="text-[10px] text-stone-400 font-medium">✨ Sem acompanhantes</div>
                    )}

                    {/* Transport and timestamp */}
                    <div className="flex flex-wrap items-center justify-between text-xs gap-2 pt-1">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        guest.transport === 'van' 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'bg-stone-50 text-stone-600 border border-stone-200'
                      }`}>
                        {guest.transport === 'van' ? <Bus className="w-3 h-3" /> : <Car className="w-3 h-3" />}
                        {guest.transport === 'van' ? 'Van' : 'Carro próprio'}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        🕗 {formatDateLocale(guest.createdAt)}
                      </span>
                    </div>

                    {/* Admin categorization selection */}
                    <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-dashed border-stone-200/80">
                      <div>
                        <button
                          onClick={() => handleUpdateInviteType(guest.rsvpId, 'day')}
                          className={`w-full py-2 px-1 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                            guest.invitationType !== 'weekend'
                              ? 'bg-pink-100 text-pink-800 border border-pink-200 shadow-3xs'
                              : 'bg-white text-stone-400 border border-stone-200'
                          }`}
                        >
                          Apenas o Dia
                        </button>
                      </div>
                      <div>
                        <button
                          onClick={() => handleUpdateInviteType(guest.rsvpId, 'weekend')}
                          className={`w-full py-2 px-1 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                            guest.invitationType === 'weekend'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200 shadow-3xs'
                              : 'bg-white text-stone-400 border border-stone-200'
                          }`}
                        >
                          Fim de Semana
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
