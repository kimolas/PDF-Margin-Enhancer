
export function TheoremDetection() {
    return `
    <div id="theoremDetectionConfig" class="space-y-5">
        <div class="flex justify-between items-center">
            <h2 class="text-lg font-bold text-slate-800 dark:text-white">Theorem Detection</h2>
        </div>

        <div>
            <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Keywords</label>
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Enter keywords to identify theorem-like blocks (e.g., "Theorem", "Lemma", "Definition").
            </p>
            <input type="text" id="theoremKeywords" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all" value="Theorem, Lemma, Corollary, Proposition, Definition, Remark, Example, Note">
        </div>

        <div>
            <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Highlight Color</label>
            <div class="flex items-center gap-2">
                <input type="color" id="highlightColor" value="#fef3c7" class="h-8 w-8 p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span class="text-xs text-slate-500 dark:text-slate-400">Choose a color for the background.</span>
            </div>
        </div>

        <div class="flex items-center">
            <input type="checkbox" id="drawBoxes" checked class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
            <label for="drawBoxes" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">Draw colored boxes</label>
        </div>

    </div>
    `;
}
