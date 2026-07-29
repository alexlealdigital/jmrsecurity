import { supabase } from '../config/supabase.js'

// Retorna o perfil completo do usuário logado (com role e company_id)
export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, company_id')
    .eq('id', user.id)
    .single()

  if (error || !profile) return null

  // Busca empresa só se tiver company_id
  if (profile.company_id) {
    const { data: company } = await supabase
      .from('companies')
      .select('name, plan, active')
      .eq('id', profile.company_id)
      .single()
    profile.companies = company ?? null
  } else {
    profile.companies = null
  }

  return profile
}

// Redireciona conforme o role após login
export function redirectByRole(role) {
  const routes = {
    admin:       '/src/pages/empresas.html',
    gestor:      '/src/pages/dashboard-gestor.html',
    colaborador: '/src/pages/meus-cursos.html'
  }
  window.location.href = routes[role] ?? '/src/pages/meus-cursos.html'
}

// Protege qualquer página — redireciona para login se não autenticado
export async function requireAuth() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    window.location.href = '/src/pages/login.html'
    return null
  }
  return user
}

// Protege página por role específico
export async function requireRole(...roles) {
  const profile = await getProfile()
  if (!profile) {
    window.location.href = '/src/pages/login.html'
    return null
  }
  if (!roles.includes(profile.role)) {
    redirectByRole(profile.role)
    return null
  }
  return profile
}

export async function logout() {
  await supabase.auth.signOut()
  window.location.href = '/src/pages/login.html'
}
