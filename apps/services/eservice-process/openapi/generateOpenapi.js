"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var generateOpenapi_1 = require("@knodia/fastify-zod-api-commons/generateOpenapi");
var app_ts_1 = require("../src/app.ts");
var config_ts_1 = require("../src/config/config.ts");
await (0, generateOpenapi_1.default)((0, app_ts_1.buildAppFromConfig)(config_ts_1.config));
