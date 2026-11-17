export default defineNuxtPlugin(() => {
  const cart = useCartStore()
  void cart.init()
})
