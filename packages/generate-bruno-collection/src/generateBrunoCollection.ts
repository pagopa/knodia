import {
  type BrunoCollection,
  type BrunoFolder,
  type BrunoItem,
  type BrunoRequest,
  openApiToBruno,
} from "@usebruno/converters";
import { jsonToBruV2 } from "@usebruno/lang";
import yaml from "js-yaml";
import * as fs from "node:fs";
import * as path from "node:path";

interface GenerateBruOptions {
  endpointPath: string;
  hostVar: string;
  method: string;
  openapiPath: string;
  outputDir: string;
}

export function generateBruFile(options: GenerateBruOptions): string {
  const { endpointPath, hostVar, method, openapiPath, outputDir } = options;

  const absoluteOpenapiPath = path.resolve(openapiPath);
  if (!fs.existsSync(absoluteOpenapiPath)) {
    throw new Error(`OpenAPI file not found: ${absoluteOpenapiPath}`);
  }

  const openapiContent = fs.readFileSync(absoluteOpenapiPath, "utf-8");
  const openapiSpec = yaml.load(openapiContent);

  const brunoCollection = openApiToBruno(openapiSpec) as BrunoCollection;

  const matchedRequest = findRequest(
    brunoCollection.items,
    method,
    endpointPath,
  );

  if (!matchedRequest) {
    const available = listAvailableEndpoints(brunoCollection.items);
    throw new Error(
      `No endpoint found matching ${method.toUpperCase()} ${endpointPath}\n\nAvailable endpoints:\n${available}`,
    );
  }

  // Replace {{baseUrl}} with the service host variable
  matchedRequest.request.url = matchedRequest.request.url.replace(
    "{{baseUrl}}",
    `{{${hostVar}}}`,
  );

  // openApiToBruno() returns a JSON representation of the request, but we want a .bru file.
  // jsonToBruV2() can serialize JSON to .bru, but expects a different JSON shape ("bru lang" format)
  // than what openApiToBruno() produces ("collection item" format).
  // collectionItemToBruLang bridges the two by reshaping the fields.
  const bruLangJson = collectionItemToBruLang(matchedRequest);
  const bruContent = jsonToBruV2(bruLangJson);

  fs.mkdirSync(outputDir, { recursive: true });

  const fileName = formatName(matchedRequest.name);
  const filePath = path.join(outputDir, `${fileName}.bru`);

  try {
    fs.writeFileSync(filePath, bruContent, { flag: "wx" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error(
        `File already exists: ${filePath}\nUse a different endpoint or remove the existing file.`,
      );
    }
    throw error;
  }

  return filePath;
}

// Maps the collection item format (from openApiToBruno) to the bru lang format (for jsonToBruV2)
function collectionItemToBruLang(item: BrunoRequest): Record<string, unknown> {
  const { auth, body, headers, method, params, script, url } = item.request;

  return {
    auth,
    body,
    headers,
    http: {
      auth: auth.mode !== "none" ? auth.mode : "",
      body: body.mode,
      method: method.toLowerCase(),
      url,
    },
    meta: {
      name: formatName(item.name),
      seq: item.seq,
      type: item.type,
    },
    params,
    script: {
      req: script?.req ?? "",
      res: script?.res ?? "",
    },
  };
}

// Extracts the path portion from a Bruno URL, stripping the {{baseUrl}} prefix and any query string
function extractPath(url: string): string {
  return url.replace("{{baseUrl}}", "").split("?")[0] ?? "";
}

// Recursively searches the collection tree for a request matching the given HTTP method and path
function findRequest(
  items: BrunoItem[],
  method: string,
  endpointPath: string,
): BrunoRequest | undefined {
  for (const item of items) {
    if (item.type === "folder") {
      const found = findRequest(
        (item as BrunoFolder).items,
        method,
        endpointPath,
      );
      if (found) return found;
    } else if (item.type === "http-request") {
      const request = item as BrunoRequest;
      const requestPath = extractPath(request.request.url);

      if (
        requestPath &&
        request.request.method.toUpperCase() === method.toUpperCase() &&
        normalizePath(requestPath) === normalizePath(endpointPath)
      ) {
        return request;
      }
    }
  }
  return undefined;
}

// Converts a camelCase operationId into a human-readable name
// e.g., "getEservices" → "Get Eservices", "createEservice" → "Create Eservice"
function formatName(operationId: string): string {
  return operationId
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

// Collects all endpoints in the collection as a formatted list, used in error messages when no match is found
function listAvailableEndpoints(items: BrunoItem[]): string {
  const collect = (items: BrunoItem[]): string[] => {
    const result: string[] = [];
    for (const item of items) {
      if (item.type === "folder") {
        result.push(...collect((item as BrunoFolder).items));
      } else if (item.type === "http-request") {
        const req = item as BrunoRequest;
        result.push(
          `  - ${req.request.method.toUpperCase()} ${extractPath(req.request.url)}`,
        );
      }
    }
    return result;
  };
  return collect(items).join("\n");
}

// Ensures a path starts with "/" for consistent comparison
function normalizePath(p: string): string {
  return p.startsWith("/") ? p : `/${p}`;
}
