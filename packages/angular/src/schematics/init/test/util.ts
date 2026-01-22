import { applicationGenerator, E2eTestRunner } from "@nx/angular/generators";
import { Tree } from "@nx/devkit";

export async function createProject(tree: Tree, name: string) {
    await applicationGenerator(tree, {
      directory: `apps/${name}`,
      name,
      e2eTestRunner: E2eTestRunner.None,
    });
  }