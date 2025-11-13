'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, LogIn, Mail, Phone, Shield, Check, AlertCircle, Loader, Info } from 'lucide-react';

type RegisterOwnerInput = {
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  dni?: string;
  nombre_usuario?: string;
};

type RegisterOwnerResponse = {
  ok?: boolean;
  id_usuario?: number;
  id_dueno?: number;
  message?: string;
};

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let msg = 'Error en la petición';
    try {
      const err = await response.json();
      msg = err?.message || msg;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // ignore json parse error
    }
    throw new Error(msg);
  }

  return (await response.json()) as T;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string | boolean;
};

const Input: React.FC<InputProps> = ({ error, className = '', ...props }) => (
  <input
    className={cn(
      'w-full px-3 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 text-sm',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      error ? 'border-red-500' : 'border-gray-300',
      className
    )}
    {...props}
  />
);

const buttonVariants = {
  default: 'bg-[#22C55E] text-white hover:bg-green-600',
  outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
  ghost: 'text-gray-700 hover:bg-gray-100',
} as const;
type ButtonVariant = keyof typeof buttonVariants;

const buttonSizes = {
  default: 'px-4 py-2',
  sm: 'px-3 py-1.5 text-sm',
} as const;
type ButtonSize = keyof typeof buttonSizes;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'default',
  className = '',
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center rounded-lg font-medium transition-colors ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      className={cn(base, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
};


export default function RegisterOwnerPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterOwnerInput>({
    email: '',
    password: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    dni: '',
    nombre_usuario: '',
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      const res = await apiFetch<RegisterOwnerResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setMsg(res.message || 'Cuenta creada. Ahora puedes iniciar sesión.');
      setTimeout(() => router.push('/login'), 800);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErr(e?.message ?? 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  function set<K extends keyof RegisterOwnerInput>(key: K, v: RegisterOwnerInput[K]) {
    setForm(prev => ({ ...prev, [key]: v }));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#22C55E] rounded-lg flex items-center justify-center">
                <Heart size={24} color="white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">PetSalud</h1>
                <p className="text-xs text-gray-500">Sistema Veterinario</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              onClick={() => router.push('/login')}
              className="flex items-center space-x-2"
            >
              <span>¿Ya tienes cuenta?</span>
              <LogIn size={16} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Crear cuenta de dueño</h1>
            <p className="text-sm text-gray-600">Registra tus datos para gestionar tus mascotas.</p>
          </div>

          {err && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4 flex items-center">
            <AlertCircle size={16} className="mr-2" />
            {err}
          </div>}
          {msg && <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg mb-4 flex items-center">
            <Check size={16} className="mr-2" />
            {msg}
          </div>}

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-2">Nombres *</label>
                <Input
                  value={form.nombres}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e: any) => set('nombres', e.target.value)}
                  placeholder="Ingrese sus nombres"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Apellidos *</label>
                <Input
                  value={form.apellidos}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e: any) => set('apellidos', e.target.value)}
                  placeholder="Ingrese sus apellidos"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">DNI (opcional)</label>
                <Input
                  value={form.dni || ''}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e: any) => set('dni', e.target.value)}
                  placeholder="Número de DNI"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Teléfono (opcional)</label>
                <Input
                  value={form.telefono || ''}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e: any) => set('telefono', e.target.value)}
                  placeholder="+51 999 999 999"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">Correo *</label>
                <Input
                  type="email"
                  value={form.email}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e: any) => set('email', e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">Contraseña *</label>
                <Input
                  type="password"
                  value={form.password}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e: any) => set('password', e.target.value)}
                  placeholder="Cree una contraseña segura"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">Usuario (opcional)</label>
                <Input
                  value={form.nombre_usuario || ''}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e: any) => set('nombre_usuario', e.target.value)}
                  placeholder="Nombre de usuario"
                />
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

            <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
              <div className="flex items-start gap-3">
                <Shield size={20} className="w-5 h-5 shrink-0 mt-0.5 text-[#0EA5E9]" />
                <div className="flex-1">
                  <p className="text-sm text-[#0EA5E9] font-medium">
                    Información Segura
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Toda su información personal se almacena de forma segura y encriptada. 
                    Solo será utilizada para brindarle el mejor servicio veterinario.
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader size={16} className="mr-2 animate-spin" />
                  Creando…
                </>
              ) : (
                'Crear cuenta'
              )}
            </Button>
          </form>
        </div>

        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Info size={20} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">¿Necesitas ayuda?</h3>
              <p className="text-sm text-gray-600 mb-3">
                Si tienes problemas durante el registro o necesitas asistencia, nuestro equipo está aquí para ayudarte.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm">
                  <Phone size={14} className="mr-2" />
                  Llamar: (01) 110-1046
                </Button>
                <Button variant="outline" size="sm">
                  <Mail size={14} className="mr-2" />
                  Email: soporte@petsalud.com
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}