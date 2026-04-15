import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { removeExtension } from '../utils/utils.js'
import "../style/launcherView.css"

export default function LauncherView() {
  const navigate = useNavigate();

  //! --- PROYECTOS (CARPETAS) ---
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);

  //! --- ARCHIVO TXT Y MODELOS ---
  const [fileSelected, setFileSelected] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");

  //! --- SESIONES (TRABAJO GUARDADO) ---
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");

  //! --- FUNCIONES DE PROYECTOS ---
  //* Obtener lista de proyectos
  const fetchProjects = async () => {
    try {
      const res = await window.launcherAPI.getProjects();
      // Devuelve un array de strings
      setProjects(res);
    } catch (error) {
      console.error("Error al obtener proyectos:", error);
    }
  };

  //* Crear un proyecto
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const res = await window.launcherAPI.createProject(newProjectName.trim());

      if (res.success) {
        setNewProjectName("");
        setShowNewProjectInput(false);
        await fetchProjects();
        setSelectedProject(newProjectName.trim());
      } 
      else { alert(res.error); }
    }
    catch (error) { console.error("Error al crear proyecto:", error); }
  };

  //* Elimina la carpeta del proyecto y todo su contenido
  const handleDeleteProject = async (projectName) => {
    // Si no se selecciona ningún proyecto, no hace nada
    if (!window.confirm(
      `¿Estás seguro de que quieres 
      eliminar el proyecto "${projectName}" 
      y todas sus transcripciones?`
    )) return;

    try {
      const res = await window.launcherAPI.deleteProject(projectName);

      if (res.success) {
        if (selectedProject === projectName) {
          setSelectedProject("");
          setSessions([]);
        }
        await fetchProjects();
      }
      else { alert(res.error); }

    }
    catch (error) { console.error("Error al eliminar proyecto:", error); }
  };

  //! --- ARCHIVO TXT ---
  //* Añadir un archivo .txt
  const addFile = (e) => {
    if (e.target.files[0]) {
      const file = new FileReader();

      // El onload sucede después de leer el archivo (readAsText)
      file.onload = (event) => {
        setFileSelected({
          name: e.target.files[0].name,
          content: event.target.result
        });
      };

      file.readAsText(e.target.files[0]);
    }
  }

  //! SESIONES
  //* Obtiene los .json de sesiones guardadas para un proyecto específico
  const fetchSessions = async (projectName) => {
    if (!projectName) { setSessions([]); return; }

    try {
      const res = await window.launcherAPI.getAllSessions(projectName);
      setSessions(res);
    }
    catch (err) { console.error("Error al obtener sesiones:", err); }
  };

  //! --- MODELOS ---
  //* Obtiene los archivos de configuración de etiquetas (.json) de la carpeta de modelos
  const fetchModels = async () => {
    try {
      const res = await window.launcherAPI.getAllModels();
      setModels(res);

    } catch (error) {
      console.error("Error al obtener modelos:", error);
    }
  };

  //* Cargamos los proyectos y modelos al iniciar
  useEffect(() => {
    fetchModels();
    fetchProjects();
  }, [])

  //* Cada vez que cambiamos de proyecto, buscamos sus sesiones y reseteamos selecciones previas
  useEffect(() => {
    fetchSessions(selectedProject);
    setSelectedSession("");
    setFileSelected(null);
  }, [selectedProject])

  //* Manejador para importar un modelo (.json) desde el explorador de archivos
  const handleImportModel = async () => {
    try {
      // Abre diálogo nativo para elegir archivo
      const result = await window.launcherAPI.importModel();
      if (result.success) {
        await fetchModels(); // Recarga la lista de modelos
        setSelectedModel(result.fileName); // Selecciona el recién importado
      } else if (!result.canceled) {
        alert("Error al importar el modelo: " + result.error);
      }
    } catch (error) {
      console.error("Error importing model:", error);
    }
  };

  //* Manejador para eliminar el modelo seleccionado físicamente
  const handleDeleteModel = async () => {
    if (!selectedModel) return;
    const confirmDelete = window.confirm(`¿Estás seguro de que quieres eliminar el modelo "${removeExtension(selectedModel)}"?`);
    if (!confirmDelete) return;
    try {
      const result = await window.launcherAPI.deleteModel(removeExtension(selectedModel));
      if (result.success) {
        setSelectedModel("");
        await fetchModels();
      } else { alert("Error al eliminar el modelo: " + result.error); }
    } catch (error) {
      console.error("Error deleting model:", error);
    }
  };

  //! ETIQUETADO
  // Comenzado del etiquetado
  const handleStartTagging = async () => {
    if (!selectedProject) {
      alert("Selecciona o crea un proyecto primero");
      return;
    }

    if (selectedSession && selectedModel) {
      const cleanFileName = selectedSession.replace('.json', '');
      const cleanModelName = removeExtension(selectedModel);
      // Redirigimos a la ruta del tagger con los parámetros necesarios
      navigate(`/tagger/${selectedProject}/${cleanFileName}/${cleanModelName}`);
      return;
    }

    // CASO B: Nueva sesión desde un TXT cargado
    if (fileSelected && selectedModel) {
      try {
        // El backend prepara el JSON inicial a partir del TXT
        const result = await window.taggingAPI.prepareText(fileSelected.name, fileSelected.content, selectedProject);
        if (result.success) {
          const cleanFileName = result.fileName.replace('.json', '');
          const cleanModelName = removeExtension(selectedModel);
          navigate(`/tagger/${selectedProject}/${cleanFileName}/${cleanModelName}`);
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

  //* Manejador para importar una sesión (.json) externa a la carpeta del proyecto actual
  const handleImportSession = async () => {
    if (!selectedProject) {
      alert("Selecciona un proyecto para importar la sesión");
      return;
    }
    // Copia el archivo elegido a la carpeta del proyecto
    const res = await window.launcherAPI.importSession(selectedProject);

    if (res.success) {
      await fetchSessions(selectedProject);
      setSelectedSession(res.fileName);
      setFileSelected(null);
    } else if (!res.canceled) {
      alert("Error al importar sesión: " + res.error);
    }
  };

  return (
    <div className="launcher-view">
      <header className="launcher-header">
        <h1 className="neon-text-blue">Etiquetador<span> ULPGC LU(G)AR</span></h1>
      </header>

      <div className="glass-panel main-launcher-container">
        <div className="launcher-sections">

          {/* --- SECCIÓN IZQUIERDA: GESTIÓN DE PROYECTOS --- */}
          <section className="launcher-column projects-section">
            <h3 className="section-title"><span className="icon">📁</span> Proyectos</h3>
            <div className="projects-list scroller">
              {/* Iteramos sobre la lista de proyectos (carpetas) */}
              {projects.map((p) => (
                <div
                  key={p}
                  className={`project-item ${selectedProject === p ? 'active' : ''}`}
                  onClick={() => setSelectedProject(p)} // Al clicar, se activa el proyecto
                >
                  <span className="project-name">{p}</span>
                  {/* Botón para borrar proyecto (detiene la propagación para no seleccionar al borrar) */}
                  <button className="btn-icon delete" onClick={(e) => { e.stopPropagation(); handleDeleteProject(p); }}>🗑️</button>
                </div>
              ))}
              {projects.length === 0 && <p className="empty-msg">No hay proyectos creados</p>}
            </div>

            {/* Input condicional para crear un nuevo proyecto */}
            {showNewProjectInput ? (
              <div className="new-project-form">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Nombre del proyecto..."
                  autoFocus
                />
                <div className="form-actions">
                  <button onClick={handleCreateProject}>Crear</button>
                  <button onClick={() => setShowNewProjectInput(false)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <button className="btn-add-project" onClick={() => setShowNewProjectInput(true)}>
                + Nuevo Proyecto
              </button>
            )}
          </section>

          {/* --- SECCIÓN CENTRAL: SESIONES Y ARCHIVOS --- */}
          {/* Se deshabilita si no hay un proyecto seleccionado */}
          <section className={`launcher-column sessions-section ${!selectedProject ? 'disabled' : ''}`}>
            <h3 className="section-title"><span className="icon">📄</span> Sesiones</h3>
            {!selectedProject ? (
              <div className="lock-overlay">Selecciona un proyecto</div>
            ) : (
              <>
                {/* Opción 1: Cargar un texto plano .txt nuevo */}
                <div className="file-actions">
                  <h4>Cargar nuevo (.txt)</h4>
                  <label className="custom-file-upload mini">
                    {/* El input file está oculto para usar el estilo del label */}
                    <input type="file" accept=".txt" onChange={(e) => { addFile(e); setSelectedSession(""); }} style={{ display: 'none' }} />
                    Importar TXT
                  </label>
                  <button className="btn-text-creator-mini" onClick={() => navigate('/text-creator')}>✍️ Crear</button>
                  {fileSelected && <span className="selected-file-name">{fileSelected.name}</span>}
                </div>

                {/* Opción 2: Elegir una sesión guardada (.json) del proyecto */}
                <div className="session-select-area">
                  <h4>Continuar Sesión (.json)</h4>
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
                  {/* Permite traer un JSON de fuera a la carpeta del proyecto */}
                  <button className="link-btn-alt mini" onClick={handleImportSession}>
                    📥 Importar JSON
                  </button>
                </div>
              </>
            )}
          </section>

          {/* --- SECCIÓN DERECHA: SELECCIÓN DEL MODELO --- */}
          <section className="launcher-column models-section">
            <h3 className="section-title"><span className="icon">📑</span> Modelo</h3>
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

            {/* Acciones CRUD para el modelo de etiquetas */}
            <div className="model-actions-grid">
              <button className="btn-model-action" onClick={() => navigate('/create-model')}>Crear</button>
              <button className="btn-model-action" onClick={handleImportModel}>Importar</button>
              <button className="btn-model-action" disabled={!selectedModel} onClick={() => navigate(`/edit-model/${removeExtension(selectedModel)}`)}>Editar</button>
              <button className="btn-model-action delete" disabled={!selectedModel} onClick={handleDeleteModel}>Eliminar</button>
            </div>
          </section>

        </div>

        {/* --- BOTÓN PRINCIPAL DE LANZAMIENTO --- */}
        <footer className="launcher-footer">
          <button
            className={`btn-main-action ${((fileSelected || selectedSession) && selectedModel) ? 'active' : 'disabled'}`}
            disabled={(!fileSelected && !selectedSession) || !selectedModel}
            onClick={handleStartTagging} // Dispara la lógica de redirección al editor
          >
            Comenzar Etiquetado
          </button>
        </footer>
      </div>
    </div>
  );
}