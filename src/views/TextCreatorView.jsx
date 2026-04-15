import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import "../style/textCreatorView.css"

export default function TextCreatorView() {
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [textContent, setTextContent] = useState("");
  const [fileName, setFileName] = useState("nueva_entrevista");

  useEffect(() => {
    async function fetchProjects() {
      const res = await window.launcherAPI.getProjects();
      setProjects(res);
    }
    fetchProjects();
  }, [])

  const handleSave = async () => {
    if (!textContent.trim()) {
      alert("El contenido del texto está vacío");
      return;
    }

    if (!selectedProject) {
      alert("Selecciona un proyecto primero");
      return;
    }

    try {
      const fullFileName = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
      const result = await window.taggingAPI.exportToTxt(fullFileName, textContent);
      
      if (result.success) {
        //? También guardamos una sesión JSON inicial para que aparezca en el proyecto
        await window.taggingAPI.prepareText(fullFileName, textContent, selectedProject);
        alert("Archivo guardado y sesión creada con éxito");
        navigate('/');
      } else if (!result.canceled) {
        alert("Error al guardar el archivo: " + result.error);
      }
    } catch (error) {
      console.error("Error al guardar el archivo:", error);
      alert("Ocurrió un error inesperado al guardar");
    }
  };

  return (
    <div className="text-creator-view main-bg">
      <header className="text-creator-header">
        <h1 className="neon-text-blue">Crear <span>Texto</span></h1>
      </header>

      <div className="glass-panel">
        <div className="creator-controls">
          <div className="filename-input-container">
            <label>Proyecto:</label>
            <select 
              className="neon-input" 
              value={selectedProject} 
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">-- Seleccionar Proyecto --</option>
              {projects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="filename-input-container">
            <label>Nombre del archivo:</label>
            <input 
              type="text" 
              className="neon-input" 
              value={fileName} 
              onChange={(e) => setFileName(e.target.value)}
              placeholder="nombre_del_archivo"
            />
            <span>.txt</span>
          </div>
          
          <textarea 
            className="creator-textarea" 
            placeholder="Escribe aquí tu entrevista o texto..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
          />
        </div>

        <footer className="creator-footer">
          <button className="btn-secondary" onClick={() => navigate('/')}>
            Volver
          </button>
          <button className="btn-main" onClick={handleSave}>
            Guardar como .txt
          </button>
        </footer>
      </div>
    </div>
  );
}
