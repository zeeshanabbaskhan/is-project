// Named exports (all functions)
export * from './auth.controller.js';
export * from './file.controller.js';
export * from './share.controller.js';
export * from './note.controller.js';
export * from './device.controller.js';
export * from './analytics.controller.js';
export * from './crypto.controller.js';

// Namespaced exports (as controller objects)
import * as authController from './auth.controller.js';
import * as fileController from './file.controller.js';
import * as shareController from './share.controller.js';
import * as noteController from './note.controller.js';
import * as deviceController from './device.controller.js';
import * as analyticsController from './analytics.controller.js';
import * as cryptoController from './crypto.controller.js';

export {
    authController,
    fileController,
    shareController,
    noteController,
    deviceController,
    analyticsController,
    cryptoController
};
