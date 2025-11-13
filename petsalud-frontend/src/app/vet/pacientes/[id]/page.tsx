'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import {
  ChevronLeft, PawPrint, FileText, Activity, Thermometer, Weight, User, Phone, Mail
} from 'lucide-react';

type HistorialRow = {
  id_historial: number;
  diagnostico: string;
  tratamiento?: string | null;
  observaciones?: string | null;
  receta_medica?: string | null;
  examenes_solicitados?: string | null;
  proxima_cita?: string | null;
  peso?: number | null;
  temperatura?: number | null;
  fecha_cita: string;
  veterinario: string;
  creado_en: string;

  mascota_nombre?: string | null;
  especie?: string | null;
  raza?: string | null;
  edad?: number | null;
  sexo?: 'MACHO' | 'HEMBRA' | 'INDETERMINADO' | null;
  dueno_nombres?: string | null;
  dueno_apellidos?: string | null;
};

type MascotaResumen = {
  id_mascota: number;
  nombre: string;
  especie: string;
  raza?: string | null;
  edad?: number | null;
  sexo: 'MACHO' | 'HEMBRA' | 'INDETERMINADO';
  alergias?: string | null;
  vacunas?: string | null;
  dueno_nombres?: string | null;
  dueno_apellidos?: string | null;
};

export default function PacienteHistorialPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [mascota, setMascota] = useState<MascotaResumen | null>(null);
  const [historial, setHistorial] = useState<HistorialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token || auth.rol !== 'VETERINARIO') {
      router.replace('/login');
      return;
    }

    (async () => {
      try {
        const data = await apiFetch<HistorialRow[]>(
          `/historial/mascota/${params.id}`,
          { token: auth.token }
        );
        const list = Array.isArray(data) ? data : [];
        setHistorial(list);

        if (list.length) {
          const f = list[0];
          setMascota({
            id_mascota: parseInt(params.id, 10),
            nombre: f.mascota_nombre ?? 'Sin nombre',
            especie: f.especie ?? '—',
            raza: f.raza ?? null,
            edad: f.edad ?? null,
            sexo: (f.sexo as MascotaResumen['sexo']) ?? 'INDETERMINADO',
            alergias: null,
            vacunas: null,
            dueno_nombres: f.dueno_nombres ?? null,
            dueno_apellidos: f.dueno_apellidos ?? null,
          });
        } else {
          setMascota({
            id_mascota: parseInt(params.id, 10),
            nombre: 'Sin nombre',
            especie: '—',
            sexo: 'INDETERMINADO',
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router, params.id]);

  const fDate = (s: string) =>
    new Date(s.replace(' ', 'T')).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
  const fDateTime = (s: string) =>
    new Date(s.replace(' ', 'T')).toLocaleString('es-PE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <button onClick={() => router.push('/vet/pacientes')}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
            <ChevronLeft size={20} /> <span className="font-medium">Volver a pacientes</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {mascota && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-linear-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                <PawPrint size={40} className="text-green-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{mascota.nombre}</h1>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">{mascota.especie}</span>
                  {!!mascota.raza && <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">{mascota.raza}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <p className="text-xs text-gray-600 mb-1">Edad</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {mascota.edad ?? 'No especificada'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <p className="text-xs text-gray-600 mb-1">Sexo</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {mascota.sexo === 'MACHO' ? 'Macho' : mascota.sexo === 'HEMBRA' ? 'Hembra' : 'No especificado'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <p className="text-xs text-gray-600 mb-1">Total Consultas</p>
                    <p className="text-sm font-semibold text-gray-900">{historial.length}</p>
                  </div>
                </div>

                {(mascota.dueno_nombres || mascota.dueno_apellidos) && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-semibold text-blue-900">Dueño</p>
                    </div>
                    <p className="text-sm text-blue-800">
                      {mascota.dueno_nombres} {mascota.dueno_apellidos}
                    </p>
                    <div className="flex gap-4 mt-2">
                      <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center">
                        <Phone className="w-3 h-3 mr-1" /> Llamar
                      </button>
                      <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center">
                        <Mail className="w-3 h-3 mr-1" /> Email
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">Historial Clínico</h2>
          </div>
          <p className="text-sm text-gray-600">{historial.length} consultas registradas</p>
        </div>

        {historial.length ? (
          <div className="space-y-4">
            {historial.map((e) => (
              <div key={e.id_historial} className="bg-white border rounded-xl overflow-hidden hover:shadow">
                <div className="p-6 cursor-pointer" onClick={() => setSelected(selected === e.id_historial ? null : e.id_historial)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Activity className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold">Consulta - {fDate(e.fecha_cita)}</h3>
                          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 border">
                            Dr. {e.veterinario}
                          </span>
                        </div>

                        <div className="bg-gray-50 rounded p-3 border">
                          <p className="text-sm font-medium text-gray-700 mb-1">Diagnóstico:</p>
                          <p className="text-sm">{e.diagnostico}</p>
                        </div>

                        {(e.peso || e.temperatura) && (
                          <div className="flex gap-4 mt-3 text-sm text-gray-600">
                            {e.peso && <span className="flex items-center gap-1"><Weight className="w-4 h-4" />{e.peso} kg</span>}
                            {e.temperatura && <span className="flex items-center gap-1"><Thermometer className="w-4 h-4" />{e.temperatura} °C</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                      {selected === e.id_historial ? 'Ocultar' : 'Ver más'}
                    </button>
                  </div>

                  {selected === e.id_historial && (
                    <div className="mt-4 space-y-4 pt-4 border-t">
                      {e.tratamiento && (
                        <div className="bg-blue-50 rounded p-4 border">
                          <p className="text-sm font-semibold text-blue-900 mb-1">Tratamiento</p>
                          <p className="text-sm text-blue-800 whitespace-pre-line">{e.tratamiento}</p>
                        </div>
                      )}
                      {e.receta_medica && (
                        <div className="bg-purple-50 rounded p-4 border">
                          <p className="text-sm font-semibold text-purple-900 mb-1">Receta Médica</p>
                          <p className="text-sm text-purple-800 whitespace-pre-line font-mono">{e.receta_medica}</p>
                        </div>
                      )}
                      {e.examenes_solicitados && (
                        <div className="bg-amber-50 rounded p-4 border">
                          <p className="text-sm font-semibold text-amber-900 mb-1">Exámenes Solicitados</p>
                          <p className="text-sm text-amber-800 whitespace-pre-line">{e.examenes_solicitados}</p>
                        </div>
                      )}
                      {e.observaciones && (
                        <div className="bg-gray-50 rounded p-4 border">
                          <p className="text-sm font-semibold text-gray-900 mb-1">Observaciones</p>
                          <p className="text-sm whitespace-pre-line">{e.observaciones}</p>
                        </div>
                      )}
                      {e.proxima_cita && (
                        <div className="bg-green-50 rounded p-4 border">
                          <p className="text-sm font-semibold text-green-900 mb-1">Próxima Cita</p>
                          <p className="text-sm text-green-800">{fDate(e.proxima_cita)}</p>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 pt-2 border-t">Registrado el {fDateTime(e.creado_en)}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border rounded-xl p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Sin historial clínico</h3>
            <p className="text-gray-600">Este paciente aún no tiene consultas registradas</p>
          </div>
        )}
      </main>
    </div>
  );
}
