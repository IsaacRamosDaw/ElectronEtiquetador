const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('launcherAPI', {
  getAllModels: () => ipcRenderer.invoke('getAllModels'),
});

contextBridge.exposeInMainWorld('createModelAPI', {
  getModelToEdit: (name) => ipcRenderer.invoke('getModelToEdit', name),
  saveModel: (data) => ipcRenderer.invoke('saveModel', data),
});

contextBridge.exposeInMainWorld('taggingAPI', {
  prepareText: (fileName, model) => ipcRenderer.invoke('prepareText', fileName, model),
  getJsonData: (fileName) => ipcRenderer.invoke('getJsonData', fileName),
  getModelConfig: (modelName) => ipcRenderer.invoke('getModelToEdit', modelName), // Reutilizamos el que ya tienes
  updateLineTags: (fileName, data) => ipcRenderer.invoke('updateLineTags', fileName, data),
  saveCurrentProgress: (fileName, data) => ipcRenderer.invoke('saveCurrentProgress', fileName, data)
});