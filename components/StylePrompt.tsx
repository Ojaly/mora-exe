"use client";

import { useState } from "react";

interface Props {
  prompt: string;
}

export default function StylePrompt({ prompt }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Suno Style Prompt
        </h2>
        <button
          onClick={handleCopy}
          className={`px-3 py-1 text-xs rounded border transition-colors ${
            copied
              ? "border-green-600 text-green-600 bg-green-50"
              : "border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900"
          }`}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="bg-gray-50 border border-gray-200 rounded p-4 text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
        {prompt}
      </pre>
    </div>
  );
}
