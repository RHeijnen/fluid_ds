import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const fixture = fileURLToPath(new URL("./index.html", import.meta.url));

export default defineConfig({
  plugins: [
    {
      name: "fluid-raw-ssr-fixture",
      configureServer(server) {
        server.middlewares.use(async (request, response, next) => {
          const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
          const focusFixture =
            /^\/form-focus\/(input|checkbox|switch|textarea|number-input|typeahead|masked-input|select|time-picker|date-picker|color-picker|file-input|otp|radio-group|date-range-picker|scheduler)\/(client|dsd)$/.exec(
              pathname
            );
          if (pathname !== "/" && pathname !== "/index.html" && !focusFixture) {
            next();
            return;
          }

          response.statusCode = 200;
          response.setHeader("Content-Type", "text/html; charset=utf-8");
          const file = focusFixture
            ? fileURLToPath(
                new URL(
                  `./generated/form-focus/${focusFixture[1]}-${focusFixture[2]}.html`,
                  import.meta.url
                )
              )
            : fixture;
          response.end(await readFile(file));
        });
      }
    }
  ]
});
