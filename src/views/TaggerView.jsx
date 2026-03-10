import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import "../style/taggerView.css"

//! VISTA DEL ETIQUETADOR
export default function TaggerView() {
	//* Parámetros de la URL y navegación
	const { fileName, modelName } = useParams();
	const navigate = useNavigate();

	//* ESTADOS DE LA VISTA
	//? Datos de la sesión (el JSON de la transcripción)
	const [data, setData] = useState(null);
	//? Configuración del modelo (etiquetas, colores, etc.)
	const [model, setModel] = useState(null);
	//? Línea seleccionada actualmente
	const [currentLineIdx, setCurrentLineIdx] = useState(1);
	//? Texto resaltado por el ratón
	const [selectedText, setSelectedText] = useState("");
	//? Índices de inicio y fin de la selección
	const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });

	//* Cargar datos iniciales (Archivo JSON + Modelo)
	useEffect(() => {
		async function loadData() {
			//? Obtiene el JSON del texto procesado y el JSON del modelo de etiquetas
			const interviewRes = await window.taggingAPI.getJsonData(fileName);
			const modelRes = await window.createModelAPI.getModelToEdit(modelName);

			if (interviewRes) setData(interviewRes);
			if (modelRes.success) setModel(modelRes.data);
		}
		loadData();
	}, [fileName, modelName]);

	//* Captura el texto seleccionado con el ratón
	const handleSelection = () => {
		const selection = window.getSelection();
		const text = selection.toString();
		if (text.trim()) {
			setSelectedText(text);

			//? Obtiene la posición (offset) exacta dentro del contenedor de texto
			//? (Parte de la línea empieza y termina el tag)
			const range = selection.getRangeAt(0);
			setSelectionRange({
				start: range.startOffset,
				end: range.endOffset
			});
		}
	};

	//* Añade un tag a la línea actual
	//? type: 'attributes', 'categories' o 'entities'
	//? groupName: El grupo al que pertenece (ej: "Lugar", "Pueblo")
	//? subValue: El valor específico (ej: "Santa Brígida")
	const addTag = (type, groupName, subValue) => {
		if (!selectedText) {
			alert("Selecciona primero un fragmento de texto");
			return;
		}

		const updatedData = { ...data };

		//? Crea el nuevo objeto de etiqueta con ID único (timestamp)
		const newTag = {
			id: Date.now(),
			type: groupName,
			value: subValue,
			text: selectedText,
			start: selectionRange.start,
			end: selectionRange.end
		};

		//? Inicializa el array si es la primera etiqueta de ese tipo en la línea
		if (!updatedData[currentLineIdx][type]) {
			updatedData[currentLineIdx][type] = [];
		}

		updatedData[currentLineIdx][type].push(newTag);
		//? Actualiza el estado local
		setData(updatedData);
	};

	//* Elimina una etiqueta específica buscando por su ID
	const removeTag = (type, tagId) => {
		const updatedData = { ...data };
		updatedData[currentLineIdx][type] = updatedData[currentLineIdx][type].filter(tag => tag.id !== tagId);
		setData(updatedData);
	};

	//* Genera un archivo TXT con las etiquetas como <TAG>... </TAG>
	const handleExportTxt = async () => {
		let txt = "";
		Object.keys(data).forEach(idx => {
			const lineData = data[idx];
			const lineAttributes = lineData.attributes || [];
			const lineCategories = lineData.categories || [];
			const lineEntities = lineData.entities || [];

			//? Limpia el código de hablante (ej: "E_1: ") para procesar solo el texto
			let lineText = lineData.line.replace(/^[EI]_\d*[:\s]*/, '').trim();

			//? Crea eventos de "apertura" y "cierre" para cada tag para poder insertarlos en orden
			const events = [];
			const tags = [
				...lineCategories.map(c => ({ ...c, kind: 'category' })),
				...lineEntities.map(e => ({ ...e, kind: 'entity' }))
			];

			tags.forEach(tag => {
				events.push({ type: 'open', pos: tag.start, tag });
				events.push({ type: 'close', pos: tag.end, tag });
			});

			//? Ordena los eventos para que los tags anidados se cierren en el orden correcto
			events.sort((a, b) => {
				if (a.pos !== b.pos) return a.pos - b.pos;
				if (a.type !== b.type) return a.type === 'close' ? -1 : 1;
				if (a.type === 'open') {
					if (a.tag.end !== b.tag.end) return b.tag.end - a.tag.end;
					return a.tag.value.localeCompare(b.tag.value);
				} else {
					if (a.tag.start !== b.tag.start) return b.tag.start - a.tag.start;
					return b.tag.value.localeCompare(a.tag.value);
				}
			});

			let result = "";
			let lastPos = 0;
			//? Recorre los eventos y va construyendo el string con los <tags>
			events.forEach(ev => {
				result += lineText.slice(lastPos, ev.pos);
				if (ev.type === 'open') {
					//? Si tiene atributos asociados en la misma posición, los añade al tag: <Tag attr="val">
					const relatedAttrs = lineAttributes.filter(a => a.start === ev.tag.start && a.end === ev.tag.end);
					const attrStr = relatedAttrs.length > 0 ? (ev.tag.kind === 'category' ? '; ' : '') + relatedAttrs.map(a => `${a.type}="${a.value}"`).join('; ') : "";
					result += `<${ev.tag.value}${attrStr}>`;
				} else {
					result += `</${ev.tag.value}>`;
				}
				lastPos = ev.pos;
			});
			result += lineText.slice(lastPos);
			lineText = result;

			//? Recupera el hablante original para el formato final "E_1: Texto..."
			const speaker = lineData.line.match(/^[EI]_\d*/)?.[0] || (lineData.Interviewer ? 'E' : 'I');
			txt += `${speaker}: ${lineText}\n`;
		});

		//? Llama a la API (proceso Main) para guardar el archivo
		const res = await window.taggingAPI.exportToTxt(fileName.replace('.json', '') + ".txt", txt);
		if (res.success) { alert("Archivo TXT exportado con éxito"); }
	};

	//* Obtiene el color de una etiqueta consultando la configuración del modelo
	const getTagColor = (type, groupOrCatName, valueName) => {
		if (!model) return "#94a3b8";

		if (type === 'categories') {
			const cat = model[2].categories.find(c => c.name === groupOrCatName);
			return cat ? cat.color : "#94a3b8";
		}

		if (type === 'attributes') {
			const attrConfig = model[1].attributes.find(g => Object.keys(g)[0] === groupOrCatName);
			if (attrConfig) {
				const groupData = attrConfig[groupOrCatName];
				const valueConfig = groupData.values.find(v => v.name === valueName);
				return valueConfig ? (valueConfig.color || groupData.color) : groupData.color;
			}
			return "#94a3b8";
		}

		if (type === 'entities') {
			const entGroup = model[3].entities.find(g => g.values.find(v => v.name === valueName));
			return entGroup ? entGroup.color : "#94a3b8";
		}

		return "#94a3b8";
	};

	//* Genera un reporte HTML interactivo completo
	const handleExportHtml = async () => {
		//? Recolecta todas las combinaciones de etiquetas únicas para generar los filtros laterales
		const allAttributes = new Set();
		const allCategories = new Set();
		const allEntities = new Set();

		Object.values(data).forEach(line => {
			line.attributes?.forEach(tag => allAttributes.add(`${tag.type}: ${tag.value}`));
			line.categories?.forEach(tag => allCategories.add(`${tag.type}: ${tag.value}`));
			line.entities?.forEach(tag => allEntities.add(`${tag.type}: ${tag.value}`));
		});

		let html = `
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

		/* Tooltips */
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
`;

		Object.keys(data).forEach(idx => {
			const lineData = data[idx];
			const lineAttributes = lineData.attributes || [];
			const lineCategories = lineData.categories || [];
			const lineEntities = lineData.entities || [];

			const rawText = lineData.line.replace(/^[EI]_\d*[:\s]*/, '').trim();

			// Procesar todas las etiquetas como eventos (Apertura/Cierre)
			const events = [];
			const tags = [
				...lineCategories.map(c => ({ ...c, kind: 'category' })),
				...lineEntities.map(e => ({ ...e, kind: 'entity' }))
			];

			tags.forEach(tag => {
				events.push({ type: 'open', pos: tag.start, tag });
				events.push({ type: 'close', pos: tag.end, tag });
			});

			events.sort((a, b) => {
				if (a.pos !== b.pos) return a.pos - b.pos;
				if (a.type !== b.type) return a.type === 'close' ? -1 : 1;
				if (a.type === 'open') {
					if (a.tag.end !== b.tag.end) return b.tag.end - a.tag.end;
					return a.tag.value.localeCompare(b.tag.value);
				} else {
					if (a.tag.start !== b.tag.start) return b.tag.start - a.tag.start;
					return b.tag.value.localeCompare(a.tag.value);
				}
			});

			let processedText = "";
			let lastPos = 0;
			events.forEach(ev => {
				processedText += rawText.slice(lastPos, ev.pos);
				if (ev.type === 'open') {
					const color = getTagColor(ev.tag.kind === 'category' ? 'categories' : 'entities', ev.tag.type, ev.tag.value);
					const relatedAttrs = lineAttributes.filter(a => a.start === ev.tag.start && a.end === ev.tag.end);
					const tooltip = [
						`[${ev.tag.kind === 'category' ? 'CAT' : 'ENT'}] ${ev.tag.type}: ${ev.tag.value}`,
						...relatedAttrs.map(a => `${a.type}: ${a.value}`)
					].join('\n');

					const style = ev.tag.kind === 'category'
						? `background-color: ${color}44; color: white;`
						: `border-color: ${color};`;

					processedText += `<span class="tag-highlight ${ev.tag.kind}" style="${style}" title="${tooltip}">`;
				} else {
					processedText += `</span>`;
				}
				lastPos = ev.pos;
			});
			processedText += rawText.slice(lastPos);

			const lineTagsForFilter = [...lineAttributes, ...lineCategories, ...lineEntities].map(t => `${t.type}: ${t.value}`);

			html += `
		<div class="line-card" data-tags="${JSON.stringify(lineTagsForFilter).replace(/"/g, '&quot;')}" id="line-${idx}">
			<div class="speaker-meta">
				<span>#${idx}</span>
				<span style="color: ${lineData.Interviewer ? '#ef4444' : '#38bdf8'}; font-weight: 800;">${lineData.line.match(/^[EI]_\d*/)?.[0] || (lineData.Interviewer ? 'E' : 'I')}</span>
			</div>
			<div class="text-body">${processedText}</div>
		</div>`;
		});

		html += `
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

		const res = await window.taggingAPI.exportToHtml(fileName, html);
		if (res.success) alert("HTML exportado: " + res.filePath);
	};

	if (!data || !model) return <div className="loader">Cargando...</div>;

	//* Variables auxiliares para la línea actual y configuración
	const currentLine = data[currentLineIdx];
	const attributesConfig = model[1].attributes;
	const categoriesConfig = model[2].categories;
	const entitiesConfig = model[3]?.entities || [];

	return (
		<div className="tagger-wrapper">
			{/* CABECERA: Título y acciones globales */}
			<header className="tagger-header">
				<button className="btn-back" onClick={() => navigate('/')}>← Volver</button>
				<h2>{fileName}</h2>
				<div className="header-actions">
					<button className="btn-save-session-mini" onClick={() => window.taggingAPI.saveCurrentProgress(fileName, data)}>Guardar</button>
					<button className="btn-export-html" onClick={handleExportHtml}>Exportar HTML</button>
					<button className="btn-export-txt" onClick={handleExportTxt} style={{ background: 'transparent', border: '1px solid #444', color: '#ccc', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>Exportar TXT</button>
				</div>
			</header>

			<main className="tagger-main-layout">
				{/* --- COLUMNA IZQUIERDA: RESUMEN DE LA LÍNEA SELECCIONADA --- */}
				<aside className="info-column">
					<div className="sticky-info">
						{/* Tipo de hablante */}
						<div className="speaker-badge">
							{currentLine.Interviewer ? "🎙️ Entrevistador" : "👤 Entrevistado"}
						</div>

						{/* Listado de etiquetas ya aplicadas a esta línea */}
						<div className="tags-summary-vertical">
							<div className="summary-section">
								<h4>Atributos</h4>
								{currentLine.attributes?.length === 0 && <p className="empty-msg">Sin atributos</p>}
								{currentLine.attributes?.map(tag => (
									<div key={tag.id} className="summary-item attr-item" style={{ borderLeft: `3px solid ${getTagColor('attributes', tag.type, tag.value)}` }}>
										<div className="summary-item-header">
											<strong>{tag.type}</strong>
											<button className="btn-delete-tag" onClick={() => removeTag('attributes', tag.id)} title="Eliminar etiqueta">×</button>
										</div>
										<span className="tagged-text">"{tag.text}"</span>
										<span className="tag-value">→ {tag.value}</span>
									</div>
								))}
							</div>

							<div className="summary-section">
								<h4>Categorías</h4>
								{currentLine.categories?.length === 0 && <p className="empty-msg">Sin categorías</p>}
								{currentLine.categories?.map(tag => (
									<div key={tag.id} className="summary-item cat-item" style={{ borderLeft: `3px solid ${getTagColor('categories', tag.type)}` }}>
										<div className="summary-item-header">
											<strong>{tag.type}</strong>
											<button className="btn-delete-tag" onClick={() => removeTag('categories', tag.id)} title="Eliminar etiqueta">×</button>
										</div>
										<span className="tagged-text">"{tag.text}"</span>
										<span className="tag-value">→ {tag.value}</span>
									</div>
								))}
							</div>

							<div className="summary-section">
								<h4>Entidades</h4>
								{(!currentLine.entities || currentLine.entities.length === 0) && <p className="empty-msg">Sin entidades</p>}
								{currentLine.entities?.map(tag => (
									<div key={tag.id} className="summary-item ent-item" style={{ borderLeft: `3px solid ${getTagColor('entities', tag.type, tag.value)}` }}>
										<div className="summary-item-header">
											<strong>{tag.type}</strong>
											<button className="btn-delete-tag" onClick={() => removeTag('entities', tag.id)} title="Eliminar etiqueta">×</button>
										</div>
										<span className="tagged-text">"{tag.text}"</span>
										<span className="tag-value">→ {tag.value}</span>
									</div>
								))}
							</div>
						</div>

						{/* Muestra el texto que el usuario ha seleccionado con el ratón */}
						{selectedText && (
							<div className="selection-info-card">
								<h4>Texto Seleccionado</h4>
								<p className="selected-snippet">"{selectedText}"</p>
								<button className="btn-clear-selection" onClick={() => setSelectedText("")}>Limpiar</button>
							</div>
						)}
					</div>
				</aside>

				{/* --- COLUMNA CENTRAL: TODAS LAS LÍNEAS (VISTA DOCUMENTO) --- */}
				<div className="document-column" onMouseUp={handleSelection}>
					<div className="document-view">
						{(() => {
							return Object.keys(data).map((idx) => {
								const lineData = data[idx];
								const isInterviewer = lineData.Interviewer;

								//? Extrae el código del hablante (E_1, I_2...) o usa E/I por defecto
								const match = lineData.line.match(/^([EI]_\d*)[:\s]*/);
								const speakerCode = match ? match[1] : (isInterviewer ? 'E' : 'I');

								const cleanText = lineData.line.replace(/^[EI]_\d*[:\s]*/, '').trim();
								const isSelected = parseInt(idx) === currentLineIdx;

								return (
									<div
										key={idx}
										className={`document-line ${isSelected ? 'selected' : ''} ${isInterviewer ? 'interviewer-row' : 'interviewee-row'}`}
										onClick={() => setCurrentLineIdx(parseInt(idx))}
									>
										<div className="line-meta">
											<span className="line-number">{idx}</span>
											<span className={`speaker-code ${isInterviewer ? 'code-e' : 'code-i'}`}>{speakerCode}</span>
										</div>
										<div className="line-content">
											<p className="line-text-mini">{cleanText}</p>
											{/* Preview de etiquetas aplicadas en esta línea específica */}
											<div className="line-tags-preview">
												{lineData.attributes?.map(t => <span key={t.id} className="mini-tag attr" style={{ backgroundColor: getTagColor('attributes', t.type, t.value) + '33', color: getTagColor('attributes', t.type, t.value) }}>{t.value}</span>)}
												{lineData.categories?.map(t => <span key={t.id} className="mini-tag cat" style={{ backgroundColor: getTagColor('categories', t.type) + '33', color: getTagColor('categories', t.type) }}>{t.value}</span>)}
												{lineData.entities?.map(t => <span key={t.id} className="mini-tag ent" style={{ backgroundColor: getTagColor('entities', t.type, t.value) + '33', color: getTagColor('entities', t.type, t.value) }}>{t.value}</span>)}
											</div>
										</div>
									</div>
								);
							});
						})()}
					</div>
				</div>

				{/* --- COLUMNA DERECHA: BOTONERA DE TAGS PARA APLICAR LAS ETIQUETAS --- */}
				<aside className="controls-column">
					<div className="tag-controls">
						<div className="control-section">
							<h3>Atributos</h3>
							{attributesConfig.map((group) => {
								const name = Object.keys(group)[0];
								const groupData = group[name];
								return (
									<div key={name} className="tag-group">
										<span className="group-title" style={{ color: groupData.color }}>{name}</span>
										<div className="button-grid">
											{groupData.values.map(sub => (
												<button key={sub.id} className="btn-tag-attr" style={{ borderColor: sub.color || groupData.color, color: sub.color || groupData.color }} onClick={() => addTag('attributes', name, sub.name)}>
													{sub.name}
												</button>
											))}
										</div>
									</div>
								);
							})}
						</div>

						<div className="control-section">
							<h3>Entidades</h3>
							{entitiesConfig.map((group, i) => {
								return (
									<div key={i} className="tag-group">
										<div className="button-grid">
											{group.values.map(val => (
												<button key={val.id} className="btn-tag-ent" style={{ borderColor: group.color, color: group.color }} onClick={() => addTag('entities', val.name, val.name)}>
													{val.name}
												</button>
											))}
										</div>
									</div>
								);
							})}
						</div>

						<div className="control-section">
							<h3>Categorías</h3>
							{categoriesConfig.map(cat => (
								<div key={cat.id} className="tag-group">
									<span className="group-title" style={{ color: cat.color }}>{cat.name}</span>
									<div className="button-grid">
										{cat.subCategories.map(sub => (
											<button key={sub.id} className="btn-tag-cat" style={{ borderColor: cat.color, color: cat.color }} onClick={() => addTag('categories', cat.name, sub.name)}>
												{sub.name}
											</button>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				</aside>
			</main>
		</div>
	);
}
