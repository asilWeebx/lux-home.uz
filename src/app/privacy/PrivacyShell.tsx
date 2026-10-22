'use client'

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'

const LANGS = ['en', 'uz', 'ru'] as const
type Lang = typeof LANGS[number]
const STORAGE_KEY = 'lh_privacy_lang'

const isLang = (s: string | null): s is Lang => (LANGS as readonly (string | null)[]).includes(s)

// A #uz / #ru link wins, then the last choice; English by default.
function startLang(): Lang {
  const hash = (location.hash || '').replace('#', '').toLowerCase()
  if (isLang(hash)) return hash
  let saved: string | null = null
  try { saved = localStorage.getItem(STORAGE_KEY) } catch { /* storage blocked */ }
  return isLang(saved) ? saved : 'en'
}
const noSubscribe = () => () => {}

/**
 * The header with the language buttons and the three texts. The server sends
 * English (also what search engines read); the browser then switches to the
 * reader's language, as the old page's script did.
 */
export function PrivacyShell(texts: Record<Lang, ReactNode>) {
  const initial = useSyncExternalStore(noSubscribe, startLang, () => 'en' as Lang)
  const [chosen, setChosen] = useState<Lang | null>(null)
  const lang = chosen ?? initial

  useEffect(() => {
    document.documentElement.lang = lang
    try { localStorage.setItem(STORAGE_KEY, lang) } catch { /* storage blocked */ }
  }, [lang])

  const setLang = (code: Lang) => { setChosen(code); window.scrollTo(0, 0) }

  return <>
    <header className="top">
      <div className="top-inner">
        {/* A full page load on purpose: this page's styles must not follow the reader into the shop. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="brand" href="/">Lux<span>-Home</span></a>
        <div className="langs">
          {LANGS.map(l => (
            <button key={l} className={'lang-btn' + (lang === l ? ' active' : '')} data-set={l} onClick={() => setLang(l)}>{l.toUpperCase()}</button>))}
        </div>
      </div>
    </header>

    <div className="wrap">
      {LANGS.map(l => <div key={l} data-lang={l} className={lang === l ? 'on' : undefined}>{texts[l]}</div>)}

      <footer>© 2026 Lux-Home · lux-home.uz<br/>Developed by Asilbek Yuldashev · asilweb9999@icloud.com</footer>
    </div>
  </>
}
