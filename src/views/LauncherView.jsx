import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { removeExtension } from '../utils/utils.js'

import "../style/launcherView.css"

export default function LauncherView() {
  const navigate = useNavigate();

  //* Archivo seleccionado en el input del file
  const [fileSelected, setFileSelected] = useState(null);
  //* Modelos añadidos en el input del select
  const [models, setModels] = useState([]);
  //* Modelo seleccionado en el select
  const [selectedModel, setSelectedModel] = useState("");

  //! ARCHIVO TXT
  //* Añadir un txt
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
  
  //! MODELOS 
  //* Cargar modelos al select
  const fetchModels = async () => {
    try {
      const models = await window.launcherAPI.getAllModels();
      setModels(models);
    } catch (error) {
      console.error("Error al obtener modelos:", error);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [])

  //* Importar modelo
  const handleImportModel = async () => {
    try {
      const result = await window.launcherAPI.importModel();
      if (result.success) {
        await fetchModels();
        setSelectedModel(result.fileName);
      } else if (!result.canceled) {
        alert("Error al importar el modelo: " + result.error);
      }
    } catch (error) {
      console.error("Error importing model:", error);
    }
  };

  //* Manejador para eliminar modelo
  const handleDeleteModel = async () => {
    if (!selectedModel) return;

    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres eliminar el modelo "${removeExtension(selectedModel)}"?`
    );

    if (!confirmDelete) return;

    try {
      const result = await window.launcherAPI.deleteModel(removeExtension(selectedModel));

      if (result.success) {
        setSelectedModel("");
        await fetchModels();
      }
      else { alert("Error al eliminar el modelo: " + result.error); }

    } catch (error) {
      console.error("Error deleting model:", error);
    }
  };

  //! ETIQUETADO
  //* Manejador para iniciar el etiquetado { Navega a TaggerView }
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
        <h1 className="neon-text-blue">Etiquetador<span> ULPGC LU(G)AR</span></h1>
      </header>

      <div className="glass-panel">
        <main className="launcher-grid">
          <section className="config-card">
            <div className="card-icon blue-glow">📁</div>
            <div className="file-input-wrapper">
              <label htmlFor="txt-upload" className="custom-file-upload">
                {fileSelected ? '📂 Cambiar archivo' : '📁 Seleccionar TXT'}
              </label>
              <input
                id="txt-upload"
                type="file"
                accept=".txt"
                onChange={addFile}
                style={{ display: 'none' }}
              />
              {fileSelected && <span className="file-name">{fileSelected.name}</span>}
            </div>
          </section>

          <section className="config-card">
            <div className="card-icon purple-glow">📑</div>
            <h3>Modelo de Etiquetas</h3>

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
              <button className="link-btn-alt" onClick={() => navigate('/create-model')}> Crear nuevo </button>
              <button className="link-btn-alt" onClick={handleImportModel}> 📥 Importar </button>
              <button
                className="link-btn-alt"
                disabled={!selectedModel}
                onClick={() => navigate(`/edit-model/${removeExtension(selectedModel)}`)}
                style={{ opacity: selectedModel ? 1 : 0.5 }}
              >
                ✏️ Editar
              </button>
              <button
                className="link-btn-alt delete-btn"
                disabled={!selectedModel}
                onClick={handleDeleteModel}
                style={{ opacity: selectedModel ? 1 : 0.5, color: '#ff4444' }}
              >
                🗑️ Eliminar
              </button>
            </div>
          </section>
        </main>

        <footer>
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