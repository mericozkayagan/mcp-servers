#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var sdk_1 = require("@modelcontextprotocol/sdk");
var types_js_1 = require("@modelcontextprotocol/sdk/types.js");
var workflows_js_1 = require("./tools/workflows.js");
// Define all tool definitions
var TOOL_DEFINITIONS = [
    {
        name: 'mcp_list_workflows',
        description: 'List all workflows in the n8n instance',
        inputSchema: {
            type: 'object',
            properties: {
                random_string: {
                    type: 'string',
                    description: 'Dummy parameter for no-parameter tools'
                }
            },
            required: ['random_string']
        }
    },
    {
        name: 'mcp_get_workflow',
        description: 'Get details of a specific workflow by ID',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'ID of the workflow to retrieve'
                }
            },
            required: ['id']
        }
    },
    {
        name: 'mcp_activate_workflow',
        description: 'Activate a specific workflow by ID',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'ID of the workflow to activate'
                }
            },
            required: ['id']
        }
    },
    {
        name: 'mcp_deactivate_workflow',
        description: 'Deactivate a specific workflow by ID',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'ID of the workflow to deactivate'
                }
            },
            required: ['id']
        }
    },
    {
        name: 'mcp_execute_workflow',
        description: 'Execute a specific workflow with optional input data',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'ID of the workflow to execute'
                },
                data: {
                    type: 'object',
                    description: 'Input data for the workflow execution'
                }
            },
            required: ['id']
        }
    },
    {
        name: 'mcp_list_workflow_executions',
        description: 'List all executions for a specific workflow',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'ID of the workflow to get executions for'
                }
            },
            required: ['id']
        }
    },
    {
        name: 'mcp_get_execution',
        description: 'Get details of a specific execution by ID',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'ID of the execution to retrieve'
                }
            },
            required: ['id']
        }
    }
];
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var server, error_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    console.log('Starting n8n MCP server...');
                    console.log("Using n8n instance: ".concat(process.env.N8N_BASE_URL));
                    server = (0, sdk_1.createServer)({
                        name: 'n8n-mcp',
                        version: '0.1.0',
                        tools: TOOL_DEFINITIONS,
                        handleTool: function (request) { return __awaiter(_this, void 0, void 0, function () {
                            var name, parameters, _a, error_2;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        name = request.name, parameters = request.parameters;
                                        _b.label = 1;
                                    case 1:
                                        _b.trys.push([1, 18, , 19]);
                                        _a = name;
                                        switch (_a) {
                                            case 'mcp_list_workflows': return [3 /*break*/, 2];
                                            case 'mcp_get_workflow': return [3 /*break*/, 4];
                                            case 'mcp_activate_workflow': return [3 /*break*/, 6];
                                            case 'mcp_deactivate_workflow': return [3 /*break*/, 8];
                                            case 'mcp_execute_workflow': return [3 /*break*/, 10];
                                            case 'mcp_list_workflow_executions': return [3 /*break*/, 12];
                                            case 'mcp_get_execution': return [3 /*break*/, 14];
                                        }
                                        return [3 /*break*/, 16];
                                    case 2: return [4 /*yield*/, (0, workflows_js_1.listWorkflows)()];
                                    case 3: return [2 /*return*/, _b.sent()];
                                    case 4: return [4 /*yield*/, (0, workflows_js_1.getWorkflow)(parameters)];
                                    case 5: return [2 /*return*/, _b.sent()];
                                    case 6: return [4 /*yield*/, (0, workflows_js_1.activateWorkflow)(parameters)];
                                    case 7: return [2 /*return*/, _b.sent()];
                                    case 8: return [4 /*yield*/, (0, workflows_js_1.deactivateWorkflow)(parameters)];
                                    case 9: return [2 /*return*/, _b.sent()];
                                    case 10: return [4 /*yield*/, (0, workflows_js_1.executeWorkflow)(parameters)];
                                    case 11: return [2 /*return*/, _b.sent()];
                                    case 12: return [4 /*yield*/, (0, workflows_js_1.listWorkflowExecutions)(parameters)];
                                    case 13: return [2 /*return*/, _b.sent()];
                                    case 14: return [4 /*yield*/, (0, workflows_js_1.getExecution)(parameters)];
                                    case 15: return [2 /*return*/, _b.sent()];
                                    case 16: throw new types_js_1.McpError("Unknown tool: ".concat(name), types_js_1.ErrorCode.InvalidRequest);
                                    case 17: return [3 /*break*/, 19];
                                    case 18:
                                        error_2 = _b.sent();
                                        if (error_2 instanceof types_js_1.McpError) {
                                            throw error_2;
                                        }
                                        console.error("Error executing tool ".concat(name, ":"), error_2);
                                        throw new types_js_1.McpError("Error executing tool ".concat(name, ": ").concat(error_2.message), types_js_1.ErrorCode.InternalError);
                                    case 19: return [2 /*return*/];
                                }
                            });
                        }); }
                    });
                    // Register cleanup handler
                    process.on('SIGINT', function () {
                        console.log('Shutting down...');
                        process.exit(0);
                    });
                    process.on('SIGTERM', function () {
                        console.log('Shutting down...');
                        process.exit(0);
                    });
                    // Handle uncaught exceptions
                    process.on('uncaughtException', function (error) {
                        console.error('Uncaught Exception:', error);
                    });
                    process.on('unhandledRejection', function (reason, promise) {
                        console.error('Unhandled Rejection:', reason);
                    });
                    // Start the server
                    return [4 /*yield*/, server.listen()];
                case 1:
                    // Start the server
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Server error:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Run the server
main();
