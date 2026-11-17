import { site } from '~/config/site'

export function useSiteUrl() {
  const config = useRuntimeConfig()
  const configured = config.public.siteUrl as string | undefined

  return computed(() => (configured || site.url).replace(/\/+$/, ''))
}
