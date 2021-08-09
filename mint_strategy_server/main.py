import pprint

import sanic
from sanic import Sanic
from sanic.models.handler_types import MiddlewareResponse
from sanic_cors import cross_origin, CORS

from mint_strategy_server import downloader

app = Sanic(name='default')
CORS(app)

copy_headers = [
    'accept',
    'accept-encoding',
    'accept-language',
    'user-agent',
]

static_headers = {
    'Referer': 'https://www.mintos.com/webapp/en/invest-en/primary-market/?sort_field=interest&sort_order=DESC'
               + '&currencies%5B%5D=978&referrer=https%3A%2F%2Fwww.mintos.com&hash=',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Connection': 'Close',
}


@app.post('/download')
@cross_origin(app, methods=['POST'])
async def download(request: sanic.Request) -> sanic.HTTPResponse:
    cookies = request.json
    pprint.pprint(cookies)

    headers = {**static_headers, **{k: v for k, v in request.headers.items() if k in copy_headers}}
    pprint.pprint(headers)

    await downloader.download(cookies, headers)
    return sanic.text('')


def add_cors_headers(request: sanic.request.Request, response: sanic.response.BaseHTTPResponse) -> MiddlewareResponse:
    if request.method != "OPTIONS":
        return _add_cors_headers(request, response)


def _add_cors_headers(request: sanic.request.Request, response) -> MiddlewareResponse:
    headers = {
        "Access-Control-Allow-Origin": request.headers.get('Origin'),
        "access-Control-Allow-Method": ['POST'],
    }
    response.headers.extend(headers)
    pprint.pprint(response.headers)
    return response


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
