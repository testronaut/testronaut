import { ProjectConfiguration, Tree } from "@nx/devkit";
import { Devkit } from "src/schematics/util/devkit";
import { ArchitectConfiguration } from "../init";


export interface TestDevKit extends Devkit {
    createProject: (tree: Tree, name: string) => Promise<void>;
    setup: (projectName: string, workspace: boolean) => Promise<Tree>;
    readProjectConfiguration: (tree: Tree, projectName: string) => ProjectConfiguration;
    getTargets: (config: ProjectConfiguration) => ArchitectConfiguration;
    addProject: (tree: Tree, projectName: string, isWorkspace: boolean) => void;
  }