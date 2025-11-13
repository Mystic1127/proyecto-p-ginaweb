'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

type RolStaff = 'RECEPCIONISTA' | 'VETERINARIO' | 'TECNICO' | 'ADMIN';

export default function StaffCreatePage() {
  const router = useRouter();
  const auth = getAuth();

  const [form, setForm] = useState({
    nombre_usuario: '',
    email: '',
    password: '',
    rol: 'RECEPCIONISTA' as RolStaff,
    especialidad: '',
    telefono: '',
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (!auth?.token) {
      router.replace('/login');
      return;
    }
    if (auth.rol !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [auth, router]);

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return 'bg-[#EF4444]';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-[#22C55E]';
      case 5:
        return 'bg-green-600';
      default:
        return 'bg-[#E2E8F0]';
    }
  };

  const getStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return { text: 'Muy débil', color: 'text-[#EF4444]' };
      case 2:
        return { text: 'Débil', color: 'text-orange-500' };
      case 3:
        return { text: 'Regular', color: 'text-yellow-500' };
      case 4:
        return { text: 'Fuerte', color: 'text-[#22C55E]' };
      case 5:
        return { text: 'Muy fuerte', color: 'text-green-600' };
      default:
        return { text: '', color: '' };
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!auth?.token) return;
    setErr(null);
    setOkMsg(null);
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        nombre_usuario: form.nombre_usuario.trim(),
        email: form.email.trim(),
        password: form.password,
        rol: form.rol,
      };

      if (form.rol === 'VETERINARIO' || form.rol === 'TECNICO') {
        body.especialidad = form.especialidad || null;
        body.telefono = form.telefono || null;
      }

      await apiFetch('/auth/staff', {
        method: 'POST',
        body: JSON.stringify(body),
        token: auth.token,
      });

      setOkMsg('Personal creado correctamente.');
      setForm({
        nombre_usuario: '',
        email: '',
        password: '',
        rol: 'RECEPCIONISTA',
        especialidad: '',
        telefono: '',
      });
      setPasswordStrength(0);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo crear el personal';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-[#0F172A] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Volver</span>
              </button>
              <div className="w-px h-8 bg-[#E2E8F0]"></div>
              <div>
                <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">
                  Crear Personal
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Registrar nuevo miembro del equipo
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-6 md:p-8 space-y-6">
          {err && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0 mt-0.5 text-[#EF4444]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-[#EF4444] font-medium">{err}</span>
              </div>
            </div>
          )}

          {okMsg && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0 mt-0.5 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-[#22C55E] font-medium">{okMsg}</span>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-[#0F172A] pb-2 border-b border-[#E2E8F0]">
                Información Personal
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#0F172A]">
                    Nombre Completo *
                  </label>
                  <input
                    required
                    value={form.nombre_usuario}
                    onChange={(e) => setForm((f) => ({ ...f, nombre_usuario: e.target.value }))}
                    disabled={loading}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-[#0F172A] placeholder:text-gray-400 outline-none transition-colors focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Juan Pérez"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#0F172A]">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      disabled={loading}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-white pl-10 pr-4 py-2.5 text-[#0F172A] placeholder:text-gray-400 outline-none transition-colors focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="usuario@petsalud.com"
                    />
                    <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-[#0F172A] pb-2 border-b border-[#E2E8F0]">
                Credenciales de Acceso
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#0F172A]">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, password: e.target.value }));
                        calculatePasswordStrength(e.target.value);
                      }}
                      disabled={loading}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 pr-24 text-[#0F172A] placeholder:text-gray-400 outline-none transition-colors focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Cree una contraseña segura"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#0EA5E9] hover:text-[#0284C7] transition-colors disabled:opacity-50"
                    >
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>

                  {form.password && (
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Seguridad:</span>
                        <span className={`text-xs font-medium ${getStrengthText().color}`}>
                          {getStrengthText().text}
                        </span>
                      </div>
                      <div className="w-full bg-[#E2E8F0] rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#0F172A]">
                    Rol de Usuario *
                  </label>
                  <select
                    value={form.rol}
                    onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value as RolStaff }))}
                    disabled={loading}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-[#0F172A] outline-none transition-colors focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="RECEPCIONISTA">Recepcionista</option>
                    <option value="VETERINARIO">Veterinario</option>
                    <option value="TECNICO">Técnico</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#22C55E] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-medium text-[#0F172A] mb-2 text-sm">
                    Requisitos de Contraseña
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li className={`flex items-center gap-2 ${form.password.length >= 8 ? 'text-[#22C55E]' : 'text-gray-500'}`}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        {form.password.length >= 8 ? (
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                        )}
                      </svg>
                      <span>Mínimo 8 caracteres</span>
                    </li>
                    <li className={`flex items-center gap-2 ${/[a-z]/.test(form.password) ? 'text-[#22C55E]' : 'text-gray-500'}`}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        {/[a-z]/.test(form.password) ? (
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                        )}
                      </svg>
                      <span>Al menos una letra minúscula</span>
                    </li>
                    <li className={`flex items-center gap-2 ${/[A-Z]/.test(form.password) ? 'text-[#22C55E]' : 'text-gray-500'}`}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        {/[A-Z]/.test(form.password) ? (
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                        )}
                      </svg>
                      <span>Al menos una letra mayúscula</span>
                    </li>
                    <li className={`flex items-center gap-2 ${/[0-9]/.test(form.password) ? 'text-[#22C55E]' : 'text-gray-500'}`}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        {/[0-9]/.test(form.password) ? (
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                        )}
                      </svg>
                      <span>Al menos un número</span>
                    </li>
                    <li className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(form.password) ? 'text-[#22C55E]' : 'text-gray-500'}`}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        {/[^A-Za-z0-9]/.test(form.password) ? (
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                        )}
                      </svg>
                      <span>Al menos un carácter especial</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {(form.rol === 'VETERINARIO' || form.rol === 'TECNICO') && (
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-[#0F172A] pb-2 border-b border-[#E2E8F0]">
                  Información Adicional
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Especialidad */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#0F172A]">
                      Especialidad
                      <span className="text-gray-400 ml-1">(opcional)</span>
                    </label>
                    <input
                      value={form.especialidad}
                      onChange={(e) => setForm((f) => ({ ...f, especialidad: e.target.value }))}
                      disabled={loading}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-[#0F172A] placeholder:text-gray-400 outline-none transition-colors focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Animales menores, laboratorio, etc."
                    />
                  </div>

                  {/* Teléfono */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#0F172A]">
                      Teléfono
                      <span className="text-gray-400 ml-1">(opcional)</span>
                    </label>
                    <input
                      type="tel"
                      value={form.telefono}
                      onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                      disabled={loading}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-[#0F172A] placeholder:text-gray-400 outline-none transition-colors focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="+51 9XX XXX XXX"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0 mt-0.5 text-[#0EA5E9]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-[#0EA5E9] font-medium">
                    Seguridad de la Cuenta
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    La contraseña se encripta y almacena de forma segura. El personal puede cambiar su contraseña en cualquier momento desde su perfil.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-[#E2E8F0]">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-none rounded-xl bg-[#22C55E] text-white font-medium px-6 py-3 hover:bg-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Creando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Crear Personal</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push('/admin/staff/list')}
                disabled={loading}
                className="flex-1 sm:flex-none rounded-xl border-2 border-[#E2E8F0] bg-white text-[#0F172A] font-medium px-6 py-3 hover:bg-[#F1F5F9] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span>Ver Listado</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}