import { TheoremDetection } from './components/TheoremDetection.js';

// --- Dark Mode Logic ---
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

function updateTheme() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
}

updateTheme(); // Run on load

themeToggle.onclick = () => {
    if (html.classList.contains('dark')) {
        localStorage.theme = 'light';
    } else {
        localStorage.theme = 'dark';
    }
    updateTheme();
};

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileNameDisp = document.getElementById('fileName');
const enhanceBtn = document.getElementById('enhanceBtn');
const cancelBtn = document.getElementById('cancelBtn');
const log = document.getElementById('log');
const configSection = document.getElementById('configSection');
const marginSlider = document.getElementById('marginSlider');
const marginValue = document.getElementById('marginValue');
const epsilonSlider = document.getElementById('epsilonSlider');
const epsilonValue = document.getElementById('epsilonValue');
const sideBtns = document.querySelectorAll('.side-btn');
const sideDesc = document.getElementById('sideDesc');
const modeFixedBtn = document.getElementById('modeFixedBtn');
const modeTabletBtn = document.getElementById('modeTabletBtn');
const modeIndicator = document.getElementById('modeIndicator');
const fixedControls = document.getElementById('fixedControls');
const tabletControls = document.getElementById('tabletControls');
const deviceSelect = document.getElementById('deviceSelect');
const customWidthInput = document.getElementById('customWidth');
const customHeightInput = document.getElementById('customHeight');
const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
const previewContainer = document.getElementById('previewContainer');

let processQueue = [];
const maxWorkers = navigator.hardwareConcurrency || 4;
const workerPool = [];
let jobsCompleted = 0;
let nextJobIndex = 0;
let processingActive = false;
let isEngineReady = false;
let currentSide = 'right';
let currentMode = 'tablet'; // Default to tablet
let batchResults = [];

const sideDescriptions = {
    'right': 'Standard for digital reading or single-sided print.',
    'left': 'Adds space on the left side of every page.',
    'alternating': 'Outer margins (Right on odd, Left on even).'
};

function updatePreview() {
    const isDark = html.classList.contains('dark');
    const strokeColor = isDark ? '#475569' : '#cbd5e1';
    const contentColor = '#3b82f6';
    const bgColor = isDark ? '#1e293b' : '#f8fafc';
    
    let frameW = 70;
    let frameH = 90;
    let contentW = 40;
    let contentH = 60;
    let contentX = 10;
    let contentY = 15;

    if (currentMode === 'tablet') {
        const tw = parseInt(customWidthInput.value) || 2480;
        const th = parseInt(customHeightInput.value) || 1860;
        const eps = parseInt(epsilonSlider.value) || 0;
        
        const ratio = th / tw;
        frameW = 80;
        frameH = 80 * ratio;
        
        const vPad = (eps / 72) * 12; 
        contentH = frameH - (vPad * 2) - 12;
        contentY = vPad + 6;
        
        contentW = 45; 
        if (currentSide === 'right') contentX = 6;
        else if (currentSide === 'left') contentX = frameW - contentW - 6;
        else contentX = 6; 
    } else {
        const mSize = parseInt(marginSlider.value) || 0;
        const hPad = (mSize / 72) * 10;
        frameW = 60 + hPad;
        contentW = 50;
        if (currentSide === 'right') contentX = 6;
        else if (currentSide === 'left') contentX = frameW - contentW - 6;
        else contentX = 6;
    }

    const isAlternating = currentSide === 'alternating';
    const centerX = 120;
    const centerY = 60;

    let svgContent = '';
    
    if (isAlternating) {
        const spread = 25;
        // Even Page (Back) - Content on Right
        const evenX = centerX - frameW - spread/2 + 10;
        const evenY = centerY - frameH/2;
        const evenContentX = frameW - contentW - 5;
        
        svgContent += `
            <g>
                <rect x="${evenX}" y="${evenY}" width="${frameW}" height="${frameH}" rx="3" fill="${bgColor}" stroke="${strokeColor}" stroke-width="1"/>
                <rect x="${evenX + evenContentX}" y="${evenY + contentY}" width="${contentW}" height="${contentH}" rx="1" fill="${contentColor}" fill-opacity="0.8">
                    <animate attributeName="fill-opacity" values="0.6;0.9;0.6" dur="3s" repeatCount="indefinite" />
                </rect>
                <text x="${evenX + frameW/2}" y="${evenY + frameH + 15}" text-anchor="middle" fill="${strokeColor}" font-size="8" font-weight="bold" style="fill: ${strokeColor}">EVEN (2, 4...)</text>
            </g>
        `;

        // Odd Page (Front) - Content on Left
        const oddX = centerX + spread/2 - 10;
        const oddY = centerY - frameH/2;
        const oddContentX = 5;

        svgContent += `
            <rect x="${oddX}" y="${oddY}" width="${frameW}" height="${frameH}" rx="3" fill="${bgColor}" stroke="${strokeColor}" stroke-width="1.5"/>
            <rect x="${oddX + oddContentX}" y="${oddY + contentY}" width="${contentW}" height="${contentH}" rx="1" fill="${contentColor}" fill-opacity="0.8">
                <animate attributeName="fill-opacity" values="0.6;0.9;0.6" dur="3s" repeatCount="indefinite" />
            </rect>
            <line x1="${oddX + oddContentX + 6}" y1="${oddY + contentY + 8}" x2="${oddX + oddContentX + contentW - 6}" y2="${oddY + contentY + 8}" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
            <line x1="${oddX + oddContentX + 6}" y1="${oddY + contentY + 14}" x2="${oddX + oddContentX + contentW - 12}" y2="${oddY + contentY + 14}" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
            <text x="${oddX + frameW/2}" y="${oddY + frameH + 15}" text-anchor="middle" fill="${contentColor}" font-size="8" font-weight="bold" style="fill: ${contentColor}">ODD (1, 3...)</text>
        `;
    } else {
        const mainX = centerX - frameW/2;
        const mainY = centerY - frameH/2;

        svgContent += `
            <rect x="${mainX}" y="${mainY}" width="${frameW}" height="${frameH}" rx="3" fill="${bgColor}" stroke="${strokeColor}" stroke-width="1.5"/>
            <rect x="${mainX + contentX}" y="${mainY + contentY}" width="${contentW}" height="${contentH}" rx="1" fill="${contentColor}" fill-opacity="0.8">
                <animate attributeName="fill-opacity" values="0.6;0.9;0.6" dur="3s" repeatCount="indefinite" />
            </rect>
            <line x1="${mainX + contentX + 6}" y1="${mainY + contentY + 8}" x2="${mainX + contentX + contentW - 6}" y2="${mainY + contentY + 8}" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
            <line x1="${mainX + contentX + 6}" y1="${mainY + contentY + 14}" x2="${mainX + contentX + contentW - 12}" y2="${mainY + contentY + 14}" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
            <text x="${mainX + frameW/2}" y="${mainY + frameH + 15}" text-anchor="middle" fill="${contentColor}" font-size="8" font-weight="bold" style="fill: ${contentColor}">ALL PAGES</text>
        `;
    }

    previewContainer.innerHTML = `
        <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Settings Preview</span>
        <div class="relative">
            <svg width="240" height="140" viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-md">
                ${svgContent}
            </svg>
        </div>
    `;
}

function addLog(msg, isError = false) {
    const div = document.createElement('div');
    div.textContent = `> ${msg}`;
    if (isError) div.className = 'text-red-500';
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
}

// --- Settings Persistence ---
function saveSettings() {
    const settings = {
        mode: currentMode,
        side: currentSide,
        marginSize: marginSlider.value,
        epsilon: epsilonSlider.value,
        tabletWidth: customWidthInput.value,
        tabletHeight: customHeightInput.value,
        deviceSelect: deviceSelect.value
    };
    localStorage.setItem('mathpdf_settings', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('mathpdf_settings');
    if (saved) {
        const s = JSON.parse(saved);
        if (s.mode) setMode(s.mode);
        if (s.side) document.querySelector(`.side-btn[data-value="${s.side}"]`)?.click();
        if (s.marginSize) { marginSlider.value = s.marginSize; marginSlider.dispatchEvent(new Event('input')); }
        if (s.epsilon) { epsilonSlider.value = s.epsilon; epsilonSlider.dispatchEvent(new Event('input')); }
        if (s.tabletWidth) customWidthInput.value = s.tabletWidth;
        if (s.tabletHeight) customHeightInput.value = s.tabletHeight;
        if (s.deviceSelect) deviceSelect.value = s.deviceSelect;
    } else {
        setMode('tablet'); // Default if no settings
    }
    updatePreview();
}

marginSlider.oninput = (e) => {
    const pts = parseInt(e.target.value);
    const inches = (pts / 72).toFixed(1);
    marginValue.textContent = `${inches}"`;
    updatePreview();
    saveSettings();
};

epsilonSlider.oninput = (e) => {
    const pts = parseInt(e.target.value);
    const inches = (pts / 72).toFixed(2);
    epsilonValue.textContent = `${inches}"`;
    updatePreview();
    saveSettings();
};

// Mode Switching Logic
function setMode(mode) {
    currentMode = mode;
    if (mode === 'tablet') {
        modeIndicator.style.transform = 'translateX(0)';
        modeTabletBtn.classList.replace('text-slate-500', 'text-blue-600');
        modeTabletBtn.classList.replace('dark:text-slate-400', 'dark:text-blue-400');
        modeFixedBtn.classList.replace('text-blue-600', 'text-slate-500');
        modeFixedBtn.classList.replace('dark:text-blue-400', 'dark:text-slate-400');
        tabletControls.classList.remove('hidden');
        fixedControls.classList.add('hidden');
    } else {
        modeIndicator.style.transform = 'translateX(100%)';
        modeFixedBtn.classList.replace('text-slate-500', 'text-blue-600');
        modeFixedBtn.classList.replace('dark:text-slate-400', 'dark:text-blue-400');
        modeTabletBtn.classList.replace('text-blue-600', 'text-slate-500');
        modeTabletBtn.classList.replace('dark:text-blue-400', 'dark:text-slate-400');
        fixedControls.classList.remove('hidden');
        tabletControls.classList.add('hidden');
    }
    updatePreview();
    saveSettings();
}

modeFixedBtn.onclick = () => setMode('fixed');
modeTabletBtn.onclick = () => setMode('tablet');

// Device Selection Logic
deviceSelect.onchange = (e) => {
    if (e.target.value !== 'custom') {
        const [w, h] = e.target.value.split(',');
        customWidthInput.value = w;
        customHeightInput.value = h;
    }
    updatePreview();
    saveSettings();
};

// Auto-select custom if user types
[customWidthInput, customHeightInput].forEach(input => {
    input.oninput = () => { deviceSelect.value = 'custom'; updatePreview(); };
    input.onchange = () => saveSettings();
});

sideBtns.forEach(btn => {
    btn.onclick = () => {
        sideBtns.forEach(b => {
            b.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-1', 'bg-blue-50', 'dark:bg-blue-900/50', 'text-blue-700', 'dark:text-blue-300', 'border-blue-200', 'dark:border-blue-800');
            b.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300', 'border-slate-200', 'dark:border-slate-700');
        });
        btn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300', 'border-slate-200', 'dark:border-slate-700');
        btn.classList.add('ring-2', 'ring-blue-500', 'ring-offset-1', 'bg-blue-50', 'dark:bg-blue-900/50', 'text-blue-700', 'dark:text-blue-300', 'border-blue-200', 'dark:border-blue-800');
        currentSide = btn.dataset.value;
        sideDesc.textContent = sideDescriptions[currentSide];
        updatePreview();
        saveSettings();
    };
});

resetDefaultsBtn.onclick = () => {
    setMode('tablet');
    
    marginSlider.value = 180;
    marginSlider.dispatchEvent(new Event('input'));
    
    epsilonSlider.value = 36;
    epsilonSlider.dispatchEvent(new Event('input'));
    
    deviceSelect.value = '2480,1860';
    deviceSelect.dispatchEvent(new Event('change'));
    
    document.querySelector('.side-btn[data-value="right"]')?.click();
    updatePreview();
    addLog('Settings reset to defaults.');
};

function initWorkerPool() {
    if (workerPool.length > 0) return;
    
    for (let i = 0; i < maxWorkers; i++) {
        const w = new Worker('worker.js');
        const workerObj = { id: i, worker: w, busy: false, ready: false, currentFile: null };
        
        w.onmessage = (e) => {
            const { type, data } = e.data;
            if (type === 'READY') {
                workerObj.ready = true;
                if (!isEngineReady) {
                    isEngineReady = true;
                    addLog(`Engine Online (${maxWorkers} threads).`);
                }
                if (processingActive) processNextJob(workerObj);
            } else if (type === 'COMPLETE' || type === 'ERROR') {
                handleJobComplete(workerObj, type, data);
            }
        };
        workerPool.push(workerObj);
    }
}

function downloadFile(bytes, name) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
}

function resetUI() {
    enhanceBtn.disabled = false;
    enhanceBtn.querySelector('span').textContent = 'Download Enhanced PDF';
    document.getElementById('progressContainer').classList.add('hidden');
    cancelBtn.classList.add('hidden');
    processQueue = [];
    batchResults = [];
    processingActive = false;
    renderFileList();
}

dropZone.onclick = () => fileInput.click();
dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('active'); };
dropZone.ondragleave = () => dropZone.classList.remove('active');
dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.classList.remove('active');
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
};

fileInput.onchange = (e) => {
    if (e.target.files.length) handleFiles(e.target.files);
};

function handleFiles(files) {
    let count = 0;
    for (let i = 0; i < files.length; i++) {
        if (files[i].type === 'application/pdf') {
            processQueue.push(files[i]);
            count++;
        }
    }
    
    if (count > 0) {
        initWorkerPool();
        addLog(`Queued ${count} file(s).`);
        renderFileList();
    } else {
        addLog('No valid PDF files found.', true);
    }
    fileInput.value = '';
}

function renderFileList() {
    const list = document.getElementById('fileList');
    list.innerHTML = '';
    
    processQueue.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-item flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 text-sm group';
        item.innerHTML = `
            <span class="truncate text-slate-700 dark:text-slate-300 flex-1 mr-3" title="${file.name}">${file.name}</span>
            <button onclick="removeFile(${index})" class="remove-btn text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" ${processingActive ? 'disabled' : ''}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        `;
        list.appendChild(item);
    });

    if (processQueue.length > 0) {
        configSection.classList.remove('opacity-50', 'pointer-events-none');
        enhanceBtn.disabled = processingActive;
        fileNameDisp.textContent = 'Add more files...';
    } else {
        configSection.classList.add('opacity-50', 'pointer-events-none');
        enhanceBtn.disabled = true;
        fileNameDisp.textContent = 'Click or drag PDFs here';
    }
}

window.removeFile = (index) => {
    if (processingActive) return;
    processQueue.splice(index, 1);
    renderFileList();
};

const readFileAsync = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

function updateProgress() {
    const total = processQueue.length;
    const percent = total > 0 ? (jobsCompleted / total) * 100 : 0;
    document.getElementById('progressBar').style.width = `${percent}%`;
    document.getElementById('statusText').textContent = `Processed ${jobsCompleted} of ${total}`;
    enhanceBtn.querySelector('span').textContent = `Processing ${jobsCompleted}/${total}...`;
}

async function processNextJob(workerObj) {
    if (!processingActive || workerObj.busy) return;
    
    if (nextJobIndex >= processQueue.length) return;
    
    const index = nextJobIndex++;
    const file = processQueue[index];
    workerObj.busy = true;
    workerObj.currentFile = file;

    try {
        const buffer = await readFileAsync(file);
        
        const theoremKeywords = document.getElementById('theoremKeywords').value;
        const highlightColor = document.getElementById('highlightColor').value;
        const drawBoxes = document.getElementById('drawBoxes').checked;

        const config = { 
            side: currentSide,
            theoremDetection: {
                keywords: theoremKeywords.split(',').map(k => k.trim()).filter(k => k),
                highlightColor,
                drawBoxes
            }
        };
        
        if (currentMode === 'fixed') {
            config.marginSize = parseInt(marginSlider.value);
        } else {
            config.tablet = {
                width: parseInt(customWidthInput.value),
                height: parseInt(customHeightInput.value),
                epsilon: parseInt(epsilonSlider.value)
            };
        }

        workerObj.worker.postMessage({
            type: 'PROCESS_PDF',
            data: buffer,
            config: config
        });
    } catch (err) {
        handleJobComplete(workerObj, 'ERROR', err.message);
    }
}

async function handleJobComplete(workerObj, type, data) {
    const file = workerObj.currentFile;
    workerObj.busy = false;
    workerObj.currentFile = null;
    jobsCompleted++;

    if (type === 'COMPLETE') {
        batchResults.push({ name: `enhanced_${file.name}`, data: data });
    } else {
        addLog(`Error processing ${file.name}: ${data}`, true);
    }

    updateProgress();

    if (jobsCompleted >= processQueue.length) {
        addLog('Batch processing complete.');
        
        if (batchResults.length === 1) {
            downloadFile(batchResults[0].data, batchResults[0].name);
        } else if (batchResults.length > 1) {
            addLog('Generating ZIP archive...');
            try {
                const zip = new JSZip();
                batchResults.forEach(item => zip.file(item.name, item.data));
                const content = await zip.generateAsync({ type: 'blob' });
                
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'enhanced_pdfs.zip';
                a.click();
                URL.revokeObjectURL(url);
                addLog('ZIP downloaded.');
            } catch (err) {
                addLog(`Error creating ZIP: ${err.message}`, true);
            }
        }

        resetUI();
    } else {
        processNextJob(workerObj);
    }
}

cancelBtn.onclick = () => {
    processingActive = false;
    addLog('Batch processing cancelled.', true);
    
    // Terminate all workers to stop immediately
    workerPool.forEach(w => w.worker.terminate());
    workerPool.length = 0;
    isEngineReady = false;
    batchResults = [];
    
    resetUI();
    setTimeout(initWorkerPool, 500);
};

enhanceBtn.onclick = () => {
    if (processQueue.length === 0) return;
    
    enhanceBtn.disabled = true;
    cancelBtn.classList.remove('hidden');
    document.getElementById('progressContainer').classList.remove('hidden');
    
    jobsCompleted = 0;
    nextJobIndex = 0;
    processingActive = true;
    batchResults = [];
    
    renderFileList();
    updateProgress();
    
    // Kick off jobs on all ready workers
    workerPool.forEach(w => {
        if (w.ready && !w.busy) processNextJob(w);
    });
    
    addLog(`Starting batch with ${processQueue.length} files...`);
};


function renderTheoremDetection() {
    const container = document.getElementById('theoremDetectionContainer');
    if (container) {
        container.innerHTML = TheoremDetection();
    }
}

initWorkerPool();
loadSettings(); // Load cached settings on startup
renderTheoremDetection();

export {};
