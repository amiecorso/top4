'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  PROMPT_CATEGORIES,
  PromptCategoryKey,
  getPromptsByTags,
  getPromptCountForCategory,
} from '@/types/game'

export default function PromptsPage() {
  const [search, setSearch] = useState('')
  const [showInappropriate, setShowInappropriate] = useState(false)
  const [showCoinbase, setShowCoinbase] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [copiedCat, setCopiedCat] = useState<string | null>(null)

  // Respect the same unlocks used on the home page.
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const params = new URLSearchParams(window.location.search)
      if (
        window.localStorage.getItem('showInappropriate') === 'true' ||
        params.get('showInappropriate') === 'true'
      ) {
        setShowInappropriate(true)
      }
      if (
        window.localStorage.getItem('showCoinbase') === 'true' ||
        params.get('showCoinbase') === 'true'
      ) {
        setShowCoinbase(true)
      }
    } catch (_e) {}
  }, [])

  const query = search.trim().toLowerCase()

  const categories = (Object.keys(PROMPT_CATEGORIES) as PromptCategoryKey[]).filter(
    (key) =>
      (showInappropriate || key !== 'inappropriate') &&
      (showCoinbase || key !== 'baseAccount')
  )

  const toggle = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const copyCategory = async (key: PromptCategoryKey, prompts: string[]) => {
    try {
      await navigator.clipboard.writeText(prompts.join('\n'))
      setCopiedCat(key)
      setTimeout(() => setCopiedCat((c) => (c === key ? null : c)), 1500)
    } catch (_e) {}
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to game
          </Link>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-2">
          Prompt Library
        </h1>
        <p className="text-slate-600 mb-6">
          Browse every prompt by category — get a feel for what&apos;s in the box, or copy a
          list to seed your own analog game.
        </p>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search prompts…"
          className="input mb-6"
        />

        <div className="space-y-3">
          {categories.map((key) => {
            const all = getPromptsByTags([key])
            const matches = query
              ? all.filter((p) => p.toLowerCase().includes(query))
              : all
            // While searching, hide categories with no matches and force-open the rest.
            if (query && matches.length === 0) return null
            const isOpen = query ? true : !!expanded[key]

            return (
              <div key={key} className="card">
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  className="w-full flex items-center justify-between text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-lg font-semibold text-slate-900">
                    {PROMPT_CATEGORIES[key].name}
                  </span>
                  <span className="text-sm text-slate-500 whitespace-nowrap">
                    {query
                      ? `${matches.length} of ${all.length}`
                      : `${getPromptCountForCategory(key)} prompts`}
                    <span className="ml-2 inline-block">{isOpen ? '▲' : '▼'}</span>
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-4">
                    <div className="flex justify-end mb-3">
                      <button
                        type="button"
                        onClick={() => copyCategory(key, matches)}
                        className="btn-muted px-3 py-1 text-sm"
                      >
                        {copiedCat === key ? 'Copied!' : 'Copy list'}
                      </button>
                    </div>
                    <ul className="space-y-1 list-disc list-inside text-slate-700">
                      {matches.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
