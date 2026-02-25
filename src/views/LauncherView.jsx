import { useState, useEffect } from 'react'
import { removeExtension } from '../utils/utils.js'
import { useNavigate } from 'react-router-dom'

import "../style/launcherView.css"

export default function LauncherView() {
  const navigate = useNavigate();

  const [models, setModels] = useState([]);
  const [fileSelected, setFileSelected] = useState(null);
  const [selectedModel, setSelectedModel] = useState("");

  // Cargar modelos
  useEffect(() => {
    (async () => {
      try {
        const models = await window.launcherAPI.getAllModels();
        setModels(models);
      } catch (error) {
        console.error("Error al obtener modelos:", error);
      }
    })()
  }, [])

  // Manejador para leer el archivo TXT
  const addFile = (e) => {
    if (e.target.files[0]) {
      const file = new FileReader();
      file.onload = (event) => {

        setFileSelected({
          name: e.target.files[0].name,
          content: event.target.result
        });
      };

      file.readAsText(e.target.files[0]);
    }
  }

  // Manejador para iniciar el etiquetado { Navega a TaggerView }
  const handleStartTagging = async () => {
    if (!fileSelected || !selectedModel) {
      alert("Selecciona un archivo y un modelo primero");
      return;
    }

    try {
      const result = await window.taggingAPI.prepareText(fileSelected.name, fileSelected.content);

      if (result.success) {

        const cleanFileName = result.fileName.replace('.json', '');
        const cleanModelName = removeExtension(selectedModel);

        navigate(`/tagger/${cleanFileName}/${cleanModelName}`);
      } else {
        alert("Error al preparar la sesión: " + result.error);
      }
    } catch (error) {
      console.error("Error en el proceso de etiquetado:", error);
    }
  };

  return (
    <div className="launcher-view">
      <header className="launcher-header">
        <h1 className="neon-text-blue">Etiquetador<span>ULPGC LU(G)AR</span></h1>
      </header>

      <div className="glass-panel">
        <main className="launcher-grid">
          <section className="config-card">
            <div className="card-icon blue-glow">📁</div>
            <p>Selecciona el archivo</p>

            <div className="file-input-wrapper">
              <label htmlFor="txt-upload" className="custom-file-upload">
                {fileSelected ? '✅ Archivo cargado' : 'Seleccionar TXT'}
              </label>
              <input
                id="txt-upload"
                type="file"
                accept=".txt"
                onChange={addFile}
              // style={{ display: 'none' }}
              />
              {fileSelected && <span className="file-name">{fileSelected.name}</span>}
            </div>
          </section>

          <section className="config-card">
            <div className="card-icon purple-glow">📑</div>
            <h3>Modelo de atributos</h3>

            <select
              className="neon-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <option value="">-- {models.length > 0 ? 'Seleccionar' : 'No hay modelos'} --</option>
              {models.map((m, i) => (
                <option key={i} value={m}>{removeExtension(m)}</option>
              ))}
            </select>

            <div className="divider">o</div>

            <div className='select-model-container'>
              <button className="link-btn-alt" onClick={() => navigate('/create-model')}> + Crear nuevo </button>
              <button
                className="link-btn-alt"
                disabled={!selectedModel}
                onClick={() => navigate(`/edit-model/${removeExtension(selectedModel)}`)}
                style={{ opacity: selectedModel ? 1 : 0.5 }}
              >
                ✏️ Editar seleccionado
              </button>
            </div>
          </section>
        </main>

        <footer>
        {/* <footer className="launcher-actions"> */}
          <button
            className={`btn-main-action ${(fileSelected && selectedModel) ? 'active' : 'disabled'}`}
            disabled={!fileSelected || !selectedModel}
            onClick={handleStartTagging}
          >
            Etiquetar
          </button>
        </footer>
      </div>
    </div>
  );
}