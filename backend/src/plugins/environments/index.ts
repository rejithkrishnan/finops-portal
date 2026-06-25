import { Router } from 'express';
import routes from './routes';

export const environmentsPlugin = {
  name: 'environments',
  prefix: '/api',
  router: routes,
};

export default environmentsPlugin;
