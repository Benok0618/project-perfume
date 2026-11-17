\---

name: gsap-scrolltrigger-nuxt

description: Use when adding or changing any animation, smooth scroll, scroll-scrubbed hero, parallax, text reveal, or page transition.

\---



\## Setup

\- Register gsap and ScrollTrigger in app/plugins/gsap.client.ts and provide them. Never import ScrollTrigger on the server.

\- Install Lenis from the "lenis" package in app/plugins/lenis.client.ts and drive it from gsap.ticker so there is one RAF loop:



&#x20; const lenis = new Lenis({ autoRaf: false })

&#x20; lenis.on('scroll', ScrollTrigger.update)

&#x20; gsap.ticker.add((time) => lenis.raf(time \* 1000))

&#x20; gsap.ticker.lagSmoothing(0)



\## Component rules

\- Create animations inside onMounted with gsap.context(() => {...}, scopeRef) and call ctx.revert() in onBeforeUnmount. This kills tweens and ScrollTriggers.

\- Scope selectors to a template ref. Never query the whole document.

\- After images or fonts load, call ScrollTrigger.refresh().



\## Scroll-scrubbed hero

\- Pin the section with ScrollTrigger and scrub true or a small number.

\- For video: set preload="auto", muted, playsinline, and tie video.currentTime to progress once metadata has loaded. If scrubbing stutters, switch to a canvas image sequence.

\- Preload the poster. Reserve the section height so there is no layout shift.



\## Motion preferences and fallbacks

\- Use gsap.matchMedia: under (prefers-reduced-motion: reduce) skip scrubbing, pinning, and parallax and show static content.

\- On small or low-power devices use the static image fallback.



\## Theming

\- Read duration and easing from theme tokens so Men, Women, and Unisex themes feel different.



\## Performance

\- Animate transform and opacity only. Avoid animating layout properties.

\- Use will-change sparingly.

