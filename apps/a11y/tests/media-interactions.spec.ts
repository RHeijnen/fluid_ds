import { test, expect, type Locator } from "@playwright/test";

async function transform(frame: Locator) {
  return frame.locator(".content").evaluate((content) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(content).transform);
    return { x: matrix.m41, y: matrix.m42, scale: matrix.m11 };
  });
}

test("offline video plays with native keys, pauses on removal and replays after reconnect", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    "/iframe.html?id=quality-media-interaction-contracts--native-video-fixture&viewMode=story"
  );
  const video = page.locator("fluid-video video");
  await expect(video).toBeVisible();
  await page.getByRole("button", { name: "Play clip" }).focus();
  await page.keyboard.press("Enter");
  await expect
    .poll(() => video.evaluate((node) => (node as HTMLVideoElement).currentTime))
    .toBeGreaterThan(0);
  await page.locator("fluid-video").evaluate((player) => {
    const parent = player.parentElement!;
    player.remove();
    if (!(player.shadowRoot!.querySelector("video") as HTMLVideoElement).paused) {
      throw new Error("Removed player kept playing");
    }
    parent.prepend(player);
  });
  await expect.poll(() => video.evaluate((node) => (node as HTMLVideoElement).paused)).toBe(true);
  await page.getByRole("button", { name: "Reload clip" }).click();
  await page.getByRole("button", { name: "Play clip" }).focus();
  await page.keyboard.press("Space");
  await expect.poll(() => video.evaluate((node) => (node as HTMLVideoElement).ended)).toBe(true);
  expect(await video.evaluate((node) => (node as HTMLVideoElement).error)).toBeNull();
  expect(errors).toEqual([]);
});

test("playlist native Tab and activation preserve focus and active entry after reconnect", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    "/iframe.html?id=quality-media-interaction-contracts--native-playlist-fixture&viewMode=story"
  );
  const first = page.getByRole("button", { name: "Introduction" });
  const second = page.getByRole("button", { name: "Configuration" });
  const third = page.getByRole("button", { name: "Summary" });
  await first.focus();
  await page.keyboard.press("Tab");
  await expect(second).toBeFocused();
  await page.keyboard.press("Space");
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await expect(second).toBeFocused();
  const outline = await second.evaluate((button) => getComputedStyle(button).outlineStyle);
  expect(outline).not.toBe("none");
  await page.keyboard.press("Tab");
  await expect(third).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(third).toHaveAttribute("aria-pressed", "true");
  await page.locator("fluid-video-playlist").evaluate((playlist) => {
    const parent = playlist.parentElement!;
    playlist.remove();
    parent.append(playlist);
  });
  await expect(third).toHaveAttribute("aria-pressed", "true");
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("fluid-video video")).toHaveAttribute("aria-label", "Introduction");
  expect(errors).toEqual([]);
});

test("video exposes a real decoder failure and can recover with a valid local source", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    "/iframe.html?id=quality-media-interaction-contracts--native-video-fixture&viewMode=story"
  );
  const player = page.locator("fluid-video");
  await expect(player).toBeVisible();
  const rejection = await player.evaluate(async (host) => {
    const element = host as HTMLElement & {
      src: string;
      updateComplete: Promise<unknown>;
      play(): Promise<void>;
    };
    element.src = "data:video/webm;base64,AA==";
    await element.updateComplete;
    try {
      await element.play();
      return "unexpected success";
    } catch (error) {
      return (error as DOMException).name;
    }
  });
  expect(rejection).toBe("NotSupportedError");
  const video = player.locator("video");
  expect(await video.evaluate((node) => (node as HTMLVideoElement).error?.code)).toBe(4);
  await player.evaluate((host) => {
    (host as HTMLElement & { src: string }).src = "/media/contract-video.webm";
  });
  await page.getByRole("button", { name: "Play clip" }).click();
  await expect
    .poll(() => video.evaluate((node) => (node as HTMLVideoElement).currentTime))
    .toBeGreaterThan(0);
  expect(await video.evaluate((node) => (node as HTMLVideoElement).error)).toBeNull();
  expect(errors).toEqual([]);
});

test("zoom native pointer controls do not start dragging and captured pan ends cleanly", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    "/iframe.html?id=quality-media-interaction-contracts--native-zoom-fixture&viewMode=story"
  );
  const frame = page.locator("fluid-zoomable-frame");
  const zoomIn = page.getByRole("button", { name: "Zoom in" });
  await zoomIn.click();
  await expect(frame).toHaveAttribute("scale", "1.25");
  await expect(frame).not.toHaveAttribute("data-dragging");
  // WebKit follows platform-native non-click-focusing button behavior.
  // Enter the keyboard flow explicitly, then require focus to remain there.
  await zoomIn.focus();
  await expect(zoomIn).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(frame).toHaveAttribute("scale", "1.5");
  const bounds = (await frame.boundingBox())!;
  await page.mouse.move(bounds.x + 20, bounds.y + 20);
  await page.mouse.down();
  await expect(frame).toHaveAttribute("data-dragging", "");
  await page.mouse.move(bounds.x + 70, bounds.y + 50);
  await page.mouse.up();
  await expect(frame).not.toHaveAttribute("data-dragging");
  expect(await transform(frame)).toEqual({ x: 50, y: 30, scale: 1.5 });
  await page.getByRole("button", { name: "Reset zoom" }).focus();
  await page.keyboard.press("Space");
  await expect(frame).toHaveAttribute("scale", "1");
  expect(await transform(frame)).toEqual({ x: 0, y: 0, scale: 1 });
  await page.keyboard.press("Tab");
  await expect(zoomIn).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Pan left" })).toBeFocused();
  await page.keyboard.press("Space");
  expect(await transform(frame)).toEqual({ x: -40, y: 0, scale: 1 });
  await page.getByRole("button", { name: "Pan down" }).click();
  expect(await transform(frame)).toEqual({ x: -40, y: 40, scale: 1 });
  await page.getByRole("button", { name: "Pan down" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "After zoom" })).toBeFocused();
  expect(errors).toEqual([]);
});

test("slotted sources decode and selected captions load real cues during playback", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    "/iframe.html?id=quality-media-interaction-contracts--native-slotted-video-fixture&viewMode=story"
  );
  const player = page.locator("fluid-video");
  await expect(player).toBeVisible();
  const video = player.locator("video");
  await expect
    .poll(() => video.evaluate((node) => (node as HTMLVideoElement).readyState))
    .toBeGreaterThanOrEqual(2);
  await expect
    .poll(() => video.evaluate((node) => (node as HTMLVideoElement).textTracks.length))
    .toBe(1);
  const track = video.locator("track");
  await expect(track).toHaveAttribute("kind", "captions");
  await expect(track).toHaveAttribute("srclang", "en");
  await expect(track).toHaveAttribute("default", "");
  // Native caption selection depends on browser/user preferences. `default`
  // alone does not guarantee a request while a text track remains disabled.
  // Select the real track, then require fetched, parsed and active native cues.
  await video.evaluate((node) => {
    (node as HTMLVideoElement).textTracks[0]!.mode = "showing";
  });
  await expect.poll(() => track.evaluate((node) => (node as HTMLTrackElement).readyState)).toBe(2);
  await expect
    .poll(() =>
      video.evaluate((node) => (node as HTMLVideoElement).textTracks[0]?.cues?.length ?? 0)
    )
    .toBe(1);
  expect(await video.evaluate((node) => (node as HTMLVideoElement).textTracks[0]?.label)).toBe(
    "English"
  );
  expect(
    await video.evaluate((node) => {
      const cue = (node as HTMLVideoElement).textTracks[0]!.cues![0] as VTTCue;
      return { text: cue.text, start: cue.startTime, end: cue.endTime };
    })
  ).toEqual({ text: "Fluid generated test clip.", start: 0, end: 2.5 });
  await player.evaluate(async (node) => {
    await (node as HTMLElement & { play(): Promise<void> }).play();
  });
  await expect
    .poll(() => video.evaluate((node) => (node as HTMLVideoElement).currentTime))
    .toBeGreaterThan(0);
  await expect
    .poll(() =>
      video.evaluate((node) => {
        const selected = (node as HTMLVideoElement).textTracks[0]!;
        return {
          mode: selected.mode,
          active: [...(selected.activeCues ?? [])].map((cue) => (cue as VTTCue).text)
        };
      })
    )
    .toEqual({ mode: "showing", active: ["Fluid generated test clip."] });
  expect(await video.evaluate((node) => (node as HTMLVideoElement).error)).toBeNull();
  expect(errors).toEqual([]);
});
