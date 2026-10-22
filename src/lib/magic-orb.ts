// ── Magic orb animation ────────────────────────────────────────────────
// A dot that flies from the clicked button to the cart icon in the bottom nav.
export function magicOrb(fromEl: HTMLElement | null, toEl: HTMLElement | null) {
  if (!fromEl || !toEl) return
  const fr = fromEl.getBoundingClientRect()
  const tr = toEl.getBoundingClientRect()
  const orb = document.createElement('div')
  orb.className = 'magic-orb'
  orb.style.top  = (fr.top  + fr.height / 2 - 9) + 'px'
  orb.style.left = (fr.left + fr.width  / 2 - 9) + 'px'
  document.body.appendChild(orb)
  void orb.offsetWidth
  orb.style.top     = (tr.top  + tr.height / 2 - 9) + 'px'
  orb.style.left    = (tr.left + tr.width  / 2 - 9) + 'px'
  orb.style.transform = 'scale(0.3)'
  orb.style.opacity   = '0.5'
  setTimeout(() => { orb.remove() }, 650)
}
