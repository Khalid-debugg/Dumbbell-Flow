import './env'

import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDatabase, closeDatabase } from './database'
import { registerMemberHandlers } from './handlers/members'
import { registerPlanHandlers } from './handlers/plans'
import { registerMembershipHandlers } from './handlers/memberships'
import { registerCheckInHandlers } from './handlers/checkIns'
import { registerDashboardHandlers } from './handlers/dashboard'
import { registerReportsHandlers } from './handlers/reports'
import { registerSettingsHandlers, performAutoBackup } from './handlers/settings'
import { registerLicenseHandlers } from './license'
import { registerSeedHandlers } from './handlers/seed'
import { registerAccountHandlers } from './handlers/accounts'
import { registerWhatsAppHandlers } from './handlers/whatsapp'
import { registerExportsHandlers } from './handlers/exports'
import { registerStoreProductHandlers } from './handlers/storeProducts'
import { registerStoreSalesHandlers } from './handlers/storeSales'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon: icon,
    title: 'DumbbellFlow',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  mainWindow.maximize()
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

ipcMain.handle('ping', async () => {
  return 'pong from main process!'
})

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.dumbbellflow.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  initDatabase()
  registerLicenseHandlers()
  registerDashboardHandlers()
  registerMemberHandlers()
  registerPlanHandlers()
  registerMembershipHandlers()
  registerCheckInHandlers()
  registerReportsHandlers()
  registerSettingsHandlers()
  registerSeedHandlers()
  registerAccountHandlers()
  registerWhatsAppHandlers()
  registerExportsHandlers()
  registerStoreProductHandlers()
  registerStoreSalesHandlers()
  await performAutoBackup()

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase()
})
