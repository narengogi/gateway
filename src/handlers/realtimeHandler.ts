import { Context } from 'hono';
import { WSContext, WSEvents } from 'hono/ws';
import { constructConfigFromRequestHeaders } from './handlerUtils';
// import WebSocket from 'ws';
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

export async function realTimeHandler(c: Context): Promise<Response> {
  let requestHeaders = Object.fromEntries(c.req.raw.headers);
  const camelCaseConfig = constructConfigFromRequestHeaders(requestHeaders);

  const provider = camelCaseConfig?.provider ?? '';
  const apiConfig: ProviderAPIConfig = Providers[provider].api;
  const providerOptions = camelCaseConfig as Options;
  const baseUrl = apiConfig.getBaseURL({ providerOptions });
  const endpoint = apiConfig.getEndpoint({
    providerOptions,
    fn: 'realtime',
    gatewayRequestBody: {},
  });
  const url = `${baseUrl}${endpoint}`;
  const headers = await apiConfig.headers({
    providerOptions,
    fn: 'realtime',
    transformedRequestUrl: url,
    transformedRequestBody: {},
  });

  const webSocketPair = new WebSocketPair();
  const client = webSocketPair[0];
  const server = webSocketPair[1];

  server.accept();

  headers['Upgrade'] = 'websocket';
  const options = {
    headers,
    method: 'GET',
  };

  let outgoingWebSocket: WebSocket = await getOutgoingWebSocket(url, options);

  outgoingWebSocket.addEventListener('message', (event) => {
    console.log('clientWebSocket message', event);
    server?.send(event.data as string);
    console.log('sent message to server');
    client.send('message sent to server');
  });

  outgoingWebSocket.addEventListener('close', (event) => {
    console.log('clientWebSocket closed', event);
    server?.close();
  });

  outgoingWebSocket.addEventListener('error', (event) => {
    console.log('clientWebSocket error', event);
    server?.close();
  });

  server.addEventListener('message', (event) => {
    console.log('server message', event);
    outgoingWebSocket?.send(event.data as string);
  });

  server.addEventListener('close', (event) => {
    console.log('server closed', event);
    outgoingWebSocket?.close();
  });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}
