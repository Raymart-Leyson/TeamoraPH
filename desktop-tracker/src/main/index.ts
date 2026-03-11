import { app, shell, BrowserWindow, ipcMain, desktopCapturer } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// Register custom protocol for OAuth callback: teamoraph://auth/callback
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('teamoraph', process.execPath, [join(__dirname, process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('teamoraph')
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 500,
    show: false,
    autoHideMenuBar: true,
    resizable: false,
    titleBarStyle: 'hiddenInset',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
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

// Handle OAuth deep link callback on Windows/Linux (second instance)
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    // The OAuth callback URL comes in as a command line argument
    const url = commandLine.find((arg) => arg.startsWith('teamoraph://'))
    if (url && mainWindow) {
      mainWindow.webContents.send('oauth-callback', url)
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.teamoraph.tracker')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  // Open OAuth URL in a child BrowserWindow — intercepts the redirect internally
  ipcMain.handle('open-oauth', async (_event, url: string) => {
    return new Promise((resolve) => {
      const authWindow = new BrowserWindow({
        width: 500,
        height: 680,
        show: true,
        title: 'Sign in with Google',
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        }
      })

      authWindow.loadURL(url)

      const handleRedirect = (navUrl: string) => {
        if (
          navUrl.startsWith('teamoraph://') ||
          navUrl.includes('access_token=') ||
          navUrl.includes('error_description=')
        ) {
          resolve(navUrl)
          if (!authWindow.isDestroyed()) authWindow.destroy()
        }
      }

      authWindow.webContents.on('will-navigate', (_e, navUrl) => handleRedirect(navUrl))
      authWindow.webContents.on('will-redirect', (_e, navUrl) => handleRedirect(navUrl))

      // Backup: custom protocols cause a load failure — catch the URL from that
      authWindow.webContents.on('did-fail-load', (_e, _code, _desc, validatedUrl) => {
        if (validatedUrl && (validatedUrl.startsWith('teamoraph://') || validatedUrl.includes('access_token='))) {
          resolve(validatedUrl)
          if (!authWindow.isDestroyed()) authWindow.destroy()
        }
      })

      authWindow.on('closed', () => resolve(null))
    })
  })

  // Screen Capture IPC
  ipcMain.handle('capture-screen', async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 }
      })
      if (sources && sources.length > 0) {
        return sources[0].thumbnail.toDataURL()
      }
      return null
    } catch (e) {
      console.error('Capture screen error:', e)
      return null
    }
  })

  createWindow()

  // Handle OAuth deep link on macOS (open-url event)
  app.on('open-url', (_event, url) => {
    if (mainWindow) {
      mainWindow.webContents.send('oauth-callback', url)
    }
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
