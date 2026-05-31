# @fluid-ds/media

Media web components for [Fluid](https://github.com/RHeijnen/fluid_ds):
video, playlists, animated images with play/pause, zoomable frames, and a
declarative Web Animations API wrapper. Expansion pack.

```html
<fluid-video src="/clip.mp4" controls></fluid-video>
```

## Install

```bash
pnpm add @fluid-ds/media
```

```ts
import "@fluid-ds/media/define/video";
import "@fluid-ds/media/define/video-playlist";
import "@fluid-ds/media/define/animated-image";
import "@fluid-ds/media/define/zoomable-frame";
import "@fluid-ds/media/define/animation";
```

## Components

| Tag | Use case |
| --- | --- |
| `<fluid-video>` | Themed wrapper around native `<video>` |
| `<fluid-video-playlist>` | Playlist-driven video player with auto-advance |
| `<fluid-animated-image>` | GIF / APNG / animated-WebP with play/pause control (canvas-snapshot trick) |
| `<fluid-zoomable-frame>` | Pan + zoom container for images, iframes, SVG (scroll wheel + drag pan) |
| `<fluid-animation>` | Declarative wrapper around the Web Animations API |

Each component reads from the same `--fluid-*` semantic tokens as the rest
of the system, so themes flow through without extra work.

## License

[MIT](./LICENSE), © Fluid contributors
