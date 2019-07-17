export class Logger {
  constructor(private _verbose: boolean) {}
  verbose(...args: any[]) {
    if (this._verbose) {
      console.log(...args);
    }
  }
  log(...args: any[]) {
    console.log(...args);
  }
}
