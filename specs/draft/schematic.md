# Angular Schematic Specification

## Overview

Create an Angular schematic which installs `@testronaut/angular` or - if already installed - upgrades to the latest version. The schematic will be integrated into the existing `@testronaut/angular` package rather than being a separate package.

## Package Structure

The schematic will be part of the existing `@testronaut/angular` package:

```
packages/angular/
├── src/
│   ├── lib/
│   │   └── ... (existing runtime code)
│   └── schematics/
│       ├── ng-add/
│       │   ├── index.ts
│       │   └── schema.json
│       └── example-component/
│           ├── index.ts
│           └── schema.json
├── package.json (with schematics field)
└── collection.json
```

## Requirements

### Core Functionality

1. **Package Installation/Upgrade**

   - Install `@testronaut/angular` if not present
   - Upgrade to latest version if already installed
   - Install `@testronaut/core` as a dependency
   - Install `@playwright/test` as a dev dependency

2. **User Interaction**

   - Ask user if they want to create an example component
   - Provide clear descriptions of what will be created

3. **Example Component Creation** (Optional)
   - Create a dummy component with basic functionality
   - Generate corresponding Testronaut test file
   - Demonstrate key Testronaut features and patterns

### Example Component Details

The example component should:

- Be a simple, self-contained component (e.g., counter, greeting, or todo item)
- Include proper TypeScript typing
- Demonstrate Angular best practices
- Have a corresponding test that shows:
  - Component rendering
  - User interactions
  - State management
  - Testronaut-specific patterns

### Configuration Files

The schematic should set up:

- Basic Testronaut configuration
- Test server setup files if needed
- Any required build configurations

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

- Check Angular version compatibility
- Validate Node.js version requirements
- Handle peer dependency conflicts

## Testing Strategy

### CI Integration

Create a CI pipeline that:

1. Creates a completely new Angular project from scratch
2. Runs the schematic automatically
3. Executes Testronaut tests on the generated example
4. Validates the setup works end-to-end

### Test Scenarios

- Fresh Angular project installation
- Upgrade scenario (existing project)
- Different Angular versions
- Various project configurations (standalone, NgModules)

## User Experience

### Command Usage

```bash
ng add @testronaut/angular
```

### Interactive Prompts

```
? Would you like to create an example component? (Y/n)
```

### Success Output

Clear indication of:

- What was installed
- What files were created
- Next steps for the user
- How to run tests
