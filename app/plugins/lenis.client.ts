import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

declare module '#app' {
  interface NuxtApp {
    $gsap: typeof gsap
    $ScrollTrigger: typeof ScrollTrigger
    $lenis: Lenis | null
  }
}

export default defineNuxtPlugin(() => {
  let lenis: Lenis | null = null

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const instance = new Lenis({
      autoRaf: false,
      duration: 1.05,
      smoothWheel: true
    })

    lenis = instance
    instance.on('scroll', ScrollTrigger.update)

    const tick = (time: number) => {
      instance.raf(time * 1000)
    }

    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    const destroy = () => {
      gsap.ticker.remove(tick)
      instance.destroy()
    }

    window.addEventListener('pagehide', destroy, { once: true })
  }

  return {
    provide: { lenis }
  }
})
