export type CohereStreamState = {
  generation_id: string;
};

export interface CohereErrorResponse {
  message: string;
}

export type CohereDatasetUploadStatus =
  | string
  | 'unknown'
  | 'queued'
  | 'processing'
  | 'failed'
  | 'validated'
  | 'skipped';

export interface CohereDataset {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  dataset_type:
    | string
    | 'embed-input'
    | 'reranker-finetune-input'
    | 'single-label-classification-finetune-input'
    | 'chat-finetune-input'
    | 'multi-label-classification-finetune-input';
  validation_status: CohereDatasetUploadStatus;
  validation_error: string;
  schema: string;
  required_fields: string[];
  preserve_fields: string[];
  dataset_parts: {
    id: string;
    name: string;
  }[];
  validation_warnings: string[];
}

export interface CohereGetFileResponse {
  dataset: CohereDataset;
}

export interface CohereGetFilesResponse {
  datasets: CohereDataset[];
}

export interface CohereCreateBatchResponse {
  job_id: string;
  meta: {
    api_version: {
      version: string;
      is_deprecated: boolean;
      is_experimental: boolean;
    };
    billed_units: {
      images: number;
      input_tokens: number;
      output_tokens: number;
      search_units: number;
      classifications: number;
    };
    tokens: {
      input_tokens: number;
      output_tokens: number;
    };
    warnings: string[];
  };
}
