/**
 * TerraVision Desktop - Main Process (Electron Entrypoint)
 * 
 * Gerencia a janela principal, acesso à câmera nativa e ciclo de vida da aplicação
 * Integra com TensorFlow.js node para processamento ML acelerado
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

// Configuração de segurança e performance
app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer');
app.commandLine.appendSwitch('enable-accelerated-video-decode');
app.commandLine.appendSwitch('ignore-gpu-blacklist');

/**
 * Cria a janela principal da aplicação
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js'),
      // Permitir acesso a recursos locais
      webSecurity: false,
      allowRunningInsecureContent: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false, // Mostrar apenas quando pronto
    frame: true,
    titleBarStyle: 'default'
  });

  // Carregar interface
  mainWindow.loadFile('index.html');

  // Abrir DevTools em desenvolvimento
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  // Mostrar janela quando pronta (evita flash branco)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('[Main] TerraVision Desktop iniciado com sucesso');
  });

  // Limpar referência quando fechada
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Log de erros
  mainWindow.webContents.on('crashed', (event) => {
    console.error('[Main] Renderer process crashed:', event);
  });

  mainWindow.webContents.on('unresponsive', () => {
    console.warn('[Main] Renderer process não responsivo');
  });
}

/**
 * Handlers IPC para comunicação com renderer process
 */
ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('save-calibration-data', async (event, data) => {
  const fs = require('fs').promises;
  const dataPath = path.join(app.getPath('userData'), 'calibration.json');
  try {
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
    console.log('[Main] Dados de calibração salvos:', dataPath);
    return { success: true, path: dataPath };
  } catch (error) {
    console.error('[Main] Erro ao salvar calibração:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-calibration-data', async () => {
  const fs = require('fs').promises;
  const dataPath = path.join(app.getPath('userData'), 'calibration.json');
  try {
    const data = await fs.readFile(dataPath, 'utf8');
    console.log('[Main] Dados de calibração carregados');
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('[Main] Nenhum dado de calibração encontrado');
      return { success: false, error: 'No calibration data found' };
    }
    console.error('[Main] Erro ao carregar calibração:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Inicialização da aplicação
 */
app.whenReady().then(() => {
  createMainWindow();

  // No macOS, recriar janela quando ícone do dock é clicado
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });

  console.log('[Main] App pronto - Versão Electron:', process.versions.electron);
  console.log('[Main] App pronto - Node:', process.versions.node);
  console.log('[Main] App pronto - Chrome:', process.versions.chrome);
});

/**
 * Quit quando todas as janelas forem fechadas (exceto macOS)
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Cleanup antes de sair
 */
app.on('before-quit', () => {
  console.log('[Main] Aplicação encerrando...');
});

// Error handling global
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Main] Unhandled Rejection at:', promise, 'reason:', reason);
});
