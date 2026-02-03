declare module "@usebruno/converters" {
  export interface BrunoHeader {
    description: string;
    enabled: boolean;
    name: string;
    uid: string;
    value: string;
  }

  export interface BrunoParam {
    description: string;
    enabled: boolean;
    name: string;
    type: string;
    uid: string;
    value: string;
  }

  export interface BrunoBody {
    formUrlEncoded: unknown[];
    json: null | string;
    mode: string;
    multipartForm: unknown[];
    text: null | string;
    xml: null | string;
  }

  export interface BrunoRequest {
    name: string;
    request: {
      auth: {
        basic: unknown;
        bearer: unknown;
        digest: unknown;
        mode: string;
      };
      body: BrunoBody;
      headers: BrunoHeader[];
      method: string;
      params: BrunoParam[];
      script: {
        res: unknown;
      };
      url: string;
    };
    seq: number;
    type: "http-request";
    uid: string;
  }

  export interface BrunoFolder {
    items: BrunoItem[];
    name: string;
    type: "folder";
    uid: string;
  }

  export type BrunoItem = BrunoFolder | BrunoRequest;

  export interface BrunoCollection {
    items: BrunoItem[];
    name: string;
    uid: string;
    version: string;
  }

  export function openApiToBruno(openapiSpec: unknown): BrunoCollection;
}
