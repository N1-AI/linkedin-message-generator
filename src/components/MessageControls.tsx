"use client"

import { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";

interface MessageControlsProps {
  onPurposeChange?: (purposes: string[]) => void;
  onLanguageChange?: (language: 'ENG' | 'ITA') => void;
}

const PURPOSES = [
  // Professional
  { value: 'sales', label: 'Sales', category: 'professional' },
  { value: 'recruitment', label: 'Recruitment', category: 'professional' },
  { value: 'networking', label: 'Networking', category: 'professional' },
  { value: 'partnership', label: 'Partnership', category: 'professional' },
  { value: 'investment', label: 'Investment', category: 'professional' },
  { value: 'collaboration', label: 'Collaboration', category: 'professional' },
  { value: 'catch_up', label: 'Catch Up', category: 'casual' },
  { value: 'introduction', label: 'Introduction', category: 'casual' },
  { value: 'advice', label: 'Quick Advice', category: 'casual' },
];

export function MessageControls({ 
  onPurposeChange,
  onLanguageChange 
}: MessageControlsProps) {
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);
  const [language, setLanguage] = useState<'ENG' | 'ITA'>('ENG');

  const handlePurposeToggle = (value: string) => {
    const newPurposes = selectedPurposes.includes(value)
      ? selectedPurposes.filter(p => p !== value)
      : selectedPurposes.length < 3 // Check if we can add more purposes
        ? [...selectedPurposes, value]
        : selectedPurposes; // Don't add if we already have 3
    setSelectedPurposes(newPurposes);
    onPurposeChange?.(newPurposes);
  };

  const handleLanguageChange = () => {
    const newLanguage = language === 'ENG' ? 'ITA' : 'ENG';
    setLanguage(newLanguage);
    onLanguageChange?.(newLanguage);
  };

  return (
    <div className="space-y-6">
      {/* Purpose Selection */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm text-gray-500">Purpose</Label>
          <span className="text-xs text-gray-400">
            {selectedPurposes.length}/3 selected
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PURPOSES.map(purpose => (
            <Toggle
              key={purpose.value}
              pressed={selectedPurposes.includes(purpose.value)}
              onPressedChange={() => handlePurposeToggle(purpose.value)}
              disabled={!selectedPurposes.includes(purpose.value) && selectedPurposes.length >= 3}
              className="px-3 py-1.5 text-sm bg-white border text-gray-600 data-[state=on]:bg-gray-100 data-[state=on]:border-gray-300
                        hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {purpose.label}
            </Toggle>
          ))}
        </div>
      </div>

      {/* Language Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-sm text-gray-500">Language</Label>
        <button
          onClick={handleLanguageChange}
          className="flex rounded-md border overflow-hidden"
        >
          <span 
            className={`px-3 py-1 text-sm transition-colors ${
              language === 'ENG' 
                ? 'bg-gray-100 text-gray-500' 
                : 'bg-white text-gray-500'
            }`}
          >
            ENG
          </span>
          <span 
            className={`px-3 py-1 text-sm transition-colors ${
              language === 'ITA' 
                ? 'bg-gray-100 text-gray-500' 
                : 'bg-white text-gray-500'
            }`}
          >
            ITA
          </span>
        </button>
      </div>
    </div>
  );
} 