const { contextBridge, ipcRenderer } = require('electron');

//! Launcher view
//* Cargar modelos
//* Importar modelo
//* Eliminar modelo
contextBridge.exposeInMainWorld('launcherAPI', {
  getAllModels: () => ipcRenderer.invoke('getAllModels'),
  importModel: () => ipcRenderer.invoke('importModel'),
  deleteModel: (name) => ipcRenderer.invoke('deleteModel', name),
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
  prepareText: (fileName, model) => ipcRenderer.invoke('prepareText', fileName, model),
  getJsonData: (fileName) => ipcRenderer.invoke('getJsonData', fileName),
  getModelConfig: (modelName) => ipcRenderer.invoke('getModelToEdit', modelName),
  updateLineTags: (fileName, data) => ipcRenderer.invoke('updateLineTags', fileName, data),
  saveCurrentProgress: (fileName, data) => ipcRenderer.invoke('saveCurrentProgress', fileName, data),
  exportToHtml: (fileName, htmlContent) => ipcRenderer.invoke('exportToHtml', fileName, htmlContent),
  exportToTxt: (fileName, txtContent) => ipcRenderer.invoke('exportToTxt', fileName, txtContent)
});