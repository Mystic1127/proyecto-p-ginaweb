'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, clearAuth, type AuthData } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import {
  Calendar,
  PawPrint,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle,
  Stethoscope,
  Activity,
  TrendingUp,
  Users,
  LogOut,
  List,
  Eye,
  FlaskConical,
  TestTube,
  Microscope,
  ClipboardList,
  Beaker,
  Droplet,
  ClipboardCheck,
  Receipt,
  BarChart3,
  UserPlus,
  UserCog,
  Building2,
  ClipboardSignature,
  Loader2
} from 'lucide-react';

type Cita = {
  id_cita: number;
  fecha_hora: string;
  estado: 'PROGRAMADA' | 'CONFIRMADA' | 'ATENDIDA' | 'CANCELADA';
  motivo?: string | null;
  mascota_nombre?: string;
  dueno_nombres?: string;
  dueno_apellidos?: string;
  veterinario_usuario?: string;
};

type LabOrder = {
  id_orden: number;
  id_veterinario?: number | null;
  id_veterinario_usuario?: number | null;
  tipo_examen: string;
  estado: 'EMITIDA' | 'MUESTRA_TOMADA' | 'RESULTADO_REGISTRADO' | 'VALIDADA' | 'ANULADA';
  creado_en: string;
  nombre_mascota?: string;
  observaciones?: string | null;
  dueno?: string;
  dueno_ap?: string;
};

type FacturaResumen = {
  id_factura: number;
  estado: 'PENDIENTE' | 'PAGADA' | 'ANULADA';
  monto_total?: number | null;
  fecha_emision: string;
  id_cita?: number | null;
  id_orden?: number | null;
};

type DuenoResumen = {
  id_dueno: number;
  nombres?: string | null;
  apellidos?: string | null;
  telefono?: string | null;
};

function DuenoDashboard({ auth }: { auth: AuthData }) {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pets, setPets] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPets: 0,
    upcomingAppointments: 0,
    pendingVaccines: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const petsData = await apiFetch('/mascotas', { token: auth.token });
        setPets(Array.isArray(petsData) ? petsData : []);

        const aptsData = await apiFetch('/citas', { token: auth.token });
        setAppointments(Array.isArray(aptsData) ? aptsData : []);

        const upcomingApts = (Array.isArray(aptsData) ? aptsData : []).filter(
          (a) => ['PROGRAMADA', 'CONFIRMADA'].includes(a.estado)
        );

        setStats({
          totalPets: (Array.isArray(petsData) ? petsData : []).length,
          upcomingAppointments: upcomingApts.length,
          pendingVaccines: 0,
        });

        setLoading(false);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [auth.token]);

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
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bienvenido</h1>
              <p className="text-sm text-gray-600 mt-1">Gestiona tus mascotas y citas</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/facturas')}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Receipt className="w-4 h-4 mr-2 text-gray-600" />
                Facturas
              </button>
              <button
                onClick={() => router.push('/lab')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <FlaskConical className="w-4 h-4 mr-2" />
                Laboratorio
              </button>
              <button
                onClick={() => { clearAuth(); router.push('/login'); }}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mis Mascotas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPets}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <PawPrint className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Citas Próximas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.upcomingAppointments}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vacunas Pendientes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingVaccines}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Mis Mascotas</h2>
              <button 
                onClick={() => router.push('/mascotas')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver todas
              </button>
            </div>

            {pets.length > 0 ? (
              <div className="space-y-4">
                {pets.slice(0, 3).map((pet) => (
                  <div key={pet.id_mascota} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="shrink-0">
                        <div className="w-16 h-16 bg-linear-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                          <PawPrint className="w-8 h-8 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">{pet.nombre}</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {pet.especie}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-gray-500">Raza</p>
                            <p className="text-sm font-medium text-gray-900">{pet.raza || 'No especificada'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Edad</p>
                            <p className="text-sm font-medium text-gray-900">{pet.edad ? `${pet.edad} años` : 'No especificada'}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <button 
                            onClick={() => router.push(`/mascotas/${pet.id_mascota}`)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Ver detalles
                          </button>
                          <span className="text-gray-300">•</span>
                          <button 
                            onClick={() => router.push(`/mascotas/${pet.id_mascota}/editar`)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <PawPrint className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No tienes mascotas registradas</h3>
                <p className="text-sm text-gray-500 mb-4">Comienza agregando tu primera mascota</p>
                <button 
                  onClick={() => router.push('/mascotas/nueva')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Mascota
                </button>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Próximas Citas</h2>
              <button 
                onClick={() => router.push('/citas')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver todas
              </button>
            </div>

            {appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.slice(0, 3).map((apt) => {
                  const badge = getEstadoBadge(apt.estado);
                  return (
                    <div key={apt.id_cita} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">{apt.mascota_nombre}</h3>
                            <p className="text-sm text-gray-600">{apt.veterinario_usuario}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
                          {badge.text}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          {formatDate(apt.fecha_hora)}
                        </div>
                        {apt.motivo && (
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                            <span className="font-medium">Motivo:</span> {apt.motivo}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <button 
                          onClick={() => router.push(`/citas/${apt.id_cita}`)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          Ver detalles
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No tienes citas programadas</h3>
                <p className="text-sm text-gray-500 mb-4">Agenda una cita para tu mascota</p>
                <button 
                  onClick={() => router.push('/citas/agendar')}
                  className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-green-700"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar Cita
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Acciones Rápidas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button 
                  onClick={() => router.push('/mascotas/nueva')}
                  className="flex items-center justify-center px-4 py-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all"
                >
                  <Plus className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Nueva Mascota</span>
                </button>
                <button 
                  onClick={() => router.push('/citas/agendar')}
                  className="flex items-center justify-center px-4 py-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all"
                >
                  <Calendar className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Agendar Cita</span>
                </button>
                <button 
                  onClick={() => router.push('/citas')}
                  className="flex items-center justify-center px-4 py-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all"
                >
                  <Clock className="w-4 h-4 mr-2 text-amber-600" />
                  <span className="text-sm font-medium text-gray-900">Ver Historial</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VeterinarioDashboard({ auth }: { auth: AuthData }) {
  const router = useRouter();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    programadas: 0,
    confirmadas: 0,
    hoy: 0,
    atendidas_mes: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [citasData, labData] = await Promise.all([
          apiFetch<Cita[]>('/citas', { token: auth.token }),
          apiFetch<LabOrder[]>('/lab/ordenes', { token: auth.token }).catch(() => []),
        ]);

        const citasArray = Array.isArray(citasData) ? citasData : [];
        const labArray = Array.isArray(labData) ? labData : [];
        setCitas(citasArray);
        setLabOrders(labArray);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const programadas = citasArray.filter(c => c.estado === 'PROGRAMADA').length;
        const confirmadas = citasArray.filter(c => c.estado === 'CONFIRMADA').length;
        
        const hoy = citasArray.filter(c => {
          const citaDate = new Date(c.fecha_hora.replace(' ', 'T'));
          return citaDate >= today && citaDate < tomorrow && ['PROGRAMADA', 'CONFIRMADA'].includes(c.estado);
        }).length;

        const atendidas_mes = citasArray.filter(c => {
          const citaDate = new Date(c.fecha_hora.replace(' ', 'T'));
          return c.estado === 'ATENDIDA' && citaDate >= firstDayOfMonth;
        }).length;

        setStats({ programadas, confirmadas, hoy, atendidas_mes });
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [auth.token]);

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
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const citasProximas = citas
    .filter(c => ['PROGRAMADA', 'CONFIRMADA'].includes(c.estado))
    .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())
    .slice(0, 5);

  const pendingValidation = useMemo(() => {
    const mine = labOrders.filter((order) => {
      if (order.estado !== 'RESULTADO_REGISTRADO') return false;
      if (order.id_veterinario_usuario && order.id_veterinario_usuario !== auth.id_usuario) {
        return false;
      }
      return true;
    });

    const sorted = [...mine].sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime());

    return {
      total: mine.length,
      list: sorted.slice(0, 4),
    };
  }, [labOrders, auth.id_usuario]);

  const formatOrderDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-linear-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Stethoscope className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel Veterinario</h1>
                <p className="text-sm text-gray-600 mt-1">Bienvenido al sistema de gestión clínica</p>
              </div>
            </div>
            <button
              onClick={() => { clearAuth(); router.push('/login'); }}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Citas de Hoy</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.hoy}</p>
                <p className="text-xs text-gray-500 mt-1">Pendientes de atención</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confirmadas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.confirmadas}</p>
                <p className="text-xs text-gray-500 mt-1">Listas para atender</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Programadas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.programadas}</p>
                <p className="text-xs text-gray-500 mt-1">Por confirmar</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Atendidas (Mes)</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.atendidas_mes}</p>
                <p className="text-xs text-gray-500 mt-1">Consultas realizadas</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <Activity className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => router.push('/vet/citas')}
              className="flex items-center justify-center px-4 py-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all text-left"
            >
              <List className="w-5 h-5 mr-3 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Todas mis Citas</p>
                <p className="text-xs text-gray-600">Ver agenda completa</p>
              </div>
            </button>
            <button 
              onClick={() => router.push('/vet/pacientes')}
              className="flex items-center justify-center px-4 py-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all text-left"
            >
              <Users className="w-5 h-5 mr-3 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Mis Pacientes</p>
                <p className="text-xs text-gray-600">Historial clínico</p>
              </div>
            </button>
            <button
              onClick={() => router.push('/vet/estadisticas')}
              className="flex items-center justify-center px-4 py-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all text-left"
            >
              <TrendingUp className="w-5 h-5 mr-3 text-purple-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Estadísticas</p>
                <p className="text-xs text-gray-600">Reportes y métricas</p>
              </div>
            </button>
            <button
              onClick={() => router.push('/lab/nueva')}
              className="flex items-center justify-center px-4 py-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all text-left"
            >
              <FlaskConical className="w-5 h-5 mr-3 text-cyan-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Orden de laboratorio</p>
                <p className="text-xs text-gray-600">Solicitar análisis y delegar al técnico</p>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Microscope className="w-5 h-5 text-emerald-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Órdenes esperando validación</h2>
                <p className="text-sm text-gray-600">
                  {pendingValidation.total > 0
                    ? `${pendingValidation.total} análisis con resultado registrado`
                    : 'No tienes informes pendientes de validar'}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/lab')}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Revisar todas →
            </button>
          </div>

          {pendingValidation.total > 0 ? (
            <div className="space-y-3">
              {pendingValidation.list.map((order) => (
                <div
                  key={order.id_orden}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-gray-200 rounded-lg px-4 py-3 hover:border-emerald-300 hover:shadow-md transition-all"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      #{order.id_orden} · {order.tipo_examen}
                    </p>
                    <p className="text-sm text-gray-600">
                      Paciente: {order.nombre_mascota ?? 'Sin nombre registrado'}
                    </p>
                    <p className="text-xs text-gray-500">Registrado {formatOrderDate(order.creado_en)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-600 border border-purple-200">
                      Resultado cargado
                    </span>
                    <button
                      onClick={() => router.push(`/lab/${order.id_orden}`)}
                      className="inline-flex items-center px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
                    >
                      Validar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-emerald-200 rounded-lg px-6 py-8 text-center text-sm text-emerald-700">
              ¡Todo listo! Los informes validados aparecerán aquí cuando el laboratorio cargue resultados.
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Próximas Citas</h2>
            </div>
            <button 
              onClick={() => router.push('/vet/citas')}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Ver todas →
            </button>
          </div>

          {citasProximas.length > 0 ? (
            <div className="space-y-3">
              {citasProximas.map((cita) => {
                const badge = getEstadoBadge(cita.estado);
                return (
                  <div 
                    key={cita.id_cita}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
                    onClick={() => router.push(`/vet/citas/${cita.id_cita}`)}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                        <PawPrint className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-semibold text-gray-900">{cita.mascota_nombre}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
                            {badge.text}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Dueño: {cita.dueno_nombres} {cita.dueno_apellidos}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-xs text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(cita.fecha_hora)}
                          </p>
                          {cita.motivo && (
                            <p className="text-xs text-gray-500 truncate">
                              {cita.motivo}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <button 
                      className="ml-4 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors inline-flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">No hay citas programadas</h3>
              <p className="text-sm text-gray-500">Las próximas citas aparecerán aquí</p>
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Recordatorio Profesional</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Revisa el historial clínico antes de cada consulta</li>
                <li>• Registra todos los diagnósticos y tratamientos</li>
                <li>• Actualiza las vacunas y próximas citas necesarias</li>
                <li>• Mantén informado al dueño sobre el estado de su mascota</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TecnicoDashboard({ auth }: { auth: AuthData }) {
  const router = useRouter();
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, citasData] = await Promise.all([
          apiFetch<LabOrder[]>('/lab/ordenes', { token: auth.token }),
          apiFetch<Cita[]>('/citas', { token: auth.token }).catch(() => []),
        ]);

        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setCitas(Array.isArray(citasData) ? citasData : []);
      } catch (err) {
        console.error('Error al cargar datos de laboratorio:', err);
        setError(err instanceof Error ? err.message : 'No se pudo obtener la información');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [auth.token]);

  const pendingSample = orders.filter((o) => o.estado === 'EMITIDA');
  const pendingResults = orders.filter((o) => o.estado === 'MUESTRA_TOMADA');
  const awaitingValidation = orders.filter((o) => o.estado === 'RESULTADO_REGISTRADO');
  const validated = orders.filter((o) => o.estado === 'VALIDADA');

  const confirmedToday = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return citas
      .filter((cita) => {
        const date = new Date(cita.fecha_hora.replace(' ', 'T'));
        return cita.estado === 'CONFIRMADA' && date >= start && date < end;
      })
      .slice(0, 4);
  }, [citas]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparando tu tablero de laboratorio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-linear-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <FlaskConical className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel Técnico de Laboratorio</h1>
                <p className="text-sm text-gray-600 mt-1">Administra órdenes, muestras y resultados asignados</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/lab')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Beaker className="w-4 h-4 mr-2" />
                Ver órdenes
              </button>
              <button
                onClick={() => { clearAuth(); router.push('/login'); }}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Órdenes asignadas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{orders.length}</p>
                <p className="text-xs text-gray-500 mt-1">Validadas: {validated.length}</p>
              </div>
              <ClipboardList className="w-6 h-6 text-cyan-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes de muestra</p>
                <p className="text-3xl font-bold text-amber-600 mt-2">{pendingSample.length}</p>
                <p className="text-xs text-gray-500 mt-1">Confirma citas y prepara materiales</p>
              </div>
              <Droplet className="w-6 h-6 text-amber-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resultados por cargar</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{pendingResults.length}</p>
                <p className="text-xs text-gray-500 mt-1">Tras la toma, ingresa los análisis</p>
              </div>
              <TestTube className="w-6 h-6 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Esperando validación</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{awaitingValidation.length}</p>
                <p className="text-xs text-gray-500 mt-1">Comparte avances con el veterinario</p>
              </div>
              <ClipboardCheck className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-semibold">No fue posible sincronizar algunas secciones</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Droplet className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-gray-900">Órdenes para toma de muestra</h2>
              </div>
              <button
                onClick={() => router.push('/lab')}
                className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
              >
                Ver todas →
              </button>
            </div>
            {pendingSample.length === 0 ? (
              <p className="text-sm text-gray-500">No tienes órdenes pendientes de toma. Revisa más tarde.</p>
            ) : (
              <ul className="space-y-3">
                {pendingSample.slice(0, 5).map((order) => (
                  <li
                    key={order.id_orden}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition cursor-pointer"
                    onClick={() => router.push(`/lab/${order.id_orden}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">#{order.id_orden} · {order.nombre_mascota ?? 'Mascota sin nombre'}</p>
                        <p className="text-sm text-gray-600">{order.tipo_examen}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        Emitida el {new Date(order.creado_en).toLocaleDateString('es-PE', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {order.observaciones && (
                      <p className="mt-2 text-xs text-gray-500 line-clamp-2">Observaciones: {order.observaciones}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Microscope className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Resultados en preparación</h2>
              </div>
            </div>
            {pendingResults.length === 0 ? (
              <p className="text-sm text-gray-500">Cuando registres la toma, podrás cargar los resultados aquí.</p>
            ) : (
              <ul className="space-y-3">
                {pendingResults.slice(0, 5).map((order) => (
                  <li
                    key={order.id_orden}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition cursor-pointer"
                    onClick={() => router.push(`/lab/${order.id_orden}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">#{order.id_orden} · {order.nombre_mascota ?? 'Mascota sin nombre'}</p>
                        <p className="text-sm text-gray-600">{order.tipo_examen}</p>
                      </div>
                      <span className="text-xs text-gray-500">Actualizada el {new Date(order.creado_en).toLocaleDateString('es-PE', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Toma registrada. Ingresa los valores del análisis cuando estén listos.
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-cyan-600" />
            <h2 className="text-lg font-semibold text-gray-900">Citas confirmadas para hoy</h2>
          </div>
          {confirmedToday.length === 0 ? (
            <p className="text-sm text-gray-500">No hay citas confirmadas para hoy que requieran apoyo de laboratorio.</p>
          ) : (
            <ul className="space-y-3">
              {confirmedToday.map((cita) => (
                <li key={cita.id_cita} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{cita.mascota_nombre}</p>
                      <p className="text-sm text-gray-600">Dueño: {cita.dueno_nombres} {cita.dueno_apellidos}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(cita.fecha_hora.replace(' ', 'T')).toLocaleTimeString('es-PE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Coordina con el veterinario si se requiere una orden de laboratorio posterior a la consulta.
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-cyan-50 border border-cyan-200 rounded-xl p-5 flex items-start gap-3 text-cyan-800">
          <FlaskConical className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-semibold">Flujo recomendado</p>
            <ul className="text-sm list-disc ml-4 space-y-1">
              <li>Al confirmarse la cita, prepara el material necesario y verifica si habrá toma de muestra.</li>
              <li>Tras registrar la muestra en el sistema, carga los resultados lo antes posible.</li>
              <li>Notifica al veterinario cuando los valores estén listos para acelerar la validación.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

function RecepcionistaDashboard({ auth }: { auth: AuthData }) {
  const router = useRouter();
  const [facturas, setFacturas] = useState<FacturaResumen[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [duenos, setDuenos] = useState<DuenoResumen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [factData, citasData, duenosData] = await Promise.all([
          apiFetch<FacturaResumen[]>('/facturas', { token: auth.token }),
          apiFetch<Cita[]>('/citas', { token: auth.token }),
          apiFetch<DuenoResumen[]>('/duenos', { token: auth.token }).catch(() => []),
        ]);
        setFacturas(Array.isArray(factData) ? factData : []);
        setCitas(Array.isArray(citasData) ? citasData : []);
        setDuenos(Array.isArray(duenosData) ? duenosData : []);
      } catch (error) {
        console.error('Error al cargar dashboard de recepción', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [auth.token]);

  const pendientes = useMemo(
    () => facturas.filter((f) => f.estado === 'PENDIENTE').slice(0, 5),
    [facturas]
  );

  const proximasCitas = useMemo(() => {
    return citas
      .filter((c) => ['PROGRAMADA', 'CONFIRMADA'].includes(c.estado))
      .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())
      .slice(0, 5);
  }, [citas]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de recepción</h1>
              <p className="text-sm text-gray-600">
                Gestiona el flujo diario de citas, cobros y registro de nuevos propietarios.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push('/admin/duenos/nuevo')}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              <UserPlus className="h-4 w-4" />
              Nuevo dueño
            </button>
            <button
              onClick={() => router.push('/facturas')}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Receipt className="h-4 w-4" />
              Ver facturas
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">Citas hoy</p>
            <p className="mt-2 text-2xl font-bold text-blue-900">
              {citas.filter((c) => {
                const fecha = new Date(c.fecha_hora.replace(' ', 'T'));
                const hoy = new Date();
                return (
                  fecha.getFullYear() === hoy.getFullYear() &&
                  fecha.getMonth() === hoy.getMonth() &&
                  fecha.getDate() === hoy.getDate()
                );
              }).length}
            </p>
            <p className="text-xs text-blue-700">Programadas y confirmadas</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Facturas pendientes</p>
            <p className="mt-2 text-2xl font-bold text-amber-900">{facturas.filter((f) => f.estado === 'PENDIENTE').length}</p>
            <p className="text-xs text-amber-700">Cobros por cerrar</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Dueños activos</p>
            <p className="mt-2 text-2xl font-bold text-emerald-900">{duenos.length}</p>
            <p className="text-xs text-emerald-700">Clientes registrados</p>
          </div>
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-800">Atenciones confirmadas</p>
            <p className="mt-2 text-2xl font-bold text-purple-900">{citas.filter((c) => c.estado === 'CONFIRMADA').length}</p>
            <p className="text-xs text-purple-700">Listas para recibir</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Facturas pendientes</h2>
              <button
                onClick={() => router.push('/facturas')}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Ver todas
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {pendientes.length === 0 ? (
                <p className="text-sm text-gray-500">No hay cobros pendientes por registrar.</p>
              ) : (
                pendientes.map((f) => (
                  <div key={f.id_factura} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Factura #{f.id_factura}</p>
                      <p className="text-xs text-amber-700">Emitida {new Date(f.fecha_emision).toLocaleDateString('es-PE')}</p>
                    </div>
                    <p className="text-sm font-semibold text-amber-900">S/ {Number(f.monto_total ?? 0).toLocaleString('es-PE')}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Próximas citas</h2>
              <button
                onClick={() => router.push('/citas')}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Ver agenda
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {proximasCitas.length === 0 ? (
                <p className="text-sm text-gray-500">No hay citas próximas en el calendario.</p>
              ) : (
                proximasCitas.map((cita) => (
                  <div key={cita.id_cita} className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Cita #{cita.id_cita}</p>
                      <p className="text-xs text-blue-700">{new Date(cita.fecha_hora.replace(' ', 'T')).toLocaleString('es-PE')}</p>
                    </div>
                    <span className="text-xs font-semibold text-blue-900">{cita.estado}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Últimos dueños registrados</h2>
          <div className="space-y-3">
            {duenos.slice(0, 5).map((dueno) => (
              <div key={dueno.id_dueno} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{dueno.nombres} {dueno.apellidos}</p>
                  <p className="text-xs text-gray-500">Teléfono: {dueno.telefono || '—'}</p>
                </div>
                <button
                  onClick={() => router.push(`/admin/duenos/${dueno.id_dueno}`)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Ver ficha
                </button>
              </div>
            ))}
            {duenos.length === 0 && <p className="text-sm text-gray-500">Aún no se registran propietarios.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}

function AdminDashboard({ auth }: { auth: AuthData }) {
  const router = useRouter();
  const [facturas, setFacturas] = useState<FacturaResumen[]>([]);
  const [duenos, setDuenos] = useState<DuenoResumen[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [factData, duenosData, citasData] = await Promise.all([
          apiFetch<FacturaResumen[]>('/facturas', { token: auth.token }),
          apiFetch<DuenoResumen[]>('/duenos', { token: auth.token }).catch(() => []),
          apiFetch<Cita[]>('/citas', { token: auth.token }),
        ]);
        setFacturas(Array.isArray(factData) ? factData : []);
        setDuenos(Array.isArray(duenosData) ? duenosData : []);
        setCitas(Array.isArray(citasData) ? citasData : []);
      } catch (error) {
        console.error('Error al cargar dashboard de administración', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [auth.token]);

  const montoPagado = facturas
    .filter((f) => f.estado === 'PAGADA')
    .reduce((sum, f) => sum + Number(f.monto_total ?? 0), 0);

  const pendientes = facturas.filter((f) => f.estado === 'PENDIENTE');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-900 p-3 text-white">
              <UserCog className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel administrativo</h1>
              <p className="text-sm text-gray-600">
                Supervisa ingresos, cartera de clientes y asigna tareas clave al equipo.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push('/admin/reportes')}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              <BarChart3 className="h-4 w-4" />
              Ver reportes
            </button>
            <button
              onClick={() => router.push('/facturas')}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Receipt className="h-4 w-4" />
              Facturación
            </button>
            <button
              onClick={() => router.push('/admin/duenos')}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Users className="h-4 w-4" />
              Dueños
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Ingresos cobrados</p>
            <p className="mt-2 text-2xl font-bold text-emerald-900">S/ {montoPagado.toLocaleString('es-PE')}</p>
            <p className="text-xs text-emerald-700">Facturas pagadas</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Facturas pendientes</p>
            <p className="mt-2 text-2xl font-bold text-amber-900">{pendientes.length}</p>
            <p className="text-xs text-amber-700">Requieren seguimiento</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">Dueños registrados</p>
            <p className="mt-2 text-2xl font-bold text-blue-900">{duenos.length}</p>
            <p className="text-xs text-blue-700">Clientes activos</p>
          </div>
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-800">Citas confirmadas</p>
            <p className="mt-2 text-2xl font-bold text-purple-900">{citas.filter((c) => c.estado === 'CONFIRMADA').length}</p>
            <p className="text-xs text-purple-700">Agenda asegurada</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Cobros pendientes</h2>
              <button
                onClick={() => router.push('/facturas')}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Revisar
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {pendientes.slice(0, 5).map((f) => (
                <div key={f.id_factura} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Factura #{f.id_factura}</p>
                    <p className="text-xs text-amber-700">Emitida {new Date(f.fecha_emision).toLocaleDateString('es-PE')}</p>
                  </div>
                  <p className="text-sm font-semibold text-amber-900">S/ {Number(f.monto_total ?? 0).toLocaleString('es-PE')}</p>
                </div>
              ))}
              {pendientes.length === 0 && <p className="text-sm text-gray-500">No hay facturas pendientes.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Indicadores rápidos</h2>
              <button
                onClick={() => router.push('/admin/reportes')}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Ver más
              </button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Citas totales</p>
                <p className="text-2xl font-semibold text-gray-900">{citas.length}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Citas atendidas</p>
                <p className="text-2xl font-semibold text-gray-900">{citas.filter((c) => c.estado === 'ATENDIDA').length}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Facturas generadas</p>
                <p className="text-2xl font-semibold text-gray-900">{facturas.length}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Ordenes facturadas</p>
                <p className="text-2xl font-semibold text-gray-900">{facturas.filter((f) => f.id_orden).length}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Acciones recomendadas</h2>
            <ClipboardSignature className="h-5 w-5 text-gray-500" />
          </div>
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            <li>• Revisar facturas pendientes para cerrar caja diaria.</li>
            <li>• Coordinar con recepción el seguimiento de citas canceladas.</li>
            <li>• Validar que los dueños recién registrados tengan mascotas asociadas.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const a = getAuth();
    setAuth(a);

    if (!a?.token) {
      router.replace('/login');
      setReady(true);
      return;
    }

    (async () => {
      try {
        switch (a.rol) {
          case 'DUENO':
            await apiFetch('/mascotas', { token: a.token });
            break;
          case 'VETERINARIO':
          case 'TECNICO':
            await apiFetch('/staff/me', { token: a.token });
            break;
          case 'ADMIN':
          case 'RECEPCIONISTA':
            await apiFetch('/facturas', { token: a.token });
            break;
          default:
            throw new Error('Rol desconocido');
        }
      } catch {
        clearAuth();
        router.replace('/login');
      } finally {
        setReady(true);
      }
    })();
  }, [router]);

  if (!ready) return null;
  if (!auth?.token) return null;

  if (auth.rol === 'DUENO') {
    return <DuenoDashboard auth={auth} />;
  }

  if (auth.rol === 'VETERINARIO') {
    return <VeterinarioDashboard auth={auth} />;
  }

  if (auth.rol === 'TECNICO') {
    return <TecnicoDashboard auth={auth} />;
  }

  if (auth.rol === 'RECEPCIONISTA') {
    return <RecepcionistaDashboard auth={auth} />;
  }

  if (auth.rol === 'ADMIN') {
    return <AdminDashboard auth={auth} />;
  }

  return null;
}