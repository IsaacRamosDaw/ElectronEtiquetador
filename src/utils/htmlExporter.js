import { getTagColor } from './tagUtils.js';
import { processLineTags } from './exportLogic.js';

/**
 * Genera el reporte HTML interactivo.
 */
export const generateHtmlReport = (fileName, data, model) => {
    //? Recolecta todas las combinaciones de etiquetas únicas para generar los filtros laterales
    const allAttributes = new Set();
    const allCategories = new Set();
    const allEntities = new Set();

    Object.values(data).forEach(line => {
        line.attributes?.forEach(tag => allAttributes.add(`${tag.type}: ${tag.value}`));
        line.categories?.forEach(tag => allCategories.add(`${tag.type}: ${tag.value}`));
        line.entities?.forEach(tag => allEntities.add(`${tag.type}: ${tag.value}`));
    });

    const formatHtmlOpen = (tag, relatedAttrs) => {
        const color = getTagColor(tag.kind === 'category' ? 'categories' : 'entities', tag.type, tag.value, model);
        const tooltip = [
            `[${tag.kind === 'category' ? 'CAT' : 'ENT'}] ${tag.type}: ${tag.value}`,
            ...relatedAttrs.map(a => `${a.type}: ${a.value}`)
        ].join('\n');

        const style = tag.kind === 'category'
            ? `background-color: ${color}44; color: white;`
            : `border-color: ${color};`;

        return `<span class="tag-highlight ${tag.kind}" style="${style}" title="${tooltip}">`;
    };

    const formatHtmlClose = () => `</span>`;

    let bodyContent = "";
    Object.keys(data).forEach(idx => {
        const lineData = data[idx];
        const processedText = processLineTags(lineData, formatHtmlOpen, formatHtmlClose);
        
        const lineTagsForFilter = [
            ...(lineData.attributes || []),
            ...(lineData.categories || []),
            ...(lineData.entities || [])
        ].map(t => `${t.type}: ${t.value}`);

        const speakerMatch = lineData.line.match(/^[EI]_\d*/);
        const speaker = speakerMatch ? speakerMatch[0] : (lineData.Interviewer ? 'E' : 'I');

        bodyContent += `
        <div class="line-card" data-tags='${JSON.stringify(lineTagsForFilter).replace(/'/g, '&apos;')}' id="line-${idx}">
            <div class="speaker-meta">
                <span>#${idx}</span>
                <span style="color: ${lineData.Interviewer ? '#ef4444' : '#38bdf8'}; font-weight: 800;">${speaker}</span>
            </div>
            <div class="text-body">${processedText}</div>
        </div>`;
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reporte: ${fileName}</title>
    <style>
        :root {
            --bg-dark: #0f172a;
            --card-bg: #1e293b;
            --text-main: #f1f5f9;
            --text-muted: #94a3b8;
            --primary: #38bdf8;
        }
        body { 
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            margin: 0;
            display: flex;
            background: var(--bg-dark); 
            color: var(--text-main); 
            height: 100vh;
            overflow: hidden;
        }
        .main-content { flex: 1; overflow-y: auto; padding: 50px; scroll-behavior: smooth; }
        .sidebar {
            width: 320px;
            background: var(--card-bg);
            border-left: 1px solid #334155;
            padding: 24px;
            overflow-y: auto;
        }
        .line-card {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
            border: 1px solid #334155;
            transition: all 0.3s;
            position: relative;
        }
        .line-card.highlighted {
            border-color: #fbbf24;
            box-shadow: 0 0 20px rgba(251, 191, 36, 0.1);
            transform: scale(1.01);
        }
        .speaker-meta {
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--text-muted);
            margin-bottom: 12px;
            display: flex;
            gap: 12px;
            align-items: center;
        }
        .speaker-meta span { opacity: 0.8; }
        .text-body {
            font-size: 1.15rem;
            line-height: 1.8;
            color: #e2e8f0;
        }
        
        /* Estilos embebidos */
        .tag-highlight {
            padding: 2px 4px;
            border-radius: 4px;
            cursor: help;
            transition: all 0.2s;
            border-bottom: 2px solid transparent;
        }
        .tag-highlight.category {
            background: rgba(255, 255, 255, 0.1);
        }
        .tag-highlight.entity {
            font-weight: 700;
            border-bottom-width: 2px;
            border-bottom-style: solid;
        }
        .tag-highlight:hover {
            background: rgba(255, 255, 255, 0.2);
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        [title] { position: relative; }
        
        .sidebar h2 { font-size: 1.5rem; margin-top: 0; background: linear-gradient(to right, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .filter-section h3 { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; margin-top: 30px; letter-spacing: 0.05em; border-bottom: 1px solid #334155; padding-bottom: 8px; }
        .filter-list { list-style: none; padding: 0; }
        .filter-item {
            padding: 10px 14px;
            margin: 8px 0;
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.85rem;
            display: flex;
            justify-content: space-between;
            transition: 0.2s;
        }
        .filter-item:hover { border-color: var(--primary); background: #1e293b; }
        .filter-item.active { background: var(--primary); border-color: var(--primary); color: #0f172a; }
        .count { font-size: 0.7rem; opacity: 0.6; }
        .btn-all { width: 100%; padding: 12px; background: #334155; color: white; border: none; border-radius: 8px; cursor: pointer; margin-bottom: 20px; font-weight: 600; }
        .btn-all:hover { background: #475569; }
    </style>
</head>
<body>
    <div class="main-content">
        <h1>Reporte de Etiquetado: ${fileName}</h1>
        <hr style="border: 0; border-top: 1px solid #334155; margin: 30px 0;"/>
        ${bodyContent}
    </div>
    <aside class="sidebar">
        <h2>Filtros</h2>
        <button class="btn-all" onclick="resetFilters()">Mostrar todo</button>

        <div class="filter-section">
            <h3>Atributos</h3>
            <ul class="filter-list">
                ${Array.from(allAttributes).sort().map(tag => `
                    <li class="filter-item" onclick="toggleFilter(this, '${tag}')">
                        <span>${tag.split(': ')[0]}</span>
                        <span class="count">${tag.split(': ')[1]}</span>
                    </li>
                `).join('')}
            </ul>
        </div>

        <div class="filter-section">
            <h3>Categorías</h3>
            <ul class="filter-list">
                ${Array.from(allCategories).sort().map(tag => `
                    <li class="filter-item" onclick="toggleFilter(this, '${tag}')">
                        <span>${tag.split(': ')[0]}</span>
                        <span class="count">${tag.split(': ')[1]}</span>
                    </li>
                `).join('')}
            </ul>
        </div>

        <div class="filter-section">
            <h3>Entidades</h3>
            <ul class="filter-list">
                ${Array.from(allEntities).sort().map(tag => `
                    <li class="filter-item" onclick="toggleFilter(this, '${tag}')">
                        <span>${tag.split(': ')[0]}</span>
                        <span class="count">${tag.split(': ')[1]}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    </aside>

    <script>
        function toggleFilter(el, tag) {
            const isActive = el.classList.contains('active');
            document.querySelectorAll('.filter-item').forEach(item => item.classList.remove('active'));
            
            if (!isActive) {
                el.classList.add('active');
                applyFilter(tag);
            } else {
                resetFilters();
            }
        }

        function applyFilter(tag) {
            const cards = document.querySelectorAll('.line-card');
            cards.forEach(card => {
                const tags = JSON.parse(card.getAttribute('data-tags'));
                if (tags.includes(tag)) {
                    card.classList.add('highlighted');
                    card.style.opacity = '1';
                } else {
                    card.classList.remove('highlighted');
                    card.style.opacity = '0.3';
                }
            });
        }

        function resetFilters() {
            document.querySelectorAll('.filter-item').forEach(item => item.classList.remove('active'));
            document.querySelectorAll('.line-card').forEach(card => {
                card.classList.remove('highlighted');
                card.style.opacity = '1';
            });
        }
    </script>
</body>
</html>`;
};
