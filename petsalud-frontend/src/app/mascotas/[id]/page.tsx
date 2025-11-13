'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, PawPrint, Edit, Trash2, Calendar, AlertCircle, Info } from 'lucide-react';
import { getAuth, clearAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

type Pet = {
  id_mascota: number;
  nombre: string;
  especie: string;
  raza?: string | null;
  edad?: number | null;
  sexo: 'MACHO' | 'HEMBRA' | 'INDETERMINADO';
  alergias?: string | null;
  vacunas?: string | null;
};

export default function PetDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const auth = getAuth();
      if (!auth?.token) {
        router.replace('/login');
        return;
      }
      try {
        const data = await apiFetch<Pet>(`/mascotas/${params.id}`, { token: auth.token });
        setPet(data);
      } catch (e) {
        console.error(e);
        clearAuth();
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id, router]);

  async function handleDelete() {
    if (!confirm('¿Estás seguro de eliminar esta mascota? Esta acción no se puede deshacer.')) return;
    const auth = getAuth();
    if (!auth?.token) return;
    try {
      await apiFetch(`/mascotas/${params.id}`, { method: 'DELETE', token: auth.token });
      router.push('/mascotas');
    } catch (e) {
      console.error(e);
      alert('No se pudo eliminar la mascota');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Mascota no encontrada</h2>
          <p className="text-gray-600 mb-6">La mascota que buscas no existe o no tienes permisos para verla.</p>
          <button
            onClick={() => router.push('/mascotas')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver a mis mascotas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/mascotas')}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft size={20} />
              <span>Volver a mis mascotas</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/mascotas/${pet.id_mascota}/editar`)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Edit size={16} className="mr-2" />
                Editar
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} className="mr-2" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
          <div className="bg-linear-to-br from-blue-100 to-blue-200 p-12 flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
              <PawPrint size={48} className="text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{pet.nombre}</h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white mt-2">
              {pet.especie}
            </span>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información General</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoCard label="Raza" value={pet.raza || 'No especificada'} />
                <InfoCard label="Edad" value={pet.edad ? `${pet.edad} años` : 'No especificada'} />
                <InfoCard 
                  label="Sexo" 
                  value={pet.sexo === 'MACHO' ? 'Macho' : pet.sexo === 'HEMBRA' ? 'Hembra' : 'No especificado'} 
                />
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial Médico</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MedicalCard 
                  label="Alergias" 
                  value={pet.alergias} 
                  placeholder="No se han registrado alergias"
                  icon="⚠️"
                />
                <MedicalCard 
                  label="Vacunas" 
                  value={pet.vacunas} 
                  placeholder="No se han registrado vacunas"
                  icon="💉"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => router.push(`/citas/agendar?mascota=${pet.id_mascota}`)}
                className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Calendar size={20} className="mr-2" />
                Agendar cita para {pet.nombre}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Info size={20} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Mantén actualizada la información</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Registra todas las vacunas y alergias para un mejor tratamiento veterinario</li>
                <li>• Actualiza la edad de tu mascota anualmente</li>
                <li>• Puedes editar esta información en cualquier momento</li>
                <li>• El historial médico es importante para las consultas veterinarias</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-base font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function MedicalCard({ label, value, placeholder, icon }: { label: string; value?: string | null; placeholder: string; icon: string }) {
  const hasValue = value?.trim();
  
  return (
    <div className={`border rounded-lg p-4 ${hasValue ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-lg">{icon}</span>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
      </div>
      <p className={`text-sm whitespace-pre-wrap ${hasValue ? 'text-gray-900' : 'text-gray-500 italic'}`}>
        {hasValue ? value : placeholder}
      </p>
    </div>
  );
}