export function getProjectName(
    projects: Record<string, unknown>,
    providedProjectName: string | undefined
  ) {
    if (Object.keys(projects).length === 0) {
      throw new Error('No projects found in workspace');
    }
  
    const projectNames = Object.keys(projects);
  
    if (providedProjectName) {
      if (projectNames.includes(providedProjectName)) {
        return providedProjectName;
      }
      throw new Error(
        `Project '${providedProjectName}' not found. Available projects: ${projectNames
          .map((name) => `'${name}'`)
          .join(', ')}`
      );
    }
  
    return projectNames[0];
  }