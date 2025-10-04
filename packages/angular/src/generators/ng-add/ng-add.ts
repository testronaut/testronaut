import {
  addDependenciesToPackageJson,
  addProjectConfiguration,
  convertNxGenerator,
  formatFiles,
  generateFiles,
  getProjects,
  Tree,
} from '@nx/devkit';
import { NgAddGeneratorSchema } from './schema';

export async function ngAddGenerator(
  tree: Tree,
  options: NgAddGeneratorSchema
) {
  await formatFiles(tree);
}

function getProjectName(tree: Tree) {
  const projects = getProjects(tree);
  if (Object.keys(projects).length === 0) {
    throw new Error('No projects found');
  }
  return Object.keys(projects)[0];
}

export default convertNxGenerator(ngAddGenerator);
