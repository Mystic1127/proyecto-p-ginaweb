'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getAuth, clearAuth } from '@/lib/auth';
import { Calendar, Clock, ChevronLeft, Plus, Stethoscope } from 'lucide-react';

type Cita = {
  id_cita: number;
  fecha_hora: string;
  estado: 'PROGRAMADA'|'CONFIRMADA'|'ATENDIDA'|'CANCELADA';
  motivo?: string | null;
  mascota_nombre?: string;
  veterinario_usuario?: string;
};

export default function CitasListPage() {
  const router = useRouter();
  const [items, setItems] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token) { router.replace('/login'); return; }

    (async () => {
      try {
        const data = await apiFetch<Cita[]>('/citas', { token: auth.token });
        setItems(data ?? []);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        clearAuth();
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const getBadgeStyles = (estado: Cita['estado']) => {
    const map: Record<Cita['estado'], { bg: string; text: string; border: string }> = {
      PROGRAMADA: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      CONFIRMADA: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      ATENDIDA: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
      CANCELADA: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    };
    return map[estado];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Cargando citas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
            >
              <ChevronLeft size={20} />
              <span className="font-medium">Volver al Menú</span>
            </button>
            <button
              onClick={() => router.push('/citas/agendar')}
              className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 shadow-sm"
            >
              <Plus size={18} className="mr-2" />
              Agendar cita
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-blue-600" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Citas</h1>
              <p className="text-sm text-gray-600">Gestiona tus citas veterinarias</p>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tienes citas registradas</h3>
            <p className="text-gray-600 mb-6">Comienza agendando tu primera cita veterinaria</p>
            <button
              onClick={() => router.push('/citas/agendar')}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm"
            >
              <Plus size={18} className="mr-2" />
              Agendar primera cita
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((c) => {
              const badgeStyle = getBadgeStyles(c.estado);
              return (
                <div
                  key={c.id_cita}
                  onClick={() => router.push(`/citas/${c.id_cita}`)}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <Calendar className="text-blue-600" size={20} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">
                            {c.mascota_nombre ?? 'Mascota'}
                          </h3>
                          {c.veterinario_usuario && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Stethoscope size={14} />
                              <span>{c.veterinario_usuario}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Clock size={14} />
                          <span>
                            {new Date(c.fecha_hora.replace(' ', 'T')).toLocaleString('es-PE', {
                              dateStyle: 'full',
                              timeStyle: 'short'
                            })}
                          </span>
                        </div>

                        {c.motivo && (
                          <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                            <span className="font-medium">Motivo:</span> {c.motivo}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={`px-3 py-1.5 text-xs font-medium rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border} whitespace-nowrap`}>
                      {c.estado.charAt(0) + c.estado.slice(1).toLowerCase()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Calendar className="text-blue-600 shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">¿Necesitas modificar una cita?</p>
                <p className="text-blue-700">
                  Haz clic en cualquier cita para ver los detalles y opciones disponibles.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}