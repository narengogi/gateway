import { Context } from 'hono';
import { Message, Options, Params } from '../types/requestBody';

/**
 * Configuration for a parameter.
 * @interface
 */
export interface ParameterConfig {
  /** The name of the parameter. */
  param: string;
  /** The default value of the parameter, if not provided in the request. */
  default?: any;
  /** The minimum value of the parameter. */
  min?: number;
  /** The maximum value of the parameter. */
  max?: number;
  /** Whether the parameter is required. */
  required?: boolean;
  /** A function to transform the value of the parameter. */
  transform?: Function;
}

/**
 * Configuration for an AI provider.
 * @interface
 */
export interface ProviderConfig {
  /** The configuration for each parameter, indexed by parameter name. */
  [key: string]: ParameterConfig | ParameterConfig[];
}

/**
 * Configuration for an AI provider's API.
 * @interface
 */
export interface ProviderAPIConfig {
  /** A function to generate the headers for the API request. */
  headers: (args: {
    c: Context;
    providerOptions: Options;
    fn: string;
    transformedRequestBody: Record<string, any>;
    transformedRequestUrl: string;
    gatewayRequestBody?: Params;
  }) => Promise<Record<string, any>> | Record<string, any>;
  /** A function to generate the baseURL based on parameters */
  getBaseURL: (args: { providerOptions: Options }) => string;
  /** A function to generate the endpoint based on parameters */
  getEndpoint: (args: {
    providerOptions: Options;
    fn: string;
    gatewayRequestBodyJSON: Params;
    gatewayRequestBody?: FormData | Params;
    requestURL: string;
  }) => string;
  /** A function to determine if the request body should be transformed to form data */
  transformToFormData?: (args: { gatewayRequestBody: Params }) => boolean;
  getProxyEndpoint?: (args: {
    providerOptions: Options;
    reqPath: string;
    reqQuery: string;
  }) => string;
}

export type endpointStrings =
  | 'complete'
  | 'chatComplete'
  | 'embed'
  | 'rerank'
  | 'moderate'
  | 'stream-complete'
  | 'stream-chatComplete'
  | 'proxy'
  | 'imageGenerate'
  | 'createSpeech'
  | 'createTranscription'
  | 'createTranslation'
  | 'realtime'
  | 'uploadFile'
  | 'getFiles'
  | 'getFile'
  | 'deleteFile'
  | 'getFileContent'
  | 'createBatch'
  | 'retrieveBatch'
  | 'cancelBatch'
  | 'listBatches';

/**
 * A collection of API configurations for multiple AI providers.
 * @interface
 */
export interface ProviderAPIConfigs {
  /** The API configuration for each provider, indexed by provider name. */
  [key: string]: ProviderAPIConfig;
}

/**
 * A collection of configurations for multiple AI providers.
 * @interface
 */
export interface ProviderConfigs {
  /** The configuration for each provider, indexed by provider name. */
  [key: string]: any;
}

export interface BaseResponse {
  object: string;
  model: string;
}

/**
 * The basic structure of a completion response.
 * @interface
 */
export interface CResponse extends BaseResponse {
  id: string;
  created: number;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    /*
     * Anthropic Prompt cache token usage
     */
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
}

/**
 * The structure of a completion response for the 'complete' function.
 * @interface
 */
export interface CompletionResponse extends CResponse {
  choices: {
    text: string;
    index: number;
    logprobs: null;
    finish_reason: string;
  }[];
}

/**
 * The structure of a choice in a chat completion response.
 * @interface
 */
export interface ChatChoice {
  index: number;
  message: Message;
  finish_reason: string;
  logprobs?: object | null;
}

/**
 * The structure of a completion response for the 'chatComplete' function.
 * @interface
 */
export interface ChatCompletionResponse extends CResponse {
  choices: ChatChoice[];
  provider?: string;
}

/**
 * The structure of a error response for all functions
 * @interface
 */
export interface ErrorResponse {
  error: {
    message: string;
    type: string | null;
    param: string | null;
    code: string | null;
  };
  provider: string;
}

/**
 * The structure of a image generation response
 * @interface
 */
export interface ImageGenerateResponse {
  created: number;
  data: object[];
  provider: string;
}

/**
 * The response body for uploading a file.
 * @interface
 */
export interface UploadFileResponse extends File {}

/**
 * The response body for getting a file.
 * @interface
 */
export interface GetFileResponse extends File {}

/**
 * The response body for getting a list of files.
 * @interface
 */
export interface GetFilesResponse {
  data: File[];
  object: 'list';
}

/**
 * File object
 * @interface
 */
export interface File {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose:
    | string
    | 'assistants'
    | 'assistants_output'
    | 'batch'
    | 'batch_output'
    | 'fine-tune'
    | 'fine-tune-results'
    | 'vision';
  status?: string | 'uploaded' | 'processed' | 'error';
  status_details?: string;
}

/**
 * The response body for deleting a file.
 * @interface
 */
export interface DeleteFileResponse {
  object: string;
  deleted: boolean;
  id: string;
}

interface Batch {
  id: string;
  object: string;
  endpoint: string | 'batch';
  errors: {
    object: string | 'list';
    data: {
      code: string;
      message: string;
      param?: string;
      line?: number;
    }[];
  };
  input_file_id: string;
  completion_window: string;
  status: string;
  output_file_id: string;
  error_file_id: string;
  created_at: number;
  in_progress_at: number;
  expires_at: number;
  finalizing_at: number;
  completed_at: number;
  failed_at: number;
  expired_at: number;
  cancelling_at: number;
  cancelled_at: number;
  request_counts: {
    total: number;
    completed: number;
    failed: number;
  };
  metadata: Record<string, any>;
}

export interface CreateBatchResponse extends Batch {}
export interface RetrieveBatchResponse extends Batch {}
export interface CancelBatchResponse extends Batch {}
export interface ListBatchesResponse {
  object: string | 'list';
  data: Batch[];
}
