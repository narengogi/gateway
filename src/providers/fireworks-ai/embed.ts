import { FIREWORKS_AI } from "../../globals";
import { EmbedParams, EmbedResponse } from "../../types/embedRequestBody";
import { ErrorResponse, ProviderConfig } from "../types";
import { generateErrorResponse, generateInvalidProviderResponseError } from "../utils";
import { FireworksAIErrorResponse } from "./chatComplete";

export const FireworksAIEmbedConfig: ProviderConfig = {
    model: {
        param: "model",
        required: true,
        default: "mistral-embed",
    },
    input: {
        param: "input",
        required: true,
        transform: (params: EmbedParams) => {
            if (Array.isArray(params.input)) {
                return params.input;
            }

            return [params.input];
        },
    },
};

interface FireworksAIEmbedResponse extends EmbedResponse {}

export const FireworksAIEmbedResponseTransform: (
    response: FireworksAIEmbedResponse | FireworksAIErrorResponse,
    responseStatus: number
) => EmbedResponse | ErrorResponse = (response, responseStatus) => {
    if ("message" in response && responseStatus !== 200) {
        return generateErrorResponse(
            {
                message: response.message,
                type: response.type,
                param: response.param,
                code: response.code,
            },
            FIREWORKS_AI
        );
    }

    if ("data" in response) {
        return {
            object: response.object,
            data: response.data.map((d) => ({
                object: d.object,
                embedding: d.embedding,
                index: d.index,
            })),
            model: response.model,
            usage: {
                prompt_tokens: response.usage.prompt_tokens,
                total_tokens: response.usage.total_tokens,
            },
            provider: FIREWORKS_AI,
        };
    }

    return generateInvalidProviderResponseError(response, FIREWORKS_AI);
};
