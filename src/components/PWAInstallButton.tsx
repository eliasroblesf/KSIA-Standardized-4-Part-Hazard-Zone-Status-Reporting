/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Info, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-blue-800 transition active:scale-95"
      >
        <Download className="w-4 h-4" />
        Install App for Offline Use
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-bold text-white shadow-lg transition active:scale-95"
        >
          <Info className="w-4 h-4" />
          Install on iOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-black text-zinc-900 mb-4">Install on iPhone / iPad</h3>
              <div className="space-y-4 text-zinc-600">
                <p className="text-sm flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">1</span>
                  <span>Tap the <strong className="text-zinc-900">Share</strong> icon in the Safari browser toolbar (at the bottom or top).</span>
                </p>
                <p className="text-sm flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">2</span>
                  <span>Scroll down and tap <strong className="text-zinc-900">Add to Home Screen</strong>.</span>
                </p>
                <p className="text-sm flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">3</span>
                  <span>Tap <strong className="text-zinc-900">Add</strong> in the top right corner.</span>
                </p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-8 w-full rounded-xl bg-zinc-900 py-3 text-sm font-bold text-white hover:bg-zinc-800 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
