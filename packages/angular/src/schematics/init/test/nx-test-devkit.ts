import { TestDevKit } from './test-devkit';
import {
  addProjectConfiguration,
  readProjectConfiguration,
  Tree,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { NxDevkit } from 'src/schematics/util/devkit';
import { ProjectConfiguration } from '@nx/devkit';
import { createProject } from './util';

export class NxTestDevkit extends NxDevkit implements TestDevKit {
  isWorkspace = true;
  tsConfigFilename = 'tsconfig.base.json';
  createProject = createProject;

  getFolder(projectName: string): string {
    return `apps/${projectName}/`;
  }

  async setup(projectName: string) {
    const tree = createTreeWithEmptyWorkspace();
    await this.createProject(tree, projectName);

    return tree;
  }
  readProjectConfiguration(tree: Tree, projectName: string) {
    return readProjectConfiguration(tree, projectName);
  }
  getTargets(config: ProjectConfiguration) {
    return config.targets;
  }
  addProject(tree: Tree, projectName: string) {
    addProjectConfiguration(tree, projectName, {
      projectType: 'application',
      root: `apps/${projectName}`,
    });
  }
}
