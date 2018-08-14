// Please refer to the dev.sample.json file.
// Copy this file and create a new file named "dev.private.json".
// Fill in the details for the features you'de like to support.
// You don't have to fill in all settings, but leave those you're not using blank.

import * as nconf from 'nconf';
import * as path from 'path';

export const config = createConfig(__dirname);

function createConfig(workingDir: string) {
    let envFile = null;
    const sampleFile = path.join(workingDir, '../dev.sample.json');
    if (process.env.NODE_ENV === 'test') {
        envFile = path.join(workingDir, '../test.config.json');
    } else {
        envFile = path.join(workingDir, '../dev.private.json');
    }

    const config = nconf.env().file({ file: sampleFile }).file({ file: envFile });
    return config;
}