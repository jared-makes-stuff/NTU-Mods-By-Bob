import http from 'http';
import https from 'https';

export const keepAliveHttpAgent = new http.Agent({
  keepAlive: true,
});

export const keepAliveHttpsAgent = new https.Agent({
  keepAlive: true,
});

