"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Search,
  ExternalLink,
  ShieldCheck,
  Tag,
  Sparkles,
} from "lucide-react";
import { searchHealthLibrary } from "@/lib/api";
import { SourceCitation } from "@/lib/types";

export default function LibraryPage() {
  const [searchTerm, setSearchTerm] = useState("sleep");
  const [results, setResults] = useState<SourceCitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("sleep");

  const categories = [
    { id: "sleep", label: "Sleep Hygiene", query: "healthy sleep insomnia" },
    { id: "stress", label: "Everyday Stress", query: "stress management relaxation" },
    { id: "ergonomics", label: "Ergonomics & Desk Health", query: "ergonomics posture occupational" },
    { id: "nutrition", label: "Hydration & Daily Nutrition", query: "water hydration healthy habits" },
  ];

  const handleSearch = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) return;
    setLoading(true);
    try {
      const data = await searchHealthLibrary(queryToSearch);
      setResults(data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch("healthy sleep");
  }, []);

  const handleCategoryClick = (cat: typeof categories[0]) => {
    setActiveCategory(cat.id);
    setSearchTerm(cat.label);
    handleSearch(cat.query);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="border-b border-subtle pb-4">
        <h1 className="font-serif text-3xl font-bold text-forest-950 flex items-center gap-2.5">
          <BookOpen className="w-7 h-7 text-forest-700" />
          Verified Health Knowledge Library
        </h1>
        <p className="text-sm text-ink-700 mt-1">
          Explore peer-reviewed health topics and educational guidance from the U.S. National Library of Medicine (MedlinePlus).
        </p>
      </div>

      {/* Search Input */}
      <div className="bg-warm-50 p-6 rounded-2xl border border-warm-200 shadow-soft space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(searchTerm);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-ink-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search topics (e.g., circadian rhythm, stress, eye strain, hydration)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF8F5] rounded-xl border border-warm-300 text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-warm-50 text-xs font-semibold shadow-soft transition-transform active:scale-95 shrink-0"
          >
            {loading ? "Searching..." : "Search Library"}
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                activeCategory === cat.id
                  ? "bg-forest-800 text-warm-50 border-forest-800 font-semibold"
                  : "bg-warm-100 hover:bg-warm-200 text-ink-700 border-warm-300"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-forest-950">
            Health Topic Articles
          </h2>
          <span className="text-xs text-ink-500">
            {results.length} official resources found
          </span>
        </div>

        {results.length === 0 && !loading && (
          <div className="p-8 rounded-2xl bg-warm-50 border border-warm-200 text-center text-xs text-ink-500">
            No specific articles found. Try searching for broader terms like "sleep", "stress", or "nutrition".
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {results.map((art, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-warm-50 border border-warm-200 shadow-soft space-y-2 hover:border-forest-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <a
                  href={art.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-serif text-base font-bold text-forest-950 hover:underline flex items-center gap-1.5"
                >
                  <span>{art.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                </a>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sage-100 text-forest-900 self-start sm:self-auto">
                  {art.attribution || "MedlinePlus"}
                </span>
              </div>
              <p className="text-xs text-ink-700 leading-relaxed">{art.summary}</p>
              <div className="text-[11px] text-ink-400 pt-1">
                Source Organization: {art.organization}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Educational Grounding Attribution Banner */}
      <div className="p-4 rounded-xl bg-warm-100/60 border border-subtle text-xs text-ink-600 flex items-center gap-3">
        <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0" />
        <span>
          Attribution: Content retrieved via the National Library of Medicine (NLM) MedlinePlus Web Service. MedlinePlus does not endorse third-party applications.
        </span>
      </div>
    </div>
  );
}
