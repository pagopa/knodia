import type { FastifyReply } from "fastify";

import {
  parseContentDispositionFileName,
  sanitizeFileName,
} from "@knodia/common-models/utils";
import { describe, expect, it, vi } from "vitest";

import { sendFileDownload } from "../../src/utils/http.ts";

describe("sanitizeFileName", () => {
  it("strips path components, keeping only the base name", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFileName("a/b\\c.yaml")).toBe("c.yaml");
    expect(sanitizeFileName("/absolute/path/openapi.json")).toBe(
      "openapi.json",
    );
  });

  it("removes control characters and double quotes", () => {
    expect(sanitizeFileName("evil\r\nSet-Cookie: x.yaml")).toBe(
      "evilSet-Cookie: x.yaml",
    );
    expect(sanitizeFileName('spec "v2".yaml')).toBe("spec v2.yaml");
  });

  it("preserves non-ASCII characters", () => {
    expect(sanitizeFileName("specifica-è.json")).toBe("specifica-è.json");
  });

  it("falls back to 'document' for empty or dot-only names", () => {
    expect(sanitizeFileName("")).toBe("document");
    expect(sanitizeFileName("..")).toBe("document");
    expect(sanitizeFileName("/")).toBe("document");
  });
});

describe("sendFileDownload", () => {
  function mockReply() {
    const writeHead = vi.fn();
    const end = vi.fn();
    const res = { raw: { end, writeHead } } as unknown as FastifyReply;
    return { end, res, writeHead };
  }

  function contentDispositionOf(writeHead: ReturnType<typeof vi.fn>): string {
    return writeHead.mock.calls.at(0)?.[1]["Content-Disposition"];
  }

  it("emits an ASCII fallback plus an RFC 5987 filename* parameter", () => {
    const { end, res, writeHead } = mockReply();

    const prettyName = "specifica-è.v2";
    sendFileDownload({
      content: "content",
      contentType: "application/json",
      fileName: "test.json",
      filePrettyName: prettyName,
      res,
    });

    expect(contentDispositionOf(writeHead)).toBe(
      "attachment; filename=\"specifica-_.v2.json\"; filename*=UTF-8''specifica-%C3%A8.v2.json",
    );
    expect(end).toHaveBeenCalledWith("content");
  });

  it("neutralizes quote injection in the filename", () => {
    const { res, writeHead } = mockReply();

    const prettyName = 'spec "v2"';
    sendFileDownload({
      content: "content",
      contentType: "application/yaml",
      fileName: `${prettyName}.yaml`,
      filePrettyName: prettyName,
      res,
    });

    expect(contentDispositionOf(writeHead)).toBe(
      "attachment; filename=\"spec v2.yaml\"; filename*=UTF-8''spec%20v2.yaml",
    );
  });

  it("neutralizes CRLF header injection", () => {
    const { res, writeHead } = mockReply();

    const prettyName = "evil\r\nSet-Cookie: pwned";
    sendFileDownload({
      content: "content",
      contentType: "application/yaml",
      fileName: `${prettyName}.yaml`,
      filePrettyName: prettyName,
      res,
    });

    // CR/LF are stripped, so the residual text stays inside the quoted filename
    // and the header is a single safe line.
    expect(contentDispositionOf(writeHead)).toBe(
      "attachment; filename=\"evilSet-Cookie: pwned.yaml\"; filename*=UTF-8''evilSet-Cookie%3A%20pwned.yaml",
    );
  });
});

describe("parseContentDispositionFileName", () => {
  it("returns the fallback when the header is missing", () => {
    expect(parseContentDispositionFileName(undefined)).toBe("document");
  });

  it("reads the plain quoted filename", () => {
    expect(
      parseContentDispositionFileName('attachment; filename="openapi.yaml"'),
    ).toBe("openapi.yaml");
  });

  it("prefers the RFC 5987 filename* form and decodes it", () => {
    expect(
      parseContentDispositionFileName(
        "attachment; filename=\"specifica-_.json\"; filename*=UTF-8''specifica-%C3%A8.json",
      ),
    ).toBe("specifica-è.json");
  });

  it("round-trips with sendFileDownload across a relay hop", () => {
    const writeHead = vi.fn();
    const res = {
      raw: { end: vi.fn(), writeHead },
    } as unknown as FastifyReply;

    const prettyName = 'spec "v2"';
    sendFileDownload({
      content: "content",
      contentType: "application/yaml",
      fileName: `${prettyName}.yaml`,
      filePrettyName: prettyName,
      res,
    });
    const header = writeHead.mock.calls.at(0)?.[1]["Content-Disposition"];

    expect(parseContentDispositionFileName(header)).toBe("spec v2.yaml");
  });
});
