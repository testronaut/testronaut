import { NxAdapter } from './nx-adapter';
import { Public } from './typing';

export class NxAdapterFake implements Public<NxAdapter> {
  intalledDevDependencies: Record<string, string> = {};
  private _devDependencies: Record<string, string> = {};

  addDevDependency(dependency: string, version: string) {
    this._devDependencies[dependency] = version;
  }

  installDependencies() {
    this.intalledDevDependencies = { ...this._devDependencies };
  }
}
