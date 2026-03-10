import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import "../style/taggerView.css"
import { getTagColor } from '../utils/tagUtils.js';
import { processLineTags, formatTxtOpen, formatTxtClose } from '../utils/exportLogic.js';
import { generateHtmlReport } from '../utils/htmlExporter.js';

//! VISTA DEL ETIQUETADOR
// LO QUE TE
// 
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
	//? Controla la visibilidad del aviso de guardado
	const [showSaveToast, setShowSaveToast] = useState(false);
	//? Índice de la línea que se está editando
	const [editingLineIdx, setEditingLineIdx] = useState(null);
	//? Texto temporal mientras se edita la línea
	const [tempEditText, setTempEditText] = useState("");

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

	//* Guarda el progreso actual y muestra una notificación
	const handleSaveSession = async () => {
		const res = await window.taggingAPI.saveCurrentProgress(fileName, data);
		if (res.success) {
			setShowSaveToast(true);
			//? Oculta la notificación después de 3 segundos
			setTimeout(() => setShowSaveToast(false), 3000);
		} else {
			alert("Error al guardar la sesión: " + res.error);
		}
		// No quiero nTener que hacer eso, Imaginate lo que se puede hacer
	};

	//* Inicia la edición de una línea
	const handleStartEdit = (idx, text) => {
		setEditingLineIdx(idx);
		setTempEditText(text);
	};

	//* Guarda los cambios en el texto de una línea
	const handleSaveEdit = (idx) => {
		const updatedData = { ...data };
		//? Mantenemos el hablante original si existe
		const speakerMatch = updatedData[idx].line.match(/^([EI]_\d*)[:\s]*/);
		const speakerCode = speakerMatch ? speakerMatch[0] + ": " : "";

		updatedData[idx].line = speakerCode + tempEditText;
		setData(updatedData);
		setEditingLineIdx(null);
	};

	//* Cancela la edición
	const handleCancelEdit = () => {
		setEditingLineIdx(null);
		setTempEditText("");
	};

	//* Genera un archivo TXT con las etiquetas como <TAG>... </TAG>
	const handleExportTxt = async () => {
		let txt = "";
		Object.keys(data).forEach(idx => {
			const lineData = data[idx];
			const speakerMatch = lineData.line.match(/^[EI]_\d*/);
			const speaker = speakerMatch ? speakerMatch[0] : (lineData.Interviewer ? 'E' : 'I');
			
			const lineText = processLineTags(lineData, formatTxtOpen, formatTxtClose);
			txt += `${speaker}: ${lineText}\n`;
		});

		//? Llama a la API (proceso Main) para guardar el archivo
		const res = await window.taggingAPI.exportToTxt(fileName.replace('.json', '') + ".txt", txt);
		if (res.success) { alert("Archivo TXT exportado con éxito"); }
	};

	//* Exporta la sesión actual a JSON para poder cargarla después
	const handleExportJson = async () => {
		const res = await window.taggingAPI.exportToJson(fileName + ".json", data);
		if (res.success) {
			setShowSaveToast(true); // Reutilizamos el brindis para éxito
		} else if (!res.canceled) {
			alert("Error al exportar JSON: " + res.error);
		}
	};

	//* Genera un reporte HTML interactivo completo
	const handleExportHtml = async () => {
		const html = generateHtmlReport(fileName, data, model);
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
					<button className="btn-save-session-mini" onClick={handleSaveSession}>Guardar</button>
					<button className="btn-export-html" onClick={handleExportHtml}>Exportar HTML</button>
					<button className="btn-export-txt" onClick={handleExportTxt} style={{ background: 'transparent', border: '1px solid #444', color: '#ccc', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>Exportar TXT</button>
					<button className="btn-export-json" onClick={handleExportJson} style={{ background: 'rgba(157, 80, 187, 0.1)', border: '1px solid var(--neon-purple)', color: 'var(--neon-purple)', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold' }}>Exportar JSON</button>
				</div>
			</header>

			<main className="tagger-main-layout">
				{/* COLUMNA IZQUIERDA */}
				<aside className="info-column">
					<div className="sticky-info">
						{/* SPEAKER */}
						<div className="speaker-badge">
							{currentLine.Interviewer ? "🎙️ Entrevistador" : "👤 Entrevistado"}
						</div>

						{/* INFO DE LA LÍNEA (TAGS) */}
						<div className="tags-summary-vertical">
							<div className="summary-section">
								<h4>Atributos</h4>
								{currentLine.attributes?.length === 0 && <p className="empty-msg">Sin atributos</p>}
								{currentLine.attributes?.map(tag => (
									<div key={tag.id} className="summary-item attr-item" style={{ borderLeft: `3px solid ${getTagColor('attributes', tag.type, tag.value, model)}` }}>
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
								<h4>Entidades</h4>
								{(!currentLine.entities || currentLine.entities.length === 0) && <p className="empty-msg">Sin entidades</p>}
								{currentLine.entities?.map(tag => (
									<div key={tag.id} className="summary-item ent-item" style={{ borderLeft: `3px solid ${getTagColor('entities', tag.type, tag.value, model)}` }}>
										<div className="summary-item-header">
											<strong>{tag.type}</strong>
											<button className="btn-delete-tag" onClick={() => removeTag('entities', tag.id)} title="Eliminar etiqueta">×</button>
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
									<div key={tag.id} className="summary-item cat-item" style={{ borderLeft: `3px solid ${getTagColor('categories', tag.type, null, model)}` }}>
										<div className="summary-item-header">
											<strong>{tag.type}</strong>
											<button className="btn-delete-tag" onClick={() => removeTag('categories', tag.id)} title="Eliminar etiqueta">×</button>
										</div>
										<span className="tagged-text">"{tag.text}"</span>
										<span className="tag-value">→ {tag.value}</span>
									</div>
								))}
							</div>

						</div>

						{/* TEXTO SELECCIONADO */}
						{selectedText && (
							<div className="selection-info-card">
								<h4>Texto Seleccionado</h4>
								<p className="selected-snippet">"{selectedText}"</p>
								<button className="btn-clear-selection" onClick={() => setSelectedText("")}>Limpiar</button>
							</div>
						)}
					</div>
				</aside>

				{/* COLUMNA CENTRAL */}
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
											{editingLineIdx === parseInt(idx) ? (
												<div className="edit-container" onClick={(e) => e.stopPropagation()}>
													<textarea 
														className="edit-textarea"
														value={tempEditText}
														onChange={(e) => setTempEditText(e.target.value)}
														autoFocus
													/>
													<div className="edit-actions">
														<button className="btn-save-edit" onClick={() => handleSaveEdit(idx)} title="Guardar">✔️</button>
														<button className="btn-cancel-edit" onClick={handleCancelEdit} title="Cancelar">❌</button>
													</div>
												</div>
											) : (
												<>
													<p className="line-text-mini">{cleanText}</p>
													<button className="btn-edit-line" onClick={(e) => { e.stopPropagation(); handleStartEdit(parseInt(idx), cleanText); }} title="Editar texto">✏️</button>
												</>
											)}
											{/* TAGS APLICADOS A LA LINEA DEBAJO DEL TEXTO */}
											<div className="line-tags-preview">
												{lineData.attributes?.map(t => <span key={t.id} className="mini-tag attr" style={{ backgroundColor: getTagColor('attributes', t.type, t.value, model) + '33', color: getTagColor('attributes', t.type, t.value, model) }}>{t.value}</span>)}
												{lineData.categories?.map(t => <span key={t.id} className="mini-tag cat" style={{ backgroundColor: getTagColor('categories', t.type, null, model) + '33', color: getTagColor('categories', t.type, null, model) }}>{t.value}</span>)}
												{lineData.entities?.map(t => <span key={t.id} className="mini-tag ent" style={{ backgroundColor: getTagColor('entities', t.type, t.value, model) + '33', color: getTagColor('entities', t.type, t.value, model) }}>{t.value}</span>)}
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

			{/* Notificación de guardado */}
			{showSaveToast && (
				<div className="save-toast">
					<span className="toast-icon">💾</span>
					Sesión guardada correctamente
				</div>
			)}
		</div>
	);
}
