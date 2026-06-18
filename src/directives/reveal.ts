import type { Directive } from 'vue'

const io = typeof IntersectionObserver !== 'undefined'
  ? new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-revealed')
            io!.unobserve(e.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    )
  : null

export const vReveal: Directive<HTMLElement, string | undefined> = {
  mounted(el, binding) {
    el.classList.add('reveal')
    if (binding.value) el.classList.add(`reveal--${binding.value}`)
    if (binding.arg) el.style.transitionDelay = `${binding.arg}ms`
    io?.observe(el)
  },
  unmounted(el) {
    io?.unobserve(el)
  }
}
