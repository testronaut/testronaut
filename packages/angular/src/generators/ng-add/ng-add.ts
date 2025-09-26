import {
  addDependenciesToPackageJson,
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  readProjectConfiguration,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { NgAddGeneratorSchema } from './schema';

export async function ngAddGenerator(
  tree: Tree,
  options: NgAddGeneratorSchema
) {
  await addDependenciesToPackageJson(
    tree,
    {},
    {
      '@testronaut/angular': 'latest',
    }
  );

  if (isStandaloneProject(tree)) {
  }
  const projectRoot = `libs/${options.project}`;
  addProjectConfiguration(tree, options.project, {
    root: projectRoot,
    projectType: 'library',
    sourceRoot: `${projectRoot}/src`,
    targets: {},
  });
  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, options);
  await formatFiles(tree);
}

export default ngAddGenerator;
function isStandaloneProject(tree: Tree, project: string) {
  const projectConfig = readProjectConfiguration(tree, project);
  return projectConfig.projectType === 'application';
}
