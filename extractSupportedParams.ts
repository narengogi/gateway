import Providers from "./src/providers";

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

console.log(output);
