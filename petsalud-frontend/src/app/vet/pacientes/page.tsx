'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getAuth, clearAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { 
  ChevronLeft, 
  Search, 
  Filter,
  PawPrint,
  Eye,
  Calendar,
  Activity,
  FileText
} from 'lucide-react';

type Mascota = {
  id_mascota: number;
  nombre: string;
  especie: string;
  raza?: string | null;
  edad?: number | null;
  sexo: 'MACHO' | 'HEMBRA' | 'INDETERMINADO';
  alergias?: string | null;
  vacunas?: string | null;
  ultima_cita?: string | null;
  total_citas?: number;
};

export default function VetPacientesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pacientes, setPacientes] = useState<Mascota[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('buscar') || '');
  const [filterEspecie, setFilterEspecie] = useState('');

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token || auth.rol !== 'VETERINARIO') {
      router.replace('/login');
      return;
    }

    const fetchPacientes = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const citas = await apiFetch<any[]>('/citas', { token: auth.token });

      const atendidas = Array.isArray(citas)
        ? citas.filter((c) => c.estado === 'ATENDIDA')
        : [];

      const mascotasMap = new Map<number, Mascota>();

      atendidas.forEach((cita) => {
        const idMascota = cita.id_mascota as number;

        if (!mascotasMap.has(idMascota)) {
          mascotasMap.set(idMascota, {
            id_mascota: idMascota,
            nombre: cita.mascota_nombre || 'Sin nombre',
            especie: cita.mascota_especie || '—',
            raza: cita.mascota_raza ?? null,
            edad: cita.mascota_edad ?? null,
            sexo: (cita.mascota_sexo as Mascota['sexo']) || 'INDETERMINADO',
            alergias: cita.mascota_alergias ?? null,
            vacunas: cita.mascota_vacunas ?? null,
            ultima_cita: cita.fecha_hora,
            total_citas: 1,
          });
        } else {
          const m = mascotasMap.get(idMascota)!;
          m.total_citas = (m.total_citas ?? 0) + 1;
          if (new Date(cita.fecha_hora) > new Date(m.ultima_cita ?? 0)) {
            m.ultima_cita = cita.fecha_hora;
          }
        }
      });

      setPacientes(Array.from(mascotasMap.values()));
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

    fetchPacientes();
  }, [router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString.replace(' ', 'T'));
    return date.toLocaleDateString('es-PE', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  const filteredPacientes = pacientes.filter((paciente) => {
    const matchesSearch =
      paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (paciente.raza && paciente.raza.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = !filterEspecie || paciente.especie === filterEspecie;
    
    return matchesSearch && matchesFilter;
  });

  const especies = Array.from(new Set(pacientes.map((p) => p.especie)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pacientes...</p>
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
            <Activity className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Pacientes</h1>
            <p className="text-sm text-gray-600">Historial de mascotas atendidas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{pacientes.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <PawPrint className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Consultas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {pacientes.reduce((sum, p) => sum + (p.total_citas || 0), 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Especies Atendidas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{especies.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o raza..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="relative">
              <Filter size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filterEspecie}
                onChange={(e) => setFilterEspecie(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none text-sm"
              >
                <option value="">Todas las especies</option>
                {especies.map((esp) => (
                  <option key={esp} value={esp}>
                    {esp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(searchTerm || filterEspecie) && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Mostrando {filteredPacientes.length} de {pacientes.length} pacientes
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterEspecie('');
                }}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {filteredPacientes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPacientes.map((paciente) => (
              <div 
                key={paciente.id_mascota} 
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all"
              >
                <div className="bg-linear-to-br from-green-100 to-emerald-100 p-6 flex items-center justify-center">
                  <PawPrint size={48} className="text-green-600" />
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{paciente.nombre}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                        {paciente.especie}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Raza:</span>
                      <span className="font-medium text-gray-900">{paciente.raza || 'No especificada'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Edad:</span>
                      <span className="font-medium text-gray-900">{paciente.edad ? `${paciente.edad} años` : 'No especificada'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Consultas:</span>
                      <span className="font-medium text-gray-900">{paciente.total_citas || 0}</span>
                    </div>
                    {paciente.ultima_cita && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Última cita:</span>
                        <span className="font-medium text-gray-900">{formatDate(paciente.ultima_cita)}</span>
                      </div>
                    )}
                  </div>

                  {(paciente.alergias || paciente.vacunas) && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center">
                        <FileText className="w-3 h-3 mr-1" />
                        Información Importante
                      </p>
                      {paciente.alergias && (
                        <p className="text-xs text-amber-700">• Alergias registradas</p>
                      )}
                      {paciente.vacunas && (
                        <p className="text-xs text-amber-700">• Vacunas al día</p>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/vet/pacientes/${paciente.id_mascota}`)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors inline-flex items-center justify-center"
                    >
                      <Eye size={14} className="mr-1" />
                      Ver Historial
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
            {searchTerm || filterEspecie ? (
              <>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron pacientes</h3>
                <p className="text-gray-600 mb-4">Intenta con otros términos de búsqueda</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterEspecie('');
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Limpiar filtros
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PawPrint className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay pacientes registrados</h3>
                <p className="text-gray-600">Los pacientes que atiendas aparecerán aquí</p>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}