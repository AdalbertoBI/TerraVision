/**
 * TerraVision Desktop - Preload Script
 * 
 * Script de segurança para expor APIs seletivas ao renderer process
 * Fornece acesso controlado à câmera e sistema de arquivos
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para o renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Acesso à câmera via getUserMedia
   * @param {MediaStreamConstraints} constraints - Configurações de captura
   * @returns {Promise<MediaStream>} Stream de vídeo
   */
  getUserMedia: async (constraints) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[Preload] Câmera acessada com sucesso');
      return stream;
    } catch (error) {
      console.error('[Preload] Erro ao acessar câmera:', error);
      throw error;
    }
  },

  /**
   * Enumera dispositivos de mídia disponíveis
   * @returns {Promise<MediaDeviceInfo[]>} Lista de dispositivos
   */
  enumerateDevices: async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      console.log('[Preload] Câmeras encontradas:', cameras.length);
      return cameras;
    } catch (error) {
      console.error('[Preload] Erro ao enumerar dispositivos:', error);
      return [];
    }
  },

  /**
   * Obtém o caminho do diretório da aplicação
   * @returns {Promise<string>} Caminho absoluto
   */
  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  /**
   * Obtém o caminho do diretório de dados do usuário
   * @returns {Promise<string>} Caminho absoluto
   */
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),

  /**
   * Salva dados de calibração persistentes
   * @param {Object} data - Dados de calibração do modelo
   * @returns {Promise<Object>} Resultado da operação
   */
  saveCalibrationData: (data) => ipcRenderer.invoke('save-calibration-data', data),

  /**
   * Carrega dados de calibração salvos
   * @returns {Promise<Object>} Dados de calibração ou erro
   */
  loadCalibrationData: () => ipcRenderer.invoke('load-calibration-data'),

  /**
   * Informações do sistema
   */
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

// Expor API de notificações
contextBridge.exposeInMainWorld('notificationAPI', {
  /**
   * Envia notificação do sistema
   * @param {string} title - Título
   * @param {string} body - Mensagem
   */
  send: (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  },

  /**
   * Solicita permissão para notificações
   * @returns {Promise<NotificationPermission>} Permissão concedida
   */
  requestPermission: async () => {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }
});

// Log de inicialização
console.log('[Preload] Script de segurança carregado');
console.log('[Preload] Plataforma:', process.platform);
console.log('[Preload] Node:', process.versions.node);

// Garantir que APIs de câmera estão disponíveis
window.addEventListener('DOMContentLoaded', () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('[Preload] API de câmera não disponível!');
  } else {
    console.log('[Preload] API de câmera disponível');
  }
});
