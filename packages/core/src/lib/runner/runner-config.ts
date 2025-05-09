import { ExtractionConfig } from '../extraction-writer/extraction-config';

import { Transform } from '../analyzer/transform';

export interface RunnerConfig extends ExtractionConfig {
  transforms?: Transform[];
}
