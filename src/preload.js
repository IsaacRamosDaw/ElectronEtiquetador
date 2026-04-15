const { contextBridge, ipcRenderer } = require('electron');

//! Launcher view
//* Cargar modelos
//* Importar modelo
//* Eliminar modelo
contextBridge.exposeInMainWorld('launcherAPI', {
  getProjects: () => ipcRenderer.invoke('getProjects'),
  createProject: (name) => ipcRenderer.invoke('createProject', name),
  deleteProject: (name) => ipcRenderer.invoke('deleteProject', name),

  getAllModels: () => ipcRenderer.invoke('getAllModels'),
  importModel: () => ipcRenderer.invoke('importModel'),
  deleteModel: (name) => ipcRenderer.invoke('deleteModel', name),
  importSession: (projectName) => ipcRenderer.invoke('importSession', projectName),
  getAllSessions: (projectName) => ipcRenderer.invoke('getAllSessions', projectName),
});

//! Create model view
//* Cargar modelo
//* Guardar modelo
contextBridge.exposeInMainWorld('createModelAPI', {
  getModelToEdit: (name) => ipcRenderer.invoke('getModelToEdit', name),
  saveModel: (data) => ipcRenderer.invoke('saveModel', data),
});

//! Tagger view
//* Preparar texto (crear json)
//* Cargar datos del json
//* Cargar configuración del modelo
//* Actualizar etiquetas de la línea
//* Guardar progreso actual
//* Exportar a html
//* Exportar a txt
contextBridge.exposeInMainWorld('taggingAPI', {
  prepareText: (fileName, textContent, projectName) => ipcRenderer.invoke('prepareText', fileName, textContent, projectName),
  getJsonData: (fileName, projectName) => ipcRenderer.invoke('getJsonData', fileName, projectName),
  getModelConfig: (modelName) => ipcRenderer.invoke('getModelToEdit', modelName),
  updateLineTags: (fileName, data) => ipcRenderer.invoke('updateLineTags', fileName, data),
  saveCurrentProgress: (fileName, data, projectName) => ipcRenderer.invoke('saveCurrentProgress', fileName, data, projectName),
  exportToHtml: (fileName, htmlContent) => ipcRenderer.invoke('exportToHtml', fileName, htmlContent),
  exportToTxt: (fileName, txtContent) => ipcRenderer.invoke('exportToTxt', fileName, txtContent),
  exportToJson: (fileName, data) => ipcRenderer.invoke('exportToJson', fileName, data)
});