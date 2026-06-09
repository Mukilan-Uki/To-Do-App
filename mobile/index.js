// IMPORTANT: polyfills must be required (not imported) so they run before module hoisting
require('./polyfills');

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
