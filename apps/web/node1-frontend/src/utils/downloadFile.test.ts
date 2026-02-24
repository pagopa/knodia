import { afterEach, describe, expect, it, vi } from "vitest";

import { downloadFile } from "./downloadFile";

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
    const fakeUrl = "blob:http://localhost/abc-123";
    vi.spyOn(URL, "createObjectURL").mockReturnValue(fakeUrl);
    const revokeSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockReturnValue(undefined);

    const clickSpy = vi.fn();
    const fakeAnchor = {
      click: clickSpy,
      download: "",
      href: "",
    } as unknown as HTMLAnchorElement;
    vi.spyOn(document, "createElement").mockReturnValue(fakeAnchor);

    const file = new File(["data"], "report.pdf", { type: "application/pdf" });
    downloadFile(file);

    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(fakeAnchor.href).toBe(fakeUrl);
    expect(fakeAnchor.download).toBe("report.pdf");
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(revokeSpy).toHaveBeenCalledWith(fakeUrl);
  });
});
