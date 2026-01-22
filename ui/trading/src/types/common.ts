export type ResponseStatus = 'SUCCESS' | 'ERROR';

export interface BaseResponse {
  status: ResponseStatus;
  message: string;
}

export interface SuccessResponse extends BaseResponse {
  status: 'SUCCESS';
  data?: string;
}

export interface ErrorResponse extends BaseResponse {
  status: 'ERROR';
  errorCode?: string;
  details?: string;
}

export type MutationResponse = SuccessResponse | ErrorResponse;
