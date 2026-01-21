/******************************************************************************/
/* Constants                                                                  */
/******************************************************************************/

const VERSION = "2.6";
const RESSOURCES = [

  "./",
  "./index.html",
  "./service_worker.js",

  "./css/style.css",

  "./favicon/apple-touch-icon.png",
  "./favicon/favicon.ico",
  "./favicon/favicon.svg",
  "./favicon/favicon-96x96.png",
  "./favicon/site.webmanifest",
  "./favicon/web-app-manifest-192x192.png",
  "./favicon/web-app-manifest-512x512.png",

  "./img/pwa.svg",
  "./audio/instru1.mp3",
  "./audio/instru2.mp3",

  "./js/pwa.js"
];

/******************************************************************************/
/******************************************************************************/
/* Listeners                                                                  */
/******************************************************************************/

self.addEventListener("install", onInstall);
self.addEventListener("fetch", onFetch);

/******************************************************************************/
/******************************************************************************/
/* Install                                                                    */
/******************************************************************************/

function onInstall(event) {
  console.debug("onInstall()");

  event.waitUntil(caching());
  self.skipWaiting();
}

/******************************************************************************/

async function caching() {
  console.debug("caching()");

  const KEYS = await caches.keys();

  if (!KEYS.includes(VERSION)) {
    console.log("Caching version:", VERSION);
    const CACHE = await caches.open(VERSION);
    await CACHE.addAll(RESSOURCES);

    for (const KEY of KEYS) {
      if (KEY !== VERSION) {
        console.log("Suppress old cache version:", KEY);
        await caches.delete(KEY);
      }
    }
  }
}

/******************************************************************************/
/******************************************************************************/
	/* Fetch                                                                      */
	/******************************************************************************/

	function onFetch(event)
	{
		console.debug("onFetch()");

		event.respondWith(getResponse(event.request));
	}

	/******************************************************************************/

	async function getResponse(request)
	{
		console.debug("getResponse()");

		const RESPONSE = await caches.match(request);

		if(RESPONSE)
		{
			console.log("Fetch from cache", request.url);
			return RESPONSE;
		}
		else
		{
			console.log("Fetch from server", request.url);
			return fetch(request);
		}
	}

	/******************************************************************************/
