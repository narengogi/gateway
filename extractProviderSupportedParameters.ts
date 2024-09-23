import Providers from "./src/providers";

const output = {};

for (const provider in Providers) {
    const providerConfig = Providers[provider];
    delete providerConfig.api;
    delete providerConfig.responseTransforms;
    output[provider] = {};
    for (let method in providerConfig) {
        output[provider][method] = {};
        for (let param in providerConfig[method]) {
            let paramConfig = providerConfig[method][param];
            if (!Array.isArray(paramConfig)) paramConfig = [paramConfig];
            for (let config of paramConfig) {
                output[provider][method][config.param] = {
                    required: config.required || false,
                    default: config.default || null,
                }
        }
        }
    }
}

import fs from 'fs';

fs.writeFileSync('providerSupportedParameters.json', JSON.stringify(output, null, 2), 'utf8');
console.log('Output written to providerSupportedParameters.json');
