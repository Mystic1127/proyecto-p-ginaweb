'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, clearAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { 
  ChevronLeft, 
  Calendar, 
  Search, 
  Filter,
  Clock,
  PawPrint,
  Eye
} from 'lucide-react';

type Cita = {
  id_cita: number;
  fecha_hora: string;
  estado: 'PROGRAMADA' | 'CONFIRMADA' | 'ATENDIDA' | 'CANCELADA';
  motivo?: string | null;
  mascota_nombre?: string;
  dueno_nombres?: string;
  dueno_apellidos?: string;
};

export default function VetCitasPage() {
  const router = useRouter();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterFecha, setFilterFecha] = useState('');

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token || auth.rol !== 'VETERINARIO') {
      router.replace('/login');
      return;
    }

    const fetchCitas = async () => {
      try {
        const data = await apiFetch<Cita[]>('/citas', { token: auth.token });
        setCitas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error al cargar citas:', error);
        clearAuth();
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchCitas();
  }, [router]);

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      PROGRAMADA: { color: 'bg-blue-100 text-blue-700 border-blue-200', text: 'Programada' },
      CONFIRMADA: { color: 'bg-green-100 text-green-700 border-green-200', text: 'Confirmada' },
      ATENDIDA: { color: 'bg-gray-100 text-gray-700 border-gray-200', text: 'Atendida' },
      CANCELADA: { color: 'bg-red-100 text-red-700 border-red-200', text: 'Cancelada' }
    };
    return badges[estado] || badges.PROGRAMADA;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString.replace(' ', 'T'));
    return date.toLocaleDateString('es-PE', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredCitas = citas.filter((cita) => {
    const matchesSearch = 
      (cita.mascota_nombre?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cita.dueno_nombres?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cita.dueno_apellidos?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesEstado = !filterEstado || cita.estado === filterEstado;

    let matchesFecha = true;
    if (filterFecha) {
      const citaDate = new Date(cita.fecha_hora.replace(' ', 'T'));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (filterFecha) {
        case 'hoy':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          matchesFecha = citaDate >= today && citaDate < tomorrow;
          break;
        case 'proximos':
          matchesFecha = citaDate >= today && ['PROGRAMADA', 'CONFIRMADA'].includes(cita.estado);
          break;
        case 'pasadas':
          matchesFecha = citaDate < today || cita.estado === 'ATENDIDA';
          break;
      }
    }

    return matchesSearch && matchesEstado && matchesFecha;
  });

  const sortedCitas = [...filteredCitas].sort((a, b) => {
    const dateA = new Date(a.fecha_hora.replace(' ', 'T'));
    const dateB = new Date(b.fecha_hora.replace(' ', 'T'));
    return dateB.getTime() - dateA.getTime();
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando citas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="font-medium">Volver al Menú</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Citas</h1>
            <p className="text-sm text-gray-600">Gestiona tu agenda de consultas veterinarias</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por mascota o dueño..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="relative">
              <Filter size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none text-sm"
              >
                <option value="">Todos los estados</option>
                <option value="PROGRAMADA">Programadas</option>
                <option value="CONFIRMADA">Confirmadas</option>
                <option value="ATENDIDA">Atendidas</option>
                <option value="CANCELADA">Canceladas</option>
              </select>
            </div>

            <div className="relative">
              <Clock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filterFecha}
                onChange={(e) => setFilterFecha(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none text-sm"
              >
                <option value="">Todas las fechas</option>
                <option value="hoy">Hoy</option>
                <option value="proximos">Próximas</option>
                <option value="pasadas">Pasadas</option>
              </select>
            </div>
          </div>

          {(searchTerm || filterEstado || filterFecha) && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Mostrando {sortedCitas.length} de {citas.length} citas
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterEstado('');
                  setFilterFecha('');
                }}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {sortedCitas.length > 0 ? (
          <div className="space-y-4">
            {sortedCitas.map((cita) => {
              const badge = getEstadoBadge(cita.estado);
              const isPending = ['PROGRAMADA', 'CONFIRMADA'].includes(cita.estado);
              
              return (
                <div 
                  key={cita.id_cita}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer"
                  onClick={() => router.push(`/vet/citas/${cita.id_cita}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                        <PawPrint className="w-7 h-7 text-green-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {cita.mascota_nombre}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
                            {badge.text}
                          </span>
                          {isPending && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 mr-1" />
                              Pendiente
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 mb-3">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Dueño:</span> {cita.dueno_nombres} {cita.dueno_apellidos}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Clock className="w-4 h-4 mr-1.5" />
                            {formatDate(cita.fecha_hora)}
                          </p>
                        </div>

                        {cita.motivo && (
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Motivo:</span> {cita.motivo}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors inline-flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {searchTerm || filterEstado || filterFecha ? (
                <Filter className="w-8 h-8 text-gray-400" />
              ) : (
                <Calendar className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || filterEstado || filterFecha 
                ? 'No se encontraron citas' 
                : 'No tienes citas asignadas'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterEstado || filterFecha
                ? 'Intenta con otros criterios de búsqueda'
                : 'Las citas que te sean asignadas aparecerán aquí'}
            </p>
            {(searchTerm || filterEstado || filterFecha) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterEstado('');
                  setFilterFecha('');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}