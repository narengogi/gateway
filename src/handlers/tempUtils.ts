import { Context } from 'hono';
import { ProviderAPIConfig } from '../providers/types';
import { Options } from '../types/requestBody';

export const addListeners = (
  outgoingWebSocket: WebSocket,
  server: WebSocket,
  c: Context,
  url: string
) => {
  const requestOptions = c.get('requestOptions') || [];
  let requestMessages: string[] = [];
  let responseMessages: string[] = [];
  let currentConversationIndex = requestOptions[requestOptions.length - 1];

  outgoingWebSocket.addEventListener('message', (event) => {
    server?.send(event.data as string);
    responseMessages.push(event.data as string);
    const parsedData = JSON.parse(event.data as string);
    if (parsedData.type === 'response.done') {
      requestOptions[currentConversationIndex].response = new Response(
        responseMessages.join('\n')
      );
      currentConversationIndex++;
      responseMessages = [];
    }
  });

  outgoingWebSocket.addEventListener('close', (event) => {
    server?.close();
  });

  outgoingWebSocket.addEventListener('error', (event) => {
    console.log('clientWebSocket error', event);
    server?.close();
  });

  server.addEventListener('message', (event) => {
    outgoingWebSocket?.send(event.data as string);
    const parsedData = JSON.parse(event.data as string);
    requestMessages.push(parsedData.data);
    if (parsedData.type === 'response.create') {
      requestOptions.push(createRequestOption(url, requestMessages, []));
      requestMessages = [];
    }
  });

  server.addEventListener('close', (event) => {
    outgoingWebSocket?.close();
    if (requestMessages.length > 0) {
      let requestOption = createRequestOption(
        url,
        requestMessages,
        responseMessages
      );
      requestOptions.push(requestOption);
    }
    c.set('requestOptions', requestOptions);
  });

  server.addEventListener('error', (event) => {
    console.log('serverWebSocket error', event);
    outgoingWebSocket?.close();
  });
};

export const createRequestOption = (
  url: string,
  requestMessages: string[],
  responseMessages: string[]
) => {
  const responseObject =
    responseMessages.length > 0
      ? new Response(responseMessages.join('\n'))
      : null;
  return {
    providerOptions: {
      requestURL: url,
      rubeusURL: 'realtime',
    },
    requestParams: { messages: requestMessages },
    response: responseObject,
  };
};

export const getOptionsForOutgoingConnection = async (
  apiConfig: ProviderAPIConfig,
  providerOptions: Options,
  url: string
) => {
  const headers = await apiConfig.headers({
    providerOptions,
    fn: 'realtime',
    transformedRequestUrl: url,
    transformedRequestBody: {},
  });
  headers['Upgrade'] = 'websocket';
  headers['Connection'] = 'Keep-Alive';
  headers['Keep-Alive'] = 'timeout=600';
  return {
    headers,
    method: 'GET',
  };
};

export const getURLForOutgoingConnection = (
  apiConfig: ProviderAPIConfig,
  providerOptions: Options
) => {
  const baseUrl = apiConfig.getBaseURL({ providerOptions });
  const endpoint = apiConfig.getEndpoint({
    providerOptions,
    fn: 'realtime',
    gatewayRequestBody: {},
  });
  return `${baseUrl}${endpoint}`;
};
