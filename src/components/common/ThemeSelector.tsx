import React, { useState, useEffect } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';
import { Modal } from './Modal';

export type ThemeId = 'navy-cyan' | 'obsidian-amber' | 'emerald-mint' | 'indigo-violet' | 'plum-peach';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgColor: string;
  recommended?: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'emerald-mint',
    name: 'Slate Emerald & Fresh Mint',
    tagline: 'Trustworthy financial security, stability, and insurance intelligence (Selected)',
    primaryColor: '#0A231C',
    secondaryColor: '#143D32',
    accentColor: '#10B981',
    bgColor: '#F6FAF8',
    recommended: true,
  },
  {
    id: 'navy-cyan',
    name: 'Midnight Navy & Electric Cyan',
    tagline: 'Modern, sleek, high-tech enterprise AI aesthetic',
    primaryColor: '#0B132B',
    secondaryColor: '#1C2541',
    accentColor: '#0284C7',
    bgColor: '#F8FAFC',
  },
  {
    id: 'obsidian-amber',
    name: 'Obsidian Charcoal & Radiant Amber',
    tagline: 'Sophisticated executive tech aesthetic (Linear & Ramp style)',
    primaryColor: '#141518',
    secondaryColor: '#22242A',
    accentColor: '#EA580C',
    bgColor: '#F9FAFB',
  },
  {
    id: 'indigo-violet',
    name: 'Deep Royal Indigo & Electric Violet',
    tagline: 'Cutting-edge AI-native SaaS aesthetic with vibrant violet signals',
    primaryColor: '#0F172A',
    secondaryColor: '#1E1B4B',
    accentColor: '#6366F1',
    bgColor: '#F8FAFC',
  },
  {
    id: 'plum-peach',
    name: 'Original Deep Plum & Peach',
    tagline: 'Distinctive warm enterprise plum with peach AI activity indicators',
    primaryColor: '#351B36',
    secondaryColor: '#542653',
    accentColor: '#F08A7E',
    bgColor: '#FCF9F7',
  },
];

interface ThemeSelectorProps {
  currentTheme: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Quick Theme Switcher Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ivory-warm hover:bg-plum-soft/50 border border-plum-soft text-plum-deep font-bold text-xs transition-all shadow-soft group"
        title="Change Platform Color Palette"
      >
        <Palette className="w-4 h-4 text-peach-primary group-hover:rotate-45 transition-transform" />
        <span className="hidden sm:inline">Theme:</span>
        <div className="flex items-center gap-1">
          <span
            className="w-3 h-3 rounded-full border border-black/20"
            style={{
              backgroundColor:
                THEME_OPTIONS.find((t) => t.id === currentTheme)?.primaryColor || '#0B132B',
            }}
          />
          <span
            className="w-3 h-3 rounded-full border border-black/20"
            style={{
              backgroundColor:
                THEME_OPTIONS.find((t) => t.id === currentTheme)?.accentColor || '#0284C7',
            }}
          />
        </div>
      </button>

      {/* Visual Color Palette Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Select Color Palette"
        subtitle="Click any color scheme to immediately transform the entire platform visual identity"
        maxWidth="2xl"
      >
        <div className="space-y-3.5 text-xs">
          {THEME_OPTIONS.map((theme) => {
            const isSelected = currentTheme === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => {
                  onSelectTheme(theme.id);
                  setIsOpen(false);
                }}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-peach-primary bg-peach-light/20 shadow-glow-peach ring-2 ring-peach-primary/30'
                    : 'border-plum-soft bg-white hover:border-plum-secondary/40 hover:shadow-card'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-plum-deep">{theme.name}</h4>
                    {theme.recommended && (
                      <span className="px-2 py-0.5 rounded-full bg-semantic-successBg text-semantic-success font-bold text-[10px]">
                        Recommended
                      </span>
                    )}
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full bg-peach-primary text-plum-deep font-black text-[10px]">
                        Active Theme
                      </span>
                    )}
                  </div>
                  <p className="text-ink-secondary text-[11px] leading-relaxed">{theme.tagline}</p>
                </div>

                {/* Color Swatch Previews */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center p-1.5 rounded-xl border border-gray-200 bg-gray-50 gap-1.5 shadow-soft">
                    <div className="flex flex-col items-center">
                      <span
                        className="w-7 h-7 rounded-lg border border-black/10 shadow-sm"
                        style={{ backgroundColor: theme.primaryColor }}
                        title={`Primary: ${theme.primaryColor}`}
                      />
                      <span className="text-[9px] text-gray-500 font-mono mt-0.5">Primary</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span
                        className="w-7 h-7 rounded-lg border border-black/10 shadow-sm"
                        style={{ backgroundColor: theme.secondaryColor }}
                        title={`Surface: ${theme.secondaryColor}`}
                      />
                      <span className="text-[9px] text-gray-500 font-mono mt-0.5">Surface</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span
                        className="w-7 h-7 rounded-lg border border-black/10 shadow-sm ring-1 ring-black/10"
                        style={{ backgroundColor: theme.accentColor }}
                        title={`AI Signal: ${theme.accentColor}`}
                      />
                      <span className="text-[9px] text-gray-500 font-mono mt-0.5">AI Pulse</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span
                        className="w-7 h-7 rounded-lg border border-gray-300 shadow-sm"
                        style={{ backgroundColor: theme.bgColor }}
                        title={`Background: ${theme.bgColor}`}
                      />
                      <span className="text-[9px] text-gray-500 font-mono mt-0.5">Canvas</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-peach-primary text-plum-deep flex items-center justify-center font-bold">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="pt-2 flex items-center justify-between text-[11px] text-ink-muted">
            <span>Your selected theme is automatically saved in browser preferences.</span>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-1.5 rounded-xl bg-plum-deep text-white font-bold hover:bg-plum-secondary"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
