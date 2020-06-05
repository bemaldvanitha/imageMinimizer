const {app,BrowserWindow,Menu,ipcMain,shell} = require('electron');
const path = require('path');
const os = require('os');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const slash = require('slash');
const electronLog = require('electron-log');

let mainWindow;

// set environment
process.env.NODE_ENV = 'production';

const isDev = process.env.NODE_ENV !== 'production' ? true : false;
const isMac = process.env.platform === 'darwin' ? true : false;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'Image Shrink',
        width: 500,
        height: 600,
        icon: './assets/icons/Icon_256x256.png',
        resizable: isDev,
        backgroundColor: 'white',
        webPreferences: {
            nodeIntegration: true
        }
    });
    /*if(isDev){
        mainWindow.webContents.openDevTools()
    }*/

    mainWindow.loadFile('./app/index.html')
}

app.on('ready',() => {
    createMainWindow();

    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    mainWindow.on('closed',() => mainWindow=null);
});

const menu = [
    ...(isMac ? [
        {role: 'appMenu'}
    ]: []),
    {
        label: 'File',
        submenu: [
            {
                label: 'Quit',
                accelerator: isMac ? 'Command+Q' : 'Ctrl+Q',
                click: () =>app.quit()
            }
        ]
    },
    ...(isDev ? [
        {
            label: 'Developer',
            submenu: [
                {role:'reload'},
                {role:'forcereload'},
                {role:'toggledevtools'},
            ]
        }
    ]: [])
];

ipcMain.on('image:minimize',(e,options) => {
    options.dest = path.join(os.homedir(),'imageshrink');
    shrinkImage(options);
});

async function shrinkImage ({imgPath,quality,dest}){
    try{
        const pngQuality  = quality/100

        const files = await imagemin([slash(imgPath)],{
            destination: dest,
            plugins: [
                imageminMozjpeg({quality}),
                imageminPngquant({
                    quality: [pngQuality,pngQuality]
                })
            ]
        })
        console.log(files)

        shell.openPath(dest)

        mainWindow.webContents.send('image:done')
    }catch (e) {
        electronLog.error(e);
    }

}

app.on('window-all-closed', () => {
    if(!isMac){
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
    }
});
