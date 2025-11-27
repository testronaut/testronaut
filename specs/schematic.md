# Angular Schematic Specification

## Overview

Create an Angular schematic which installs `@testronaut/angular` or - if already installed - upgrades to the latest version. The schematic will be integrated into the existing `@testronaut/angular` package rather than being a separate package.

The schematic will be part of the existing `@testronaut/angular` package.

## Requirements

### Core Functionality

1. **Package Installation/Upgrade**

- Install `@testronaut/angular` if not present
- Upgrade to latest version if already installed

2. **User Interaction**

- Ask user if they want to create example tests
- Provide clear explanation wants installation was successful

3. **Example Component Creation** (Optional)

- Basic button which shows clicked
- Basic button with service which is overriden
- Loader function where `HttpClient` is faked
- Loader function with `HttpClient` being not faked but covered via `page.route`
- Function for features with Routing

## Options

- `createExamples: boolean` (default: `true`) — whether to generate the examples
- `project`: string (default: ``) - pick the default project

## Implementation Approach

### Use Nx Generators

- Leverage existing Nx generator infrastructure
- Follow Nx best practices for schematic development
- Ensure compatibility with both standalone Angular CLI and Nx workspaces

### Error Handling

- Graceful handling of installation failures
- Rollback capabilities for partial failures
- Clear error messages for common issues

### Version Compatibility

- Support: Angular 20 only
- If Angular version < 20 is detected, abort with a clear message and direct users to open an issue at `https://github.com/testronaut/testronaut`

## Minimal Project Updates

- Add a target with an `executor` in `project.json` (`targets.<name>.executor`). For pure Angular CLI (non-Nx) workspaces, add the equivalent builder in `angular.json`.

## Testing Strategy

Each test needs to run with the following configurations:

- Angular CLI
- Angular CLI Workspace with one project
- Angular CLI Workspace with two projects
- Nx with standalone project
- Nx workspace with on project
- Nx workspace with two projects

### Setup Test

Create a CI pipeline that:

1. Creates a completely new Angular project from scratch
2. Runs the schematic automatically
3. Executes Testronaut tests on the generated example
4. Validates the setup works end-to-end

Run the test above with the following configurations:

### Upgrade Test

Provide one project with a minimal version of Testronaut (as long as it is possible with a given Angular version) and then run all migrations (including the)
