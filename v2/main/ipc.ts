import {ipcMain as ipc, BrowserWindow} from 'electron';
import Watchdog from './watchdog';
import log from './log';

// Wrapper to subscribe/unsubscribe dog's file events

export default class Ipc {
    static onReceive(c: ChannelFromRenderer, cb: Function) {
        const subscriber = (e: Electron.IpcMainEvent, ...args: any[]) => {
            log.debug('channel:', c, '<---', args);
            cb.apply(e, args);
        };
        // Note: Should remember the callback to remove it later?
        ipc.on(c, subscriber);
    }

    constructor(
        private dog: Watchdog,
        private sender: Electron.WebContents = BrowserWindow.getFocusedWindow().webContents,
    ) {
        dog.on('ready', this.onDogReady.bind(this));
        dog.on('update', this.onFileUpdate.bind(this));
        dog.on('error', this.onError.bind(this));

        // TODO:
        // When received event from renderer process, handle it with this.dog.
        // e.g. When tab is closed, remove dog from doghouse properly.

        dog.start().catch(e => this.onError(e));
    }

    private onDogReady() {
        this.send('shiba:dog-ready', this.dog.id, this.dog.target.path);
    }

    private onFileUpdate(file: string, event: 'add' | 'change') {
        this.send('shiba:file-update', this.dog.id, file, event);
    }

    private onError(err: Error) {
        this.send('shiba:watch-error', this.dog.id, err.message);
    }

    private send(c: ChannelFromMain, ...args: any[]) {
        log.debug('channel:', c, '--->', args);
        this.sender.send(c, ...args);
    }
}