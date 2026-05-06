import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  license: {
    getHardwareId: () => ipcRenderer.invoke('license:getHardwareId'),
    isLicensed: () => ipcRenderer.invoke('license:isLicensed'),
    activate: (licenseKey: string) => ipcRenderer.invoke('license:activate', licenseKey),
    activateOffline: (code: string) => ipcRenderer.invoke('license:activateOffline', code),
    getStatus: () => ipcRenderer.invoke('license:getStatus'),
    deactivate: () => ipcRenderer.invoke('license:deactivate')
  },
  seed: {
    database: (options?: {
      numMembers?: number
      numPlans?: number
      checkInRate?: number
      clearExisting?: boolean
    }) => ipcRenderer.invoke('seed:database', options)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
