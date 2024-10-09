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

export async function realTimeHandler(c: Context): Promise<WSEvents<unknown>> {
  let serverWebSocket: WSContext<unknown> | null = null;
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

  // const requestOptions = c.get('requestOptions') || [];

  // const createRequestOption = (request:string, response:string) => {
  //     return {
  //         providerOptions: {
  //             requestURL: url,
  //             rubeusURL: 'realtime',
  //         },
  //         requestParams: request,
  //         response: response,
  //     }
  // }

  const clientWebSocket = new WebSocket(url, {
    headers,
  });

  clientWebSocket.addEventListener('message', (event) => {
    serverWebSocket?.send(event.data as string);
  });

  clientWebSocket.addEventListener('close', (event) => {
    console.log('clientWebSocket closed', event);
    serverWebSocket?.close();
  });

  clientWebSocket.addEventListener('error', (event) => {
    console.log('clientWebSocket error', event);
    serverWebSocket?.close();
  });

  return {
    onOpen(evt, ws) {
      serverWebSocket = ws;
    },
    onMessage(evt, ws) {
      clientWebSocket.send(evt.data as string);
    },
    onError(evt, ws) {
      console.log('realtimeHandler error', evt);
      clientWebSocket?.close();
      ws.close();
    },
    onClose(evt, ws) {
      console.log('connection closed');
      clientWebSocket?.close();
    },
  };
}
