/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { afterEach, describe, expect, it, vi } from "vitest";

import { downloadFile, downloadResponseAsFile } from "./downloadFile";

function mockDownloadInfra() {
  const fakeUrl = "blob:http://localhost/abc-123";
  vi.spyOn(URL, "createObjectURL").mockReturnValue(fakeUrl);
  const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockReturnValue(undefined);

  const clickSpy = vi.fn();
  const fakeAnchor = {
    click: clickSpy,
    download: "",
    href: "",
  } as unknown as HTMLAnchorElement;
  vi.spyOn(document, "createElement").mockReturnValue(fakeAnchor);

  return { clickSpy, fakeAnchor, fakeUrl, revokeSpy };
}

describe("downloadFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does nothing when called with null", () => {
    const spy = vi.spyOn(URL, "createObjectURL");
    downloadFile(null);
    expect(spy).not.toHaveBeenCalled();
  });

  it("creates an object URL, triggers a download, and revokes the URL", () => {
    const { clickSpy, fakeAnchor, fakeUrl, revokeSpy } = mockDownloadInfra();

    const file = new File(["data"], "report.pdf", { type: "application/pdf" });
    downloadFile(file);

    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(fakeAnchor.href).toBe(fakeUrl);
    expect(fakeAnchor.download).toBe("report.pdf");
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(revokeSpy).toHaveBeenCalledWith(fakeUrl);
  });
});

describe("downloadResponseAsFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("serializes object data as pretty-printed JSON", () => {
    mockDownloadInfra();

    const data = { info: { title: "Test" }, openapi: "3.0.0" };
    downloadResponseAsFile({
      contentType: "application/json",
      data,
      fileName: "spec.json",
    });

    const createdFile = vi.mocked(URL.createObjectURL).mock.calls[0]![0];
    expect(createdFile).toBeInstanceOf(File);
    expect((createdFile as File).name).toBe("spec.json");
    expect((createdFile as File).type).toBe("application/json");
  });

  it("passes string data through without serialization", () => {
    mockDownloadInfra();

    downloadResponseAsFile({
      contentType: "application/yaml",
      data: "openapi: 3.0.0",
      fileName: "spec.yaml",
    });

    const createdFile = vi.mocked(URL.createObjectURL).mock.calls[0]![0];
    expect(createdFile).toBeInstanceOf(File);
    expect((createdFile as File).name).toBe("spec.yaml");
    expect((createdFile as File).type).toBe("application/yaml");
  });

  it("downloads file with Content-Disposition file name", () => {
    mockDownloadInfra();

    downloadResponseAsFile({
      contentDisposition: 'attachment; filename="spec.yaml"',
      contentType: "application/yaml",
      data: "openapi: 3.0.0",
    });

    const createdFile = vi.mocked(URL.createObjectURL).mock.calls[0]![0];
    expect(createdFile).toBeInstanceOf(File);
    expect((createdFile as File).name).toBe("spec.yaml");
    expect((createdFile as File).type).toBe("application/yaml");
  });

  it("downloads file with fallback file name", () => {
    mockDownloadInfra();

    downloadResponseAsFile({
      contentType: "application/yaml",
      data: "openapi: 3.0.0",
    });

    const createdFile = vi.mocked(URL.createObjectURL).mock.calls[0]![0];
    expect(createdFile).toBeInstanceOf(File);
    expect((createdFile as File).name).toBe("document");
    expect((createdFile as File).type).toBe("application/yaml");
  });
});
