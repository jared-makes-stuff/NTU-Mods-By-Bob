import * as moduleAlias from 'module-alias';

// Register alias programmatically to ensure it resolves to the absolute path of the built 'dist' directory
// This fixes the issue where requires inside nested routes fail to resolve '@' correctly
moduleAlias.addAlias('@', __dirname);
