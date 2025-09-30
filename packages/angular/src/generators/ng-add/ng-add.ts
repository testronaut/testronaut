import {
  addDependenciesToPackageJson,
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getProjects,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { NgAddGeneratorSchema } from './schema';

export async function ngAddGenerator(
  tree: Tree,
  options: NgAddGeneratorSchema
) {
  addDependenciesToPackageJson(
    tree,
    {},
    {
      '@testronaut/angular': 'latest',
    }
  );
  await formatFiles(tree);
}

function getProjectName(tree: Tree) {
  const projects = getProjects(tree);
  if (Object.keys(projects).length === 0) {
    throw new Error('No projects found');
  }
  return Object.keys(projects)[0];
}

export default ngAddGenerator;
