from http.cookies import BaseCookie
from typing import Mapping

import aiohttp


async def download(cookies: Mapping[str, BaseCookie], headers: Mapping[str, str]) -> None:
    async with aiohttp.ClientSession(cookies=cookies, headers=headers) as session:
        async with session.get('https://www.mintos.com/en/loan-book/download') as response:
            with open('loan_book.zip', 'wb') as fd:
                while True:
                    chunk = await response.content.read(4 * 2 ** 20)
                    if not chunk:
                        break
                    fd.write(chunk)

