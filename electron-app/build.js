/**
 * TerraVision Desktop - Build Configuration
 * 
 * Script para gerar executáveis multiplataforma com electron-builder
 * Suporta Windows (NSIS, portable), macOS (DMG) e Linux (AppImage, deb)
 */

const builder = require('electron-builder');
const Platform = builder.Platform;
const path = require('path');

/**
 * Configuração de build
 */
const config = {
    appId: 'com.terravision.desktop',
    productName: 'TerraVision Desktop',
    copyright: 'Copyright © 2025 TerraVision Team',
    
    directories: {
        output: 'dist',
        buildResources: 'assets'
    },
    
    files: [
        '**/*',
        '!**/*.md',
        '!dist',
        '!node_modules/**/{CHANGELOG.md,README.md,README,readme.md,readme}',
        '!node_modules/**/{test,__tests__,tests,powered-test,example,examples}',
        '!node_modules/.bin',
        '!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}',
        '!.editorconfig',
        '!**/._*',
        '!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}',
        '!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}',
        '!**/{appveyor.yml,.travis.yml,circle.yml}',
        '!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}'
    ],
    
    // Windows
    win: {
        target: [
            {
                target: 'nsis',
                arch: ['x64', 'ia32']
            },
            {
                target: 'portable',
                arch: ['x64']
            }
        ],
        icon: 'assets/icon.ico',
        publisherName: 'TerraVision Team',
        verifyUpdateCodeSignature: false
    },
    
    nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        shortcutName: 'TerraVision Desktop',
        perMachine: false,
        runAfterFinish: true,
        installerIcon: 'assets/icon.ico',
        uninstallerIcon: 'assets/icon.ico',
        installerHeaderIcon: 'assets/icon.ico',
        deleteAppDataOnUninstall: false
    },
    
    portable: {
        artifactName: '${productName}-${version}-portable.exe'
    },
    
    // macOS
    mac: {
        target: [
            {
                target: 'dmg',
                arch: ['x64', 'arm64']
            },
            {
                target: 'zip',
                arch: ['x64', 'arm64']
            }
        ],
        icon: 'assets/icon.icns',
        category: 'public.app-category.healthcare-fitness',
        hardenedRuntime: true,
        gatekeeperAssess: false,
        entitlements: null,
        entitlementsInherit: null
    },
    
    dmg: {
        contents: [
            {
                x: 130,
                y: 220
            },
            {
                x: 410,
                y: 220,
                type: 'link',
                path: '/Applications'
            }
        ],
        background: null,
        title: '${productName} ${version}'
    },
    
    // Linux
    linux: {
        target: [
            {
                target: 'AppImage',
                arch: ['x64']
            },
            {
                target: 'deb',
                arch: ['x64']
            },
            {
                target: 'rpm',
                arch: ['x64']
            }
        ],
        icon: 'assets/icon.png',
        category: 'Science',
        synopsis: 'Eye-tracking terapêutico com aprendizado adaptativo',
        description: 'Aplicação desktop para terapia de eye-tracking com calibração inteligente usando TensorFlow.js e áudio binaural.'
    },
    
    appImage: {
        artifactName: '${productName}-${version}.${ext}'
    },
    
    deb: {
        depends: ['libgtk-3-0', 'libnotify4', 'libnss3', 'libxss1', 'libxtst6', 'xdg-utils', 'libatspi2.0-0', 'libuuid1']
    }
};

/**
 * Função principal de build
 */
async function buildApp() {
    console.log('🏗️  TerraVision Desktop - Build Process');
    console.log('==========================================\n');
    
    const platform = process.argv[2] || 'current';
    
    let targets;
    
    switch (platform) {
        case 'win':
        case 'windows':
            console.log('📦 Building for Windows...');
            targets = Platform.WINDOWS.createTarget();
            break;
            
        case 'mac':
        case 'macos':
            console.log('📦 Building for macOS...');
            targets = Platform.MAC.createTarget();
            break;
            
        case 'linux':
            console.log('📦 Building for Linux...');
            targets = Platform.LINUX.createTarget();
            break;
            
        case 'all':
            console.log('📦 Building for all platforms...');
            targets = Platform.WINDOWS.createTarget()
                .concat(Platform.MAC.createTarget())
                .concat(Platform.LINUX.createTarget());
            break;
            
        default:
            console.log('📦 Building for current platform...');
            targets = null; // Usa plataforma atual
    }
    
    try {
        const startTime = Date.now();
        
        await builder.build({
            targets,
            config,
            publish: 'never'
        });
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\n✅ Build concluído com sucesso!');
        console.log(`⏱️  Tempo total: ${duration}s`);
        console.log(`📁 Arquivos em: ${path.resolve('dist')}`);
        
    } catch (error) {
        console.error('\n❌ Erro durante o build:', error);
        process.exit(1);
    }
}

// Executar build
if (require.main === module) {
    buildApp();
}

module.exports = { buildApp, config };
