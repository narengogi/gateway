import { GatewayError } from '../../errors/GatewayError';
import { AI21, ANTHROPIC, COHERE } from '../../globals';
import { Params } from '../../types/requestBody';
import { ProviderConfigs } from '../types';
import BedrockAPIConfig from './api';
import {
  BedrockAI21ChatCompleteConfig,
  BedrockAI21ChatCompleteResponseTransform,
  BedrockAnthropicChatCompleteConfig,
  BedrockAnthropicChatCompleteResponseTransform,
  BedrockAnthropicChatCompleteStreamChunkTransform,
  BedrockCohereChatCompleteConfig,
  BedrockCohereChatCompleteResponseTransform,
  BedrockCohereChatCompleteStreamChunkTransform,
  BedrockLlamaChatCompleteResponseTransform,
  BedrockLlamaChatCompleteStreamChunkTransform,
  BedrockTitanChatCompleteResponseTransform,
  BedrockTitanChatCompleteStreamChunkTransform,
  BedrockTitanChatompleteConfig,
  BedrockMistralChatCompleteConfig,
  BedrockMistralChatCompleteResponseTransform,
  BedrockMistralChatCompleteStreamChunkTransform,
  BedrockLlama3ChatCompleteConfig,
  BedrockLlama2ChatCompleteConfig,
} from './chatComplete';
import {
  BedrockAI21CompleteConfig,
  BedrockAI21CompleteResponseTransform,
  BedrockAnthropicCompleteConfig,
  BedrockAnthropicCompleteResponseTransform,
  BedrockAnthropicCompleteStreamChunkTransform,
  BedrockCohereCompleteConfig,
  BedrockCohereCompleteResponseTransform,
  BedrockCohereCompleteStreamChunkTransform,
  BedrockLLamaCompleteConfig,
  BedrockLlamaCompleteResponseTransform,
  BedrockLlamaCompleteStreamChunkTransform,
  BedrockMistralCompleteConfig,
  BedrockMistralCompleteResponseTransform,
  BedrockMistralCompleteStreamChunkTransform,
  BedrockTitanCompleteConfig,
  BedrockTitanCompleteResponseTransform,
  BedrockTitanCompleteStreamChunkTransform,
} from './complete';
import { BEDROCK_STABILITY_V1_MODELS } from './constants';
import {
  BedrockCohereEmbedConfig,
  BedrockCohereEmbedResponseTransform,
  BedrockTitanEmbedConfig,
  BedrockTitanEmbedResponseTransform,
} from './embed';
import {
  BedrockStabilityAIImageGenerateV1Config,
  BedrockStabilityAIImageGenerateV1ResponseTransform,
  BedrockStabilityAIImageGenerateV2Config,
  BedrockStabilityAIImageGenerateV2ResponseTransform,
} from './imageGenerate';

const BedrockConfig: ProviderConfigs = {
  api: BedrockAPIConfig,
  getConfig: (params: Params) => {
    if (!params.model) {
      throw new GatewayError('Bedrock model not found');
    }

    // To remove the region in case its a cross-region inference profile ID
    // https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference-support.html
    const providerModel = params.model.replace(/^(us\.|eu\.)/, '');
    const providerModelArray = providerModel.split('.');
    const provider = providerModelArray[0];
    const model = providerModelArray.slice(1).join('.');
    switch (provider) {
      case ANTHROPIC:
        return {
          complete: BedrockAnthropicCompleteConfig,
          chatComplete: BedrockAnthropicChatCompleteConfig,
          api: BedrockAPIConfig,
          responseTransforms: {
            'stream-complete': BedrockAnthropicCompleteStreamChunkTransform,
            complete: BedrockAnthropicCompleteResponseTransform,
            'stream-chatComplete':
              BedrockAnthropicChatCompleteStreamChunkTransform,
            chatComplete: BedrockAnthropicChatCompleteResponseTransform,
          },
        };
      case COHERE:
        return {
          complete: BedrockCohereCompleteConfig,
          chatComplete: BedrockCohereChatCompleteConfig,
          embed: BedrockCohereEmbedConfig,
          api: BedrockAPIConfig,
          responseTransforms: {
            'stream-complete': BedrockCohereCompleteStreamChunkTransform,
            complete: BedrockCohereCompleteResponseTransform,
            'stream-chatComplete':
              BedrockCohereChatCompleteStreamChunkTransform,
            chatComplete: BedrockCohereChatCompleteResponseTransform,
            embed: BedrockCohereEmbedResponseTransform,
          },
        };
      case 'meta':
        const chatCompleteConfig =
          model?.search('llama3') === -1
            ? BedrockLlama2ChatCompleteConfig
            : BedrockLlama3ChatCompleteConfig;
        return {
          complete: BedrockLLamaCompleteConfig,
          chatComplete: chatCompleteConfig,
          api: BedrockAPIConfig,
          responseTransforms: {
            'stream-complete': BedrockLlamaCompleteStreamChunkTransform,
            complete: BedrockLlamaCompleteResponseTransform,
            'stream-chatComplete': BedrockLlamaChatCompleteStreamChunkTransform,
            chatComplete: BedrockLlamaChatCompleteResponseTransform,
          },
        };
      case 'mistral':
        return {
          complete: BedrockMistralCompleteConfig,
          chatComplete: BedrockMistralChatCompleteConfig,
          api: BedrockAPIConfig,
          responseTransforms: {
            'stream-complete': BedrockMistralCompleteStreamChunkTransform,
            complete: BedrockMistralCompleteResponseTransform,
            'stream-chatComplete':
              BedrockMistralChatCompleteStreamChunkTransform,
            chatComplete: BedrockMistralChatCompleteResponseTransform,
          },
        };
      case 'amazon':
        return {
          complete: BedrockTitanCompleteConfig,
          chatComplete: BedrockTitanChatompleteConfig,
          embed: BedrockTitanEmbedConfig,
          api: BedrockAPIConfig,
          responseTransforms: {
            'stream-complete': BedrockTitanCompleteStreamChunkTransform,
            complete: BedrockTitanCompleteResponseTransform,
            'stream-chatComplete': BedrockTitanChatCompleteStreamChunkTransform,
            chatComplete: BedrockTitanChatCompleteResponseTransform,
            embed: BedrockTitanEmbedResponseTransform,
          },
        };
      case AI21:
        return {
          complete: BedrockAI21CompleteConfig,
          chatComplete: BedrockAI21ChatCompleteConfig,
          api: BedrockAPIConfig,
          responseTransforms: {
            complete: BedrockAI21CompleteResponseTransform,
            chatComplete: BedrockAI21ChatCompleteResponseTransform,
          },
        };
      case 'stability':
        if (model && BEDROCK_STABILITY_V1_MODELS.includes(model)) {
          return {
            imageGenerate: BedrockStabilityAIImageGenerateV1Config,
            api: BedrockAPIConfig,
            responseTransforms: {
              imageGenerate: BedrockStabilityAIImageGenerateV1ResponseTransform,
            },
          };
        }
        return {
          imageGenerate: BedrockStabilityAIImageGenerateV2Config,
          api: BedrockAPIConfig,
          responseTransforms: {
            imageGenerate: BedrockStabilityAIImageGenerateV2ResponseTransform,
          },
        };
      default:
        throw new GatewayError('Invalid bedrock provider');
    }
  },
};

export default BedrockConfig;
