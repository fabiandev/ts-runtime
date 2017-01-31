#!/usr/bin/env node

import * as commander from 'commander';
import { bus } from '../bus';
import { handleError } from './errorHandler';

process.on('uncaughtException', (error: Error) => handleError);
bus.on('error', (error: Error) => handleError);


process.on('done', () => {
  console.log('done');
  process.exit(0);
});
