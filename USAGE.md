### Usage with Netlify

Quick, minimal setup to run Prerender locally and call it from Netlify Edge Functions.

- Redis

  - Linux: install and start Redis
    ```bash
    sudo apt update && sudo apt install -y redis-server
    sudo systemctl enable --now redis
    ```
  - Windows: use Docker (recommended) or Chocolatey

    ```bash
    # Docker
    docker run -p 6379:6379 --name prerender-redis -d redis

    # or (Windows + Chocolatey)
    choco install redis-64 -y
    ```

- Chrome / Chromium (executable path)

  - Linux: install Chromium or Google Chrome and/or set CHROME_PATH
    ```bash
    sudo apt install -y chromium-browser
    # or set explicit path
    export CHROME_PATH=/usr/bin/chromium-browser
    ```
  - Windows: install Chrome and/or set CHROME_PATH
    ```powershell
    # install via winget or set env var
    winget install Google.Chrome
    setx CHROME_PATH "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    ```

- Optional: Puppeteer (auto-downloads a compatible Chromium)

  ```bash
  npm install puppeteer --save
  # then your server can use puppeteer.executablePath() automatically
  ```

- Start Prerender

  ```bash
  npm install
  npm start
  # or set CHROME_PATH and run the server script
  ```

- Netlify Edge Function (very small proxy that keeps the browser URL)

  - file: `netlify/edge-prerender.js`

    ```javascript
    export default async (request) => {
      const url = new URL(request.url);
      if (!/^\/product\//.test(url.pathname)) return fetch(request);

      const target = `https://YOUR_WEBSITE_DOMAIN.com${url.pathname}${url.search}`;
      const prerenderHost = 'https://YOUR_PRERENDER_HOST'; // make prerender reachable
      const resp = await fetch(
        `${prerenderHost}/render?url=${encodeURIComponent(target)}`,
      );
      const body = await resp.arrayBuffer();
      return new Response(body, { status: resp.status, headers: resp.headers });
    };
    ```

  - add to `netlify.toml`
    ```toml
    [[edge_functions]]
    	function = "edge-prerender"
    	path = "/product/*"
    ```

That's it — keep the prerender service reachable from Netlify, pass canonical https URLs into `/render`, and use the Edge Function to return prerendered HTML while preserving the clean domain path.
