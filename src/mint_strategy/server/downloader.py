import asyncio
from asyncio.futures import Future
import logging
import pathlib
import typing

import aiohttp

log = logging.getLogger(__name__)

allow_override = [
    "accept",
    "accept-encoding",
    "accept-language",
    "user-agent",
]

static_headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.mintos.com/webapp/en/invest-en/primary-market/?sort_field=interest&sort_order=DESC"
               + "&currencies%5B%5D=978&referrer=https%3A%2F%2Fwww.mintos.com&hash=",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-User": "?1",
    "Sec-GPC": "1",
}


async def download(
        cookies: typing.Mapping[str, str],
        headers: typing.Mapping[str, str],
        target_file: pathlib.Path,
) -> None:
    headers = static_headers | {k: v for k, v in headers.items() if k in allow_override}

    client_session = aiohttp.ClientSession()
    response = await client_session.get(
        "https://www.mintos.com/en/loan-book/download",
        cookies=cookies,
        headers=headers,
        timeout=aiohttp.ClientTimeout(total=60 * 60, sock_read=5 * 60),
    )

    async def download_coro():
        log.info("Downloading to %s", target_file)
        with open(target_file, "wb") as fd:
            while True:
                chunk = await response.content.read(2 ** 20)
                if not chunk:
                    break
                fd.write(chunk)
        response.close()
        await client_session.close()

    loop = asyncio.get_event_loop()
    task = loop.create_task(download_coro())

    def result_handler(future: Future):
        exc = future.exception()
        if exc:
            logging.warning('', exc_info=exc)
            raise exc
        else:
            logging.info('download done')

    task.add_done_callback(result_handler)
