import {
  addDependenciesToPackageJson,
  installPackagesTask,
  Tree,
} from '@nx/devkit';

export class NxAdapter {
  constructor(private readonly _tree: Tree) {}

  addDevDependency(dependency: string, version: string) {
    addDependenciesToPackageJson(
      this._tree,
      {},
      {
        [dependency]: version,
      }
    );
  }

  installDependencies() {
    installPackagesTask(this._tree);
  }
}
