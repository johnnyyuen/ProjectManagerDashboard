// Theme Palettes
const darkPalette = [
  '#00f0d4', '#8b5cf6', '#38bdf8', '#c084fc', 
  '#06b6d4', '#a855f7', '#0284c7', '#d946ef',
  '#6366f1', '#14b8a6', '#9333ea'
];

const lightPalette = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', 
  '#6366F1', '#A855F7', '#0EA5E9', '#D946EF',
  '#F97316', '#14B8A6', '#64748B'
];

// Status Colors
const ragColors = {
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  completed: '#00f0d4',
  todo: '#64748b',
  blocked: '#09090b',
  default: '#64748b'
};

const allSizesList = ['S', 'M', 'L', 'XL'];
const allRagsList = ['GREEN', 'AMBER', 'RED', 'COMPLETED', 'TODO', 'BLOCKED'];

let currentProjects = [];
let uniquePMs = [];
let selectedPMs = new Set();
let selectedSizes = new Set(allSizesList);
let selectedRags = new Set(allRagsList);
let pmColorMap = new Map();
let zoomLevel = 1.0;
const minZoom = 1.0;
const maxZoom = 4.0;
const zoomStep = 0.5;

const themeSelect = document.getElementById('themeSelect');
const fileInput = document.getElementById('fileInput');
const uploadBtnText = document.getElementById('uploadBtnText');
const colorModeSelect = document.getElementById('colorModeSelect');
const displayModeSelect = document.getElementById('displayModeSelect');

// Dropdown elements
const pmDropdownContainer = document.getElementById('pmDropdownContainer');
const pmDropdownBtn = document.getElementById('pmDropdownBtn');
const pmDropdownMenu = document.getElementById('pmDropdownMenu');
const pmDropdownLabel = document.getElementById('pmDropdownLabel');
const pmCheckboxList = document.getElementById('pmCheckboxList');
const selectAllPmsBtn = document.getElementById('selectAllPmsBtn');
const deselectAllPmsBtn = document.getElementById('deselectAllPmsBtn');

const sizeDropdownContainer = document.getElementById('sizeDropdownContainer');
const sizeDropdownBtn = document.getElementById('sizeDropdownBtn');
const sizeDropdownMenu = document.getElementById('sizeDropdownMenu');
const sizeDropdownLabel = document.getElementById('sizeDropdownLabel');
const sizeCheckboxList = document.getElementById('sizeCheckboxList');
const selectAllSizesBtn = document.getElementById('selectAllSizesBtn');
const deselectAllSizesBtn = document.getElementById('deselectAllSizesBtn');

const ragDropdownContainer = document.getElementById('ragDropdownContainer');
const ragDropdownBtn = document.getElementById('ragDropdownBtn');
const ragDropdownMenu = document.getElementById('ragDropdownMenu');
const ragDropdownLabel = document.getElementById('ragDropdownLabel');
const ragCheckboxList = document.getElementById('ragCheckboxList');
const selectAllRagsBtn = document.getElementById('selectAllRagsBtn');
const deselectAllRagsBtn = document.getElementById('deselectAllRagsBtn');

const chartViewport = document.getElementById('chartViewport');
const chartCanvas = document.getElementById('chartCanvas');
const quartersRow = document.getElementById('quartersRow');
const monthsRow = document.getElementById('monthsRow');
const unifiedRowsLayer = document.getElementById('unifiedRowsLayer');
const overallPmTooltipContainer = document.getElementById('overallPmTooltipContainer');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const zoomResetBtn = document.getElementById('zoomResetBtn');
const zoomLevelText = document.getElementById('zoomLevelText');

// Theme switching listener
themeSelect.addEventListener('change', () => {
  if (themeSelect.value === 'light') {
    document.body.classList.add('theme-light');
  } else {
    document.body.classList.remove('theme-light');
  }
  assignPMColors();
  render();
});

function assignPMColors() {
  const palette = themeSelect.value === 'light' ? lightPalette : darkPalette;
  pmColorMap.clear();
  uniquePMs.forEach((pm, idx) => {
    pmColorMap.set(pm, palette[idx % palette.length]);
  });
}

function parseCustomDate(dateStr) {
  if (!dateStr) return null;
  dateStr = String(dateStr).replace(/^\uFEFF/, '').trim();
  
  const monthMap = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };

  const match = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = monthMap[match[2].toLowerCase()];
    const year = parseInt(match[3], 10);
    if (month !== undefined) return new Date(year, month, day);
  }

  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function formatDateDisplay(d) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(d.getDate()).padStart(2, '0');
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getNormalizedSize(sizeStr) {
  const clean = String(sizeStr || '').toUpperCase().trim();
  if (clean === 'M') return 'M';
  if (clean === 'L') return 'L';
  if (clean === 'XL') return 'XL';
  return 'S';
}

function getNormalizedRAG(ragStr) {
  const clean = String(ragStr || '').toUpperCase().trim();
  if (clean.includes('GREEN')) return 'GREEN';
  if (clean.includes('AMBER') || clean.includes('YELLOW')) return 'AMBER';
  if (clean.includes('RED')) return 'RED';
  if (clean.includes('COMPLETE') || clean.includes('DONE')) return 'COMPLETED';
  if (clean.includes('BLOCK')) return 'BLOCKED';
  if (clean.includes('TODO') || clean.includes('NOT STARTED') || clean.includes('BACKLOG')) return 'TODO';
  return 'TODO';
}

function getBarHeightBySize(sizeStr) {
  const s = getNormalizedSize(sizeStr);
  if (s === 'M') return 10;
  if (s === 'L') return 14;
  if (s === 'XL') return 18;
  return 6;
}

function parseCSVText(text) {
  if (!text) return [];
  text = text.replace(/^\uFEFF/, '').trim();
  const rawLines = text.split(/\r\n|\n|\r/);
  const lines = rawLines.map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  const parseRow = (row) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  const headers = parseRow(lines[0]).map(h => h.replace(/^\uFEFF/, '').trim());
  return lines.slice(1).map(line => {
    const values = parseRow(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] !== undefined ? values[i] : '';
    });
    return obj;
  });
}

function parseJSONText(text) {
  try {
    text = text.replace(/^\uFEFF/, '').trim();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') {
      for (let key of Object.keys(parsed)) {
        if (Array.isArray(parsed[key])) return parsed[key];
      }
    }
    return [];
  } catch (e) {
    return [];
  }
}

async function autoLoadDefaultData() {
  const embeddedScript = document.getElementById('embeddedCsvData');
  if (embeddedScript && embeddedScript.textContent.trim().length > 20) {
    const rawData = parseCSVText(embeddedScript.textContent);
    if (rawData.length > 0) {
      parseAndLoadData(rawData);
      return;
    }
  }

  if (window.location.protocol !== 'file:') {
    try {
      let res = await fetch('./ProjectListing.json');
      if (res.ok) {
        const text = await res.text();
        const rawData = parseJSONText(text);
        if (rawData.length > 0) {
          parseAndLoadData(rawData);
          return;
        }
      }
      res = await fetch('./ProjectListing.csv');
      if (res.ok) {
        const text = await res.text();
        const rawData = parseCSVText(text);
        parseAndLoadData(rawData);
      }
    } catch (err) {}
  }
}
window.addEventListener('DOMContentLoaded', autoLoadDefaultData);

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  uploadBtnText.textContent = file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const content = evt.target.result;
    let rawData = [];
    const trimmed = content.replace(/^\uFEFF/, '').trim();
    if (file.name.endsWith('.json') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
      rawData = parseJSONText(content);
    } else {
      rawData = parseCSVText(content);
    }
    parseAndLoadData(rawData);
    fileInput.value = '';
  };
  reader.readAsText(file);
});

colorModeSelect.addEventListener('change', render);

displayModeSelect.addEventListener('change', () => {
  const mode = displayModeSelect.value;
  chartViewport.classList.remove('view-compact', 'view-super-compact', 'view-full');
  if (mode === 'full') {
    chartViewport.classList.add('view-full');
  } else if (mode === 'super-compact') {
    chartViewport.classList.add('view-super-compact');
  } else {
    chartViewport.classList.add('view-compact');
  }
  render();
});

// Dropdown toggles
pmDropdownBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  closeAllDropdowns(pmDropdownMenu);
  pmDropdownMenu.classList.toggle('open');
});

sizeDropdownBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  closeAllDropdowns(sizeDropdownMenu);
  sizeDropdownMenu.classList.toggle('open');
});

ragDropdownBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  closeAllDropdowns(ragDropdownMenu);
  ragDropdownMenu.classList.toggle('open');
});

function closeAllDropdowns(except = null) {
  if (pmDropdownMenu !== except) pmDropdownMenu.classList.remove('open');
  if (sizeDropdownMenu !== except) sizeDropdownMenu.classList.remove('open');
  if (ragDropdownMenu !== except) ragDropdownMenu.classList.remove('open');
}

document.addEventListener('click', (e) => {
  if (!pmDropdownContainer.contains(e.target) && !sizeDropdownContainer.contains(e.target) && !ragDropdownContainer.contains(e.target)) {
    closeAllDropdowns();
  }
});

// PM Select All / Deselect All
selectAllPmsBtn.addEventListener('click', () => {
  selectedPMs = new Set(uniquePMs);
  updatePMCheckboxes();
  render();
});

deselectAllPmsBtn.addEventListener('click', () => {
  selectedPMs.clear();
  updatePMCheckboxes();
  render();
});

// Size Select All / Deselect All
selectAllSizesBtn.addEventListener('click', () => {
  selectedSizes = new Set(allSizesList);
  updateSizeCheckboxes();
  render();
});

deselectAllSizesBtn.addEventListener('click', () => {
  selectedSizes.clear();
  updateSizeCheckboxes();
  render();
});

// Status Select All / Deselect All
selectAllRagsBtn.addEventListener('click', () => {
  selectedRags = new Set(allRagsList);
  updateRAGCheckboxes();
  render();
});

deselectAllRagsBtn.addEventListener('click', () => {
  selectedRags.clear();
  updateRAGCheckboxes();
  render();
});

chartViewport.addEventListener('scroll', updateStickyLabels);

function updateStickyLabels() {
  const viewportScrollLeft = chartViewport.scrollLeft;
  const nodes = document.querySelectorAll('.project-node');

  nodes.forEach(node => {
    const underlay = node.querySelector('.hover-underlay');
    if (!underlay) return;

    const nodeLeft = node.offsetLeft;
    const nodeWidth = node.offsetWidth;

    if (nodeLeft < viewportScrollLeft && (nodeLeft + nodeWidth) > viewportScrollLeft) {
      const offset = viewportScrollLeft - nodeLeft;
      underlay.style.transform = `translateX(${offset}px)`;
    } else {
      underlay.style.transform = 'translateX(0px)';
    }
  });
}

function parseAndLoadData(data) {
  if (!Array.isArray(data) || data.length === 0) {
    unifiedRowsLayer.innerHTML = '<div class="empty-state">No project records found.</div>';
    return;
  }

  currentProjects = data.map(row => {
    const keys = Object.keys(row);

    const findField = (exactMatches) => {
      for (let m of exactMatches) {
        const matchKey = keys.find(k => {
          const cleanK = k.replace(/^\uFEFF/, '').replace(/^["']|["']$/g, '').trim().toLowerCase();
          return cleanK === m.toLowerCase();
        });
        if (matchKey && row[matchKey] !== undefined && row[matchKey] !== null) {
          const val = String(row[matchKey]).replace(/^["']|["']$/g, '').trim();
          if (val.length > 0) return val;
        }
      }
      return null;
    };

    const pm = findField(['Project Manager', 'PM', 'project_manager', 'projectManager']) || 'Unassigned';
    const name = findField(['Project Name', 'Project', 'project_name', 'projectName', 'name']) || 'Untitled Project';
    const start = parseCustomDate(findField(['Start Date', 'Start', 'start_date', 'startDate']));
    const end = parseCustomDate(findField(['End/Due Date', 'Due Date', 'End Date', 'End', 'end_date', 'endDate', 'dueDate']));
    const rag = getNormalizedRAG(findField(['RAG Status', 'RAG', 'Status', 'rag_status', 'ragStatus', 'status']));
    const size = getNormalizedSize(findField(['Size', 'Project Size', 'T-Shirt Size', 'Tshirt Size', 'T-Shirt', 'size', 'projectSize']));
    
    let url = findField(['URL', 'Link', 'Jira', 'Confluence', 'Project URL', 'Project Link', 'url', 'link']);
    if (url) {
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
    } else {
      url = null;
    }

    return { pm, name, start, end, rag, size, url };
  }).filter(p => p.start && p.end && p.end >= p.start);

  if (currentProjects.length === 0) {
    unifiedRowsLayer.innerHTML = '<div class="empty-state">No valid date records found. Check Start/End Date formats.</div>';
    pmDropdownContainer.style.display = 'none';
    sizeDropdownContainer.style.display = 'none';
    ragDropdownContainer.style.display = 'none';
    toggleZoomControls(false);
    return;
  }

  uniquePMs = Array.from(new Set(currentProjects.map(p => p.pm))).sort((a, b) => a.localeCompare(b));
  selectedPMs = new Set(uniquePMs);
  selectedSizes = new Set(allSizesList);
  selectedRags = new Set(allRagsList);

  assignPMColors();
  buildFilterMenus();

  pmDropdownContainer.style.display = 'inline-block';
  sizeDropdownContainer.style.display = 'inline-block';
  ragDropdownContainer.style.display = 'inline-block';
  toggleZoomControls(true);
  zoomLevel = 1.0;
  render();
}

function buildFilterMenus() {
  // 1. Build PM Menu
  pmCheckboxList.innerHTML = '';
  uniquePMs.forEach(pm => {
    const label = document.createElement('label');
    label.className = 'dropdown-item';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = pm;
    checkbox.checked = selectedPMs.has(pm);
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) selectedPMs.add(pm);
      else selectedPMs.delete(pm);
      updateDropdownLabels();
      render();
    });
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(pm));
    pmCheckboxList.appendChild(label);
  });

  // 2. Build Size Menu
  sizeCheckboxList.innerHTML = '';
  allSizesList.forEach(s => {
    const label = document.createElement('label');
    label.className = 'dropdown-item';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = s;
    checkbox.checked = selectedSizes.has(s);
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) selectedSizes.add(s);
      else selectedSizes.delete(s);
      updateDropdownLabels();
      render();
    });
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(`Size ${s}`));
    sizeCheckboxList.appendChild(label);
  });

  // 3. Build Status Menu
  ragCheckboxList.innerHTML = '';
  allRagsList.forEach(r => {
    const label = document.createElement('label');
    label.className = 'dropdown-item';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = r;
    checkbox.checked = selectedRags.has(r);
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) selectedRags.add(r);
      else selectedRags.delete(r);
      updateDropdownLabels();
      render();
    });
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(r));
    ragCheckboxList.appendChild(label);
  });

  updateDropdownLabels();
}

function updatePMCheckboxes() {
  pmCheckboxList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.checked = selectedPMs.has(cb.value);
  });
  updateDropdownLabels();
}

function updateSizeCheckboxes() {
  sizeCheckboxList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.checked = selectedSizes.has(cb.value);
  });
  updateDropdownLabels();
}

function updateRAGCheckboxes() {
  ragCheckboxList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.checked = selectedRags.has(cb.value);
  });
  updateDropdownLabels();
}

function updateDropdownLabels() {
  if (selectedPMs.size === uniquePMs.length) pmDropdownLabel.textContent = 'Filter PMs (All)';
  else if (selectedPMs.size === 0) pmDropdownLabel.textContent = 'Filter PMs (None)';
  else pmDropdownLabel.textContent = `Filter PMs (${selectedPMs.size}/${uniquePMs.length})`;

  if (selectedSizes.size === allSizesList.length) sizeDropdownLabel.textContent = 'Size (All)';
  else if (selectedSizes.size === 0) sizeDropdownLabel.textContent = 'Size (None)';
  else sizeDropdownLabel.textContent = `Size (${Array.from(selectedSizes).join(',')})`;

  if (selectedRags.size === allRagsList.length) ragDropdownLabel.textContent = 'Status (All)';
  else if (selectedRags.size === 0) ragDropdownLabel.textContent = 'Status (None)';
  else ragDropdownLabel.textContent = `Status (${selectedRags.size}/${allRagsList.length})`;
}

function toggleZoomControls(enabled) {
  zoomInBtn.disabled = !enabled;
  zoomOutBtn.disabled = !enabled;
  zoomResetBtn.disabled = !enabled;
}

zoomInBtn.addEventListener('click', () => {
  if (zoomLevel < maxZoom) {
    zoomLevel = Math.min(maxZoom, zoomLevel + zoomStep);
    render();
  }
});

zoomOutBtn.addEventListener('click', () => {
  if (zoomLevel > minZoom) {
    zoomLevel = Math.max(minZoom, zoomLevel - zoomStep);
    render();
  }
});

zoomResetBtn.addEventListener('click', () => {
  zoomLevel = 1.0;
  render();
});

function getRagColor(rag) {
  const clean = (rag || '').toLowerCase();
  if (clean.includes('green')) return ragColors.green;
  if (clean.includes('amber') || clean.includes('yellow')) return ragColors.amber;
  if (clean.includes('red')) return ragColors.red;
  if (clean.includes('complete') || clean.includes('done')) return ragColors.completed;
  if (clean.includes('block')) return ragColors.blocked;
  if (clean.includes('todo')) return ragColors.todo;
  return ragColors.default;
}

function getBarStyle(proj, pmColor, mode) {
  const ragColor = getRagColor(proj.rag);
  if (mode === 'pm') {
    return `background: ${pmColor};`;
  } else if (mode === 'rag') {
    return `background: ${ragColor}; ${proj.rag === 'BLOCKED' ? 'border: 1px solid rgba(255,255,255,0.4);' : ''}`;
  } else {
    return `background: linear-gradient(to right, ${ragColor}, ${pmColor}); ${proj.rag === 'BLOCKED' ? 'border: 1px solid rgba(255,255,255,0.4);' : ''}`;
  }
}

// STRICT RULE: Every project gets its own dedicated row/sublane
function arrangeInLanes(projects) {
  const sorted = [...projects].sort((a, b) => a.start - b.start);
  return sorted.map(proj => [proj]);
}

function generateGenericStatsTooltipHTML(title, projects, extraSubtitle = '') {
  const total = projects.length;
  const sizes = { S: 0, M: 0, L: 0, XL: 0 };
  const statuses = { GREEN: 0, AMBER: 0, RED: 0, COMPLETED: 0, TODO: 0, BLOCKED: 0 };

  projects.forEach(p => {
    const s = getNormalizedSize(p.size);
    sizes[s]++;
    const r = getNormalizedRAG(p.rag);
    statuses[r]++;
  });

  return `
    <div class="stat-tooltip">
      <div class="stat-tooltip-header">
        <span>${title}</span>
        <span class="stat-tooltip-total">${total} Total</span>
      </div>
      ${extraSubtitle ? `<div style="font-size: 0.65rem; color: #9ba1d0; margin-top: -4px;">${extraSubtitle}</div>` : ''}

      <div class="stat-tooltip-section">
        <span class="stat-tooltip-label">Project Sizes</span>
        <div class="stat-tooltip-pills">
          ${sizes.S > 0 ? `<span class="stat-pill">S: <b>${sizes.S}</b></span>` : ''}
          ${sizes.M > 0 ? `<span class="stat-pill">M: <b>${sizes.M}</b></span>` : ''}
          ${sizes.L > 0 ? `<span class="stat-pill">L: <b>${sizes.L}</b></span>` : ''}
          ${sizes.XL > 0 ? `<span class="stat-pill">XL: <b>${sizes.XL}</b></span>` : ''}
          ${(sizes.S + sizes.M + sizes.L + sizes.XL === 0) ? '<span style="font-size: 0.65rem; color: #94a3b8;">No projects</span>' : ''}
        </div>
      </div>

      <div class="stat-tooltip-section">
        <span class="stat-tooltip-label">Status Overview</span>
        <div class="stat-tooltip-pills">
          ${statuses.GREEN > 0 ? `<span class="stat-pill" style="border-left: 3px solid ${ragColors.green};">Green: <b>${statuses.GREEN}</b></span>` : ''}
          ${statuses.AMBER > 0 ? `<span class="stat-pill" style="border-left: 3px solid ${ragColors.amber};">Amber: <b>${statuses.AMBER}</b></span>` : ''}
          ${statuses.RED > 0 ? `<span class="stat-pill" style="border-left: 3px solid ${ragColors.red};">Red: <b>${statuses.RED}</b></span>` : ''}
          ${statuses.COMPLETED > 0 ? `<span class="stat-pill" style="border-left: 3px solid ${ragColors.completed};">Done: <b>${statuses.COMPLETED}</b></span>` : ''}
          ${statuses.TODO > 0 ? `<span class="stat-pill" style="border-left: 3px solid ${ragColors.todo};">Todo: <b>${statuses.TODO}</b></span>` : ''}
          ${statuses.BLOCKED > 0 ? `<span class="stat-pill" style="border-left: 3px solid #ffffff; background: #09090b;">Blocked: <b>${statuses.BLOCKED}</b></span>` : ''}
          ${(statuses.GREEN + statuses.AMBER + statuses.RED + statuses.COMPLETED + statuses.TODO + statuses.BLOCKED === 0) ? '<span style="font-size: 0.65rem; color: #94a3b8;">No status</span>' : ''}
        </div>
      </div>
    </div>
  `;
}

function render() {
  if (!currentProjects.length) return;

  const filteredProjects = currentProjects.filter(p => 
    selectedPMs.has(p.pm) &&
    selectedSizes.has(p.size) &&
    selectedRags.has(p.rag)
  );

  const colorMode = colorModeSelect.value;
  const currentView = displayModeSelect.value;
  zoomLevelText.textContent = `${Math.round(zoomLevel * 100)}%`;
  zoomOutBtn.disabled = zoomLevel <= minZoom;
  zoomInBtn.disabled = zoomLevel >= maxZoom;

  chartCanvas.style.width = `${zoomLevel * 100}%`;

  if (filteredProjects.length === 0) {
    unifiedRowsLayer.innerHTML = '<div class="empty-state">No projects match the selected filters.</div>';
    return;
  }

  const minRaw = new Date(Math.min(...currentProjects.map(p => p.start)));
  const maxRaw = new Date(Math.max(...currentProjects.map(p => p.end)));

  const calendarStart = new Date(minRaw.getFullYear(), minRaw.getMonth(), 1);
  const calendarEnd = new Date(maxRaw.getFullYear(), maxRaw.getMonth() + 1, 0, 23, 59, 59);
  const totalSpanMs = Math.max(calendarEnd.getTime() - calendarStart.getTime(), 1);

  // Render Calendar Axis with Quarter & Month Statistics
  renderCalendarAxis(calendarStart, calendarEnd, totalSpanMs, filteredProjects);

  // Render Overall PM Column Header Tooltip
  const activePMCount = new Set(filteredProjects.map(p => p.pm)).size;
  overallPmTooltipContainer.innerHTML = generateGenericStatsTooltipHTML(
    'All Project Managers',
    filteredProjects,
    `${activePMCount} Active Project Manager${activePMCount > 1 ? 's' : ''}`
  );

  const pmMap = new Map();
  filteredProjects.forEach(p => {
    if (!pmMap.has(p.pm)) pmMap.set(p.pm, []);
    pmMap.get(p.pm).push(p);
  });

  unifiedRowsLayer.innerHTML = '';

  const activePMsSorted = Array.from(pmMap.keys()).sort((a, b) => a.localeCompare(b));

  activePMsSorted.forEach(pmName => {
    const projects = pmMap.get(pmName);
    const pmColor = pmColorMap.get(pmName) || darkPalette[0];

    const lanes = arrangeInLanes(projects);

    // Unified Row
    const rowEl = document.createElement('div');
    rowEl.className = 'pm-row';

    // Sticky PM Cell with Side-Anchored Hover Tooltip
    const pmCell = document.createElement('div');
    pmCell.className = 'pm-sidebar-cell';
    pmCell.innerHTML = `
      <span class="pm-badge" style="background-color: ${pmColor}"></span>
      <span title="${pmName}">${pmName}</span>
      ${generateGenericStatsTooltipHTML(pmName, projects)}
    `;
    rowEl.appendChild(pmCell);

    // Track Cell
    const trackCell = document.createElement('div');
    trackCell.className = 'pm-track-cell';

    const grid = document.createElement('div');
    grid.className = 'grid-lines-layer';
    renderGridLines(grid, calendarStart, calendarEnd, totalSpanMs);
    trackCell.appendChild(grid);

    lanes.forEach(lane => {
      const subLane = document.createElement('div');
      subLane.className = 'sub-lane';

      if (currentView === 'super-compact') {
        const maxBarHeight = Math.max(...lane.map(p => getBarHeightBySize(p.size)));
        subLane.style.height = `${maxBarHeight + 4}px`;
      } else {
        subLane.style.height = '';
      }

      lane.forEach(proj => {
        const leftPct = Math.max(0, ((proj.start.getTime() - calendarStart.getTime()) / totalSpanMs) * 100);
        const widthPct = Math.max(0.6, ((proj.end.getTime() - proj.start.getTime()) / totalSpanMs) * 100);
        const baseBarHeight = getBarHeightBySize(proj.size);

        const node = document.createElement('div');
        node.className = 'project-node' + (proj.url ? ' clickable' : '');
        node.style.left = `${leftPct}%`;
        node.style.width = `${widthPct}%`;

        const durationDays = Math.round((proj.end.getTime() - proj.start.getTime()) / (1000 * 60 * 60 * 24));
        const ragColor = getRagColor(proj.rag);
        const barBgStyle = getBarStyle(proj, pmColor, colorMode);

        node.innerHTML = `
          <div class="resting-bar" style="${barBgStyle} height: ${baseBarHeight}px;"></div>

          <div class="hover-underlay">
            <div class="underlay-title-row">
              <span>${proj.name}</span>
              ${proj.url ? '<span class="link-icon" title="Open Link">↗ Link</span>' : ''}
            </div>

            <div class="underlay-bar-row">
              <div class="true-length-bar" style="${barBgStyle}"></div>
            </div>

            <div class="underlay-details-row">
              <span class="underlay-pill underlay-size-pill">SIZE: ${proj.size}</span>
              <span>${formatDateDisplay(proj.start)} – ${formatDateDisplay(proj.end)} (${durationDays}d)</span>
              <span class="underlay-pill" style="background-color: ${ragColor}; ${proj.rag === 'BLOCKED' ? 'border: 1px solid rgba(255,255,255,0.4);' : ''}">${proj.rag}</span>
            </div>
          </div>
        `;

        const syncBarWidth = () => {
          const bar = node.querySelector('.true-length-bar');
          if (bar) bar.style.width = `${node.offsetWidth}px`;
        };
        node.addEventListener('mouseenter', syncBarWidth);

        if (proj.url) {
          node.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(proj.url, '_blank', 'noopener,noreferrer');
          });
        }

        subLane.appendChild(node);
      });

      trackCell.appendChild(subLane);
    });

    rowEl.appendChild(trackCell);
    unifiedRowsLayer.appendChild(rowEl);
  });

  requestAnimationFrame(() => {
    document.querySelectorAll('.project-node').forEach(node => {
      const bar = node.querySelector('.true-length-bar');
      if (bar) bar.style.width = `${node.offsetWidth}px`;
    });
  });

  renderTodayLine(calendarStart, calendarEnd, totalSpanMs);
  setTimeout(updateStickyLabels, 50);
}

function renderTodayLine(calendarStart, calendarEnd, totalSpanMs) {
  document.querySelectorAll('.today-line').forEach(el => el.remove());

  const today = new Date();
  if (today >= calendarStart && today <= calendarEnd) {
    const todayLeftPct = ((today.getTime() - calendarStart.getTime()) / totalSpanMs) * 100;
    
    const todayLine = document.createElement('div');
    todayLine.className = 'today-line';
    todayLine.style.left = `calc(${todayLeftPct}% * (1 - ${220}px / 100%) + ${220}px)`;
    todayLine.innerHTML = `<span class="today-badge">Today</span>`;
    
    chartCanvas.appendChild(todayLine);
  }
}

function renderCalendarAxis(start, end, totalSpanMs, activeProjects) {
  quartersRow.innerHTML = '';
  monthsRow.innerHTML = '';

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);

  let currentQuarter = null;
  let quarterStartMs = null;

  while (cursor <= end) {
    const curYear = cursor.getFullYear();
    const curMonth = cursor.getMonth();
    const qNum = Math.floor(curMonth / 3) + 1;
    const qKey = `Q${qNum} ${curYear}`;

    const monthStartMs = cursor.getTime();
    const nextMonthCursor = new Date(curYear, curMonth + 1, 1);
    const monthEndMs = Math.min(nextMonthCursor.getTime(), end.getTime());

    const monthLeft = ((monthStartMs - start.getTime()) / totalSpanMs) * 100;
    const monthWidth = ((monthEndMs - monthStartMs) / totalSpanMs) * 100;

    const monthProjects = activeProjects.filter(p => p.start < nextMonthCursor && p.end >= cursor);

    const mCell = document.createElement('div');
    mCell.className = 'axis-cell';
    mCell.style.left = `${monthLeft}%`;
    mCell.style.width = `${monthWidth}%`;
    mCell.innerHTML = `
      <span>${monthNames[curMonth]} ${zoomLevel > 1.2 ? curYear : ''}</span>
      ${generateGenericStatsTooltipHTML(`${monthNames[curMonth]} ${curYear}`, monthProjects)}
    `;
    monthsRow.appendChild(mCell);

    if (currentQuarter === null) {
      currentQuarter = qKey;
      quarterStartMs = monthStartMs;
    } else if (currentQuarter !== qKey) {
      const quarterProjectsList = activeProjects.filter(p => p.start < cursor && p.end >= new Date(quarterStartMs));
      placeQuarterCell(currentQuarter, quarterStartMs, monthStartMs, start, totalSpanMs, quarterProjectsList);
      currentQuarter = qKey;
      quarterStartMs = monthStartMs;
    }

    cursor = nextMonthCursor;
  }

  if (currentQuarter !== null) {
    const quarterProjectsList = activeProjects.filter(p => p.start <= end && p.end >= new Date(quarterStartMs));
    placeQuarterCell(currentQuarter, quarterStartMs, end.getTime(), start, totalSpanMs, quarterProjectsList);
  }
}

function placeQuarterCell(label, qStartMs, qEndMs, axisStart, totalSpanMs, projects) {
  const qLeft = ((qStartMs - axisStart.getTime()) / totalSpanMs) * 100;
  const qWidth = ((qEndMs - qStartMs) / totalSpanMs) * 100;

  const qCell = document.createElement('div');
  qCell.className = 'axis-cell quarter';
  qCell.style.left = `${qLeft}%`;
  qCell.style.width = `${qWidth}%`;
  qCell.innerHTML = `
    <span>${label}</span>
    ${generateGenericStatsTooltipHTML(label, projects)}
  `;
  quartersRow.appendChild(qCell);
}

function renderGridLines(container, start, end, totalSpanMs) {
  let cursor = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  while (cursor <= end) {
    const left = ((cursor.getTime() - start.getTime()) / totalSpanMs) * 100;
    const line = document.createElement('div');
    line.className = 'grid-line';
    if (cursor.getMonth() % 3 === 0) {
      line.classList.add('quarter-boundary');
    }
    line.style.left = `${left}%`;
    container.appendChild(line);

    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
}