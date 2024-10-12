import { Context } from 'hono';
import { WSContext, WSEvents } from 'hono/ws';
import { constructConfigFromRequestHeaders } from './handlerUtils';
import { ProviderAPIConfig } from '../providers/types';
import Providers from '../providers';
import { Options } from '../types/requestBody';

const getOutgoingWebSocket = async (url: string, options: RequestInit) => {
  let outgoingWebSocket: WebSocket | null = null;
  try {
    let response = await fetch(url, options);
    outgoingWebSocket = response.webSocket;
  } catch (error) {
    console.log(error);
  }

  if (!outgoingWebSocket) {
    throw new Error('WebSocket connection failed');
  }

  outgoingWebSocket.accept();
  return outgoingWebSocket;
};

const addListeners = (
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
};

const createRequestOption = (
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

const getOptionsForOutgoingConnection = async (
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

const getURLForOutgoingConnection = (
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

export async function realTimeHandler(c: Context): Promise<Response> {
  let requestHeaders = Object.fromEntries(c.req.raw.headers);
  // move this to validator
  const upgradeHeader = requestHeaders['Upgrade'];
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  const providerOptions = constructConfigFromRequestHeaders(
    requestHeaders
  ) as Options;
  const provider = providerOptions.provider ?? '';
  const apiConfig: ProviderAPIConfig = Providers[provider].api;
  const url = getURLForOutgoingConnection(apiConfig, providerOptions);
  const options = await getOptionsForOutgoingConnection(
    apiConfig,
    providerOptions,
    url
  );

  const webSocketPair = new WebSocketPair();
  const client = webSocketPair[0];
  const server = webSocketPair[1];

  server.accept();

  let outgoingWebSocket: WebSocket = await getOutgoingWebSocket(url, options);

  addListeners(outgoingWebSocket, server, c, url);

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}
