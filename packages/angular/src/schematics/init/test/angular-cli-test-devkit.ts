import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { TestDevKit } from "./test-devkit";
import { AngularCliDevkit } from "src/schematics/util/devkit";
import { ProjectConfiguration, Tree } from "@nx/devkit";
import { ArchitectConfiguration } from "../init";

import { angularJsonTemplate as angularJsonTemplateStandalone } from './init-angular';
import { angularJsonTemplate as angularJsonTemplateStandaloneWorkspace } from './init-angular-workspace';
import { createProject } from "./util";

export class AngularCliTestDevkit extends AngularCliDevkit implements TestDevKit {
    constructor(private isWorkspace: boolean) {
        super();
    }
    createProject = createProject;
    async setup(projectName: string) {
        const tree = createTreeWithEmptyWorkspace();
        tree.delete('nx.json');
        // we are creating a partial config which contains the relevant part for testronaut
        const angularJson = structuredClone(
          this.isWorkspace
            ? angularJsonTemplateStandaloneWorkspace
            : angularJsonTemplateStandalone
        ) as {
          projects: Record<string, unknown>;
        };
        angularJson.projects[projectName] = angularJson.projects['eternal'];
        const config = angularJson.projects[projectName] as {
          root: string;
          sourceRoot: string;
        };
        config.root = config.root.replace('test', projectName);
        config.sourceRoot = config.sourceRoot.replace('test', projectName);
        angularJson.projects[projectName] = config;
        delete angularJson.projects['eternal'];
      
        tree.write('angular.json', JSON.stringify(angularJson, null, 2));
      
        return tree;
      }

      readProjectConfiguration(tree: Tree, projectName: string) {
        const config = tree.read('angular.json', 'utf8') as string;
        const parseConfig = JSON.parse(config) as {
          projects: Record<string, ProjectConfiguration>;
        };
        return parseConfig.projects[projectName];
      }

      getTargets(config: ProjectConfiguration) {
        return (config as unknown as { architect: ArchitectConfiguration })
          .architect;
      }

      addProject(tree: Tree, projectName: string, isWorkspace: boolean) {
        const originalConfig = JSON.parse(
          tree.read('angular.json', 'utf8') || ''
        ) as {projects: Record<string, ProjectConfiguration>};
    
        const angularJsonTemplate = isWorkspace
          ? angularJsonTemplateStandaloneWorkspace
          : angularJsonTemplateStandalone;
        const newProject = structuredClone(angularJsonTemplate.projects['eternal']);
        tree.write(
          'angular.json',
          JSON.stringify(
            {
              ...originalConfig,
              projects: {
                ...originalConfig.projects,
                [projectName]: newProject,
              },
            },
            null,
            2
          )
        );
      }
  
}