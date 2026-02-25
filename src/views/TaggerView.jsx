import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import "../style/taggerView.css"

export default function TaggerView() {
	const { fileName, modelName } = useParams();
	const navigate = useNavigate();

	const [data, setData] = useState(null);
	const [model, setModel] = useState(null);
	const [currentLineIdx, setCurrentLineIdx] = useState(1);
	const [selectedText, setSelectedText] = useState("");

	useEffect(() => {
		async function loadData() {
			const interviewRes = await window.taggingAPI.getJsonData(fileName);
			const modelRes = await window.createModelAPI.getModelToEdit(modelName);
			if (interviewRes) setData(interviewRes);
			if (modelRes.success) setModel(modelRes.data);
		}
		loadData();
	}, [fileName, modelName]);

	const handleSelection = () => {
		const text = window.getSelection().toString();
		if (text.trim()) setSelectedText(text);
	};

	const addTag = (type, groupName, subValue) => {
		if (!selectedText) {
			alert("Selecciona primero un fragmento de texto");
			return;
		}

		const updatedData = { ...data };
		const newTag = {
			id: Date.now(),
			type: groupName,
			value: subValue,
			text: selectedText
		};

		updatedData[currentLineIdx][type].push(newTag);
		setData(updatedData);
		setSelectedText(""); // Reset selección
		window.getSelection().removeAllRanges(); // Limpiar visualmente
	};

	if (!data || !model) return <div className="loader">Cargando...</div>;

	const currentLine = data[currentLineIdx];
	const attributesConfig = model[1].attributes;
	const categoriesConfig = model[2].categories;

	return (
		<div className="tagger-wrapper">
			<header className="tagger-header">
				<button className="btn-back" onClick={() => navigate('/')}>← Volver</button>
				<h2>Etiquetador<span>: {fileName}</span></h2>
				<div className="progress-pill">Línea {currentLineIdx} / {Object.keys(data).length}</div>
			</header>

			<main className="tagger-main-layout">
				{/* IZQUIERDA: ÁREA DE LECTURA */}
				<div className="text-column">
					<div className="text-card" onMouseUp={handleSelection}>
						<div className="speaker-label">
							{currentLine.Interviewer ? "🎙️ Entrevistador" : "👤 Entrevistado"}
						</div>
						<p className="line-text">{currentLine.line}</p>
						{selectedText && <div className="selection-preview">Selección: "{selectedText}"</div>}
					</div>

					{/* EL DIV DE DEBAJO (Tus etiquetas aplicadas a esta línea) */}
					<div className="tags-summary-panel">
						<div className="summary-column">
							<h4>Atributos Aplicados</h4>
							{currentLine.attributes.map(tag => (
								<div key={tag.id} className="summary-item attr-item">
									<strong>{tag.type}</strong>
									<span className="tagged-text">"{tag.text}"</span>
									<span style={{ fontSize: '0.8rem', color: '#555' }}>→ {tag.value}</span>
								</div>
							))}
						</div>
						<div className="summary-column">
							<h4>Categorías Aplicadas</h4>
							{currentLine.categories.map(tag => (
								<div key={tag.id} className="summary-item cat-item">
									<strong>{tag.type}</strong>
									<span className="tagged-text">"{tag.text}"</span>
									<span style={{ fontSize: '0.8rem', color: '#555' }}>→ {tag.value}</span>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* DERECHA: BOTONERA DE TAGS */}
				<aside className="controls-column">
					<div className="tag-controls">
						<div className="control-section">
							<h3>Atributos</h3>
							{attributesConfig.map((group) => {
								const name = Object.keys(group)[0];
								return (
									<div key={name} className="tag-group">
										<span className="group-title">{name}</span>
										<div className="button-grid">
											{group[name].map(sub => (
												<button key={sub.id} className="btn-tag-attr" onClick={() => addTag('attributes', name, sub.name)}>
													{sub.name}
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
									<span className="group-title">{cat.name}</span>
									<div className="button-grid">
										{cat.subCategories.map(sub => (
											<button key={sub.id} className="btn-tag-cat" onClick={() => addTag('categories', cat.name, sub.name)}>
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

			<footer className="tagger-nav">
				<button disabled={currentLineIdx === 1} onClick={() => setCurrentLineIdx(p => p - 1)}>Anterior</button>
				<button className="btn-save-session" onClick={() => window.taggingAPI.saveCurrentProgress(fileName, data)}>Guardar sesión</button>
				<button disabled={currentLineIdx === Object.keys(data).length} onClick={() => setCurrentLineIdx(p => p + 1)}>Siguiente</button>
			</footer>
		</div>
	);
}
