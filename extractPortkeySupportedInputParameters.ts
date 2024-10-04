// This script extracts the Portkey supported input parameters for each provider
// This generates an exhaustive list of the parameters that you can pass while invoking one of the supported routes for a provider
import Providers from './src/providers';

const output = {};

for (const provider in Providers) {
  const providerConfig = Providers[provider];
  delete providerConfig.api;
  delete providerConfig.responseTransforms;
  output[provider] = {};
  for (const method in providerConfig) {
    output[provider][method] = [];
    for (const param in providerConfig[method]) {
      output[provider][method].push(param);
    }
  }
}

import fs from 'fs';

fs.writeFileSync(
  'output/portkeySupportedInputParameters.json',
  JSON.stringify(output, null, 2),
  'utf8'
);
console.log('Output written to output/portkeySupportedInputParameters.json');
