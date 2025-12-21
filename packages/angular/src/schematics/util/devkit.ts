import {
  getProjects,
  ProjectConfiguration,
  ProjectsConfigurations,
  TargetConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';
import { NgAddGeneratorSchema } from '../init/schema';
import { getProjectName } from './get-project-name';
import { throwIfNullish } from './throw-if-nullish';

export function createDevkit(tree: Tree): Devkit {
  return tree.exists('angular.json')
    ? new AngularCliDevkit()
    : new NxDevkit();
}

export class AngularCliDevkit implements Devkit {
  cmd = 'ng'
  tsConfigName = 'tsconfig.json'

  getElements(tree: Tree, options: NgAddGeneratorSchema) {
    type ArchitectConfiguration = ProjectConfiguration['targets'];
    const angularConfig = JSON.parse(
      tree.read('angular.json', 'utf8') || ''
    ) as {
      projects: Record<
        string,
        {
          architect: ArchitectConfiguration;
          sourceRoot: string;
          root: string;
        }
      >;
    };
    const projects = angularConfig.projects;

    const projectName = getProjectName(projects, options.project);
    const config = projects[projectName];
    const sourceRoot = config.sourceRoot;
    const root = config.root;

    if (!(config.architect?.['serve'] && config.architect?.['build'])) {
      throw new Error(
        `Project ${projectName} is missing serve and/or build targets`
      );
    }

    const build = config.architect['build'] as BuildTargetConfiguration;
    const serve = config.architect['serve'];

    return { build, serve, projectName, config, sourceRoot, root };
  }
  updateProjectConfiguration(
    tree: Tree,
    projectName: string,
    config: ProjectConfiguration
  ) {
    const originalConfig = JSON.parse(
      tree.read('angular.json', 'utf8') as string
    ) as ProjectsConfigurations;
    const modifiedConfig = {
      ...originalConfig,
      projects: {
        ...originalConfig.projects,
        [projectName]: config,
      },
    };
    tree.write('angular.json', JSON.stringify(modifiedConfig, null, 2));
  }
}

export class NxDevkit implements Devkit {
  
  cmd = 'nx'
  tsConfigName = 'tsconfig.base.json'

  getElements(tree: Tree, options: NgAddGeneratorSchema) {
    const projects: Record<string, ProjectConfiguration> = Object.fromEntries(
      getProjects(tree).entries()
    );

    const projectName = getProjectName(projects, options.project);
    const config = projects[projectName];
    const sourceRoot = throwIfNullish(config.sourceRoot);
    const root = throwIfNullish(config.root);

    if (!(config.targets?.['serve'] && config.targets?.['build'])) {
      throw new Error(
        `Project ${config.name} is missing serve and/or build targets`
      );
    }

    const build = config.targets['build'] as BuildTargetConfiguration;
    const serve = config.targets['serve'];

    return { build, serve, projectName, config, sourceRoot, root };
  }
  updateProjectConfiguration(
    tree: Tree,
    projectName: string,
    config: ProjectConfiguration
  ) {
    updateProjectConfiguration(tree, projectName, config);
  }
}

export type Devkit = {
  getElements(tree: Tree, options: NgAddGeneratorSchema): GetElementsResult;
  updateProjectConfiguration(
    tree: Tree,
    projectName: string,
    config: ProjectConfiguration
  ): void;
  cmd: string;
  tsConfigName: string;
};

type BuildTargetConfiguration = TargetConfiguration<
  { browser: string } | { main: string }
>;

type GetElementsResult = {
  projectName: string;
  config: ProjectConfiguration;
  sourceRoot: string;
  root: string;
  build: BuildTargetConfiguration;
  serve: TargetConfiguration;
};
