import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { removeExtension } from '../utils/utils.js'

import "../style/launcherView.css"

export default function LauncherView() {
  const navigate = useNavigate();

  //* Archivo seleccionado en el input del file 
  // dsjfkñsdjafkji
  const [fileSelected, setFileSelected] = useState(null);
  //* Modelos seleccionados
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  //* Sesiones disponibles (JSON)
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");

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
      const res = await window.launcherAPI.getAllModels();
      setModels(res);
    } catch (error) {
      console.error("Error al obtener modelos:", error);
    }
  };

  //* Cargar sesiones al select
  const fetchSessions = async () => {
    try {
      const res = await window.launcherAPI.getAllSessions();
      setSessions(res);
    } catch (error) {
      console.error("Error al obtener sesiones:", error);
    }
  };

  useEffect(() => {
    fetchModels();
    fetchSessions(); //? Carga también las sesiones existentes
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
    //? Caso 1: Se ha seleccionado una sesión JSON existente
    if (selectedSession && selectedModel) {
      const cleanFileName = selectedSession.replace('.json', '');
      const cleanModelName = removeExtension(selectedModel);
      navigate(`/tagger/${cleanFileName}/${cleanModelName}`);
      return;
    }

    //? Caso 2: Se ha seleccionado un TXT nuevo
    if (fileSelected && selectedModel) {
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
      return;
    }

    alert("Selecciona un archivo (o sesión) y un modelo primero");
  };


  //* Importar sesión JSON
  const handleImportSession = async () => {
    const res = await window.launcherAPI.importSession();
    if (res.success) {
      await fetchSessions(); //? Refresca la lista
      setSelectedSession(res.fileName); //? La selecciona automáticamente
      setFileSelected(null); //? Deselecciona el TXT para evitar confusiones
    } else if (!res.canceled) {
      alert("Error al importar sesión: " + res.error);
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
            <div className="card-icon blue-glow">📂</div>
            <h3>Entrevista (.txt)</h3>
            <label className="custom-file-upload">
              <input type="file" accept=".txt" onChange={(e) => { addFile(e); setSelectedSession(""); }} style={{ display: 'none' }} />
              Seleccionar Archivo
            </label>
            <span className="file-name">{fileSelected ? fileSelected.name : "Ningún archivo seleccionado"}</span>
            
            <div className="divider">o</div>
            
            <h3>Continuar Sesión (.json)</h3>
            <select 
              className="neon-select" 
              value={selectedSession} 
              onChange={(e) => { setSelectedSession(e.target.value); setFileSelected(null); }}
            >
              <option value="">-- {sessions.length > 0 ? 'Seleccionar Sesión' : 'No hay sesiones'} --</option>
              {sessions.map((s, i) => (
                <option key={i} value={s}>{removeExtension(s)}</option>
              ))}
            </select>

            <button className="link-btn-alt" onClick={handleImportSession} style={{ width: '100%', padding: '10px', marginTop: '10px' }}>
              📥 Importar Sesión Externa
            </button>
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
            className={`btn-main-action ${( (fileSelected || selectedSession) && selectedModel) ? 'active' : 'disabled'}`}
            disabled={(!fileSelected && !selectedSession) || !selectedModel}
            onClick={handleStartTagging}
          >
            Etiquetar
          </button>
        </footer>
      </div>
    </div>
  );
}