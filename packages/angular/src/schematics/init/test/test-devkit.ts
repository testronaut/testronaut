import { ProjectConfiguration, Tree } from '@nx/devkit';
import { Devkit } from '../../util/devkit';
import { ArchitectConfiguration } from '../init';

export interface TestDevKit extends Devkit {
  isWorkspace: boolean;
  tsConfigFilename: string;
  createProject: (tree: Tree, name: string) => Promise<void>;
  setup: (projectName: string) => Promise<Tree>;
  readProjectConfiguration: (
    tree: Tree,
    projectName: string
  ) => ProjectConfiguration;
  getTargets: (config: ProjectConfiguration) => ArchitectConfiguration;
  addProject: (tree: Tree, projectName: string) => void;
  getFolder: (projectName: string) => string;
}
