export function useHeroChrome() {
  const overHero = useState('hero-chrome-offset', () => true)

  return { overHero }
}
