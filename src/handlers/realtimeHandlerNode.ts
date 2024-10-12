import { Context } from 'hono';
import { WSContext, WSEvents } from 'hono/ws';
import { constructConfigFromRequestHeaders } from './handlerUtils';
import { hc } from 'hono/client';
import app from '..';
import { Client } from 'hono/dist/types/client/types';
import WebSocket from 'ws';
import { ProviderAPIConfig } from '../providers/types';
import Providers from '../providers';
import { Options } from '../types/requestBody';
import { createRequestOption } from './tempUtils';

export async function realTimeHandlerNode(
  c: Context
): Promise<WSEvents<unknown>> {
  let incomingWebsocket: WSContext<unknown> | null = null;
  const requestOptions = c.get('requestOptions') || [];
  let requestMessages: string[] = [];
  let responseMessages: string[] = [];
  let currentConversationIndex = requestOptions[requestOptions.length - 1];
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
  let url = `${baseUrl}${endpoint}`;
  url = url.replace('https://', 'wss://');
  const headers = await apiConfig.headers({
    providerOptions,
    fn: 'realtime',
    transformedRequestUrl: url,
    transformedRequestBody: {},
  });

  const outgoingWebSocket = new WebSocket(url, {
    headers,
  });

  outgoingWebSocket.addEventListener('message', (event) => {
    incomingWebsocket?.send(event.data as string);
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
    console.log('clientWebSocket closed', event);
    incomingWebsocket?.close();
  });

  outgoingWebSocket.addEventListener('error', (event) => {
    console.log('clientWebSocket error', event);
    incomingWebsocket?.close();
  });

  return {
    onOpen(evt, ws) {
      incomingWebsocket = ws;
    },
    onMessage(event, ws) {
      outgoingWebSocket?.send(event.data as string);
      const parsedData = JSON.parse(event.data as string);
      requestMessages.push(parsedData.data);
      if (parsedData.type === 'response.create') {
        requestOptions.push(createRequestOption(url, requestMessages, []));
        requestMessages = [];
      }
    },
    onError(evt, ws) {
      console.log('realtimeHandler error', evt);
      outgoingWebSocket?.close();
    },
    onClose(evt, ws) {
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
    },
  };
}
