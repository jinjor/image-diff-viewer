export class Logger {
  constructor(private _verbose: boolean) {}
  verbose(...args: any[]) {
    if (this._verbose) {
      console.error(...args);
    }
  }
  log(...args: any[]) {
    console.error(...args);
  }
}
