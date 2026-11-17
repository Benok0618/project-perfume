import type { LoginInput, RegisterInput } from '~~/shared/schemas/auth'
import type { SessionUser } from '~~/shared/types'

interface AuthResponse {
  user: SessionUser
}

export function useAuth() {
  const session = useUserSession()
  const cart = useCartStore()

  async function login(body: LoginInput) {
    const result = await $fetch<AuthResponse>('/api/auth/login', { method: 'POST', body })
    await session.fetch()
    await cart.mergeGuestCart()
    return result.user
  }

  async function register(body: RegisterInput) {
    const result = await $fetch<AuthResponse>('/api/auth/register', { method: 'POST', body })
    await session.fetch()
    await cart.mergeGuestCart()
    return result.user
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await session.clear()
    cart.reset()
  }

  return { login, register, logout }
}
