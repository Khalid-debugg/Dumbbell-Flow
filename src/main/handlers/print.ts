import { ipcMain, BrowserWindow, dialog } from 'electron'
import { writeFileSync } from 'fs'

export function registerPrintHandlers() {
  ipcMain.handle('app:printToPDF', async (event, html: string, defaultFilename: string) => {
    const parentWin = BrowserWindow.fromWebContents(event.sender)
    if (!parentWin) return { success: false }

    const { filePath, canceled } = await dialog.showSaveDialog(parentWin, {
      defaultPath: defaultFilename,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })

    if (canceled || !filePath) return { success: false, canceled: true }

    const printWin = new BrowserWindow({ show: false, webPreferences: { sandbox: false } })
    const encoded = Buffer.from(html, 'utf-8').toString('base64')
    await printWin.loadURL(`data:text/html;base64,${encoded}`)

    const pdfData = await printWin.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4'
    })
    printWin.destroy()

    writeFileSync(filePath, Buffer.from(pdfData))
    return { success: true }
  })

  ipcMain.handle('app:print', async (_event, html: string) => {
    const printWin = new BrowserWindow({ show: false, webPreferences: { sandbox: false } })
    const encoded = Buffer.from(html, 'utf-8').toString('base64')
    await printWin.loadURL(`data:text/html;base64,${encoded}`)

    printWin.webContents.print({ silent: false }, () => {
      printWin.destroy()
    })

    return { success: true }
  })
}
