import string

from requests.cookies import RequestsCookieJar


def download(sessionId: string) -> None:
    cookies = RequestsCookieJar()
    cookies.set("PHPSESSID", sessionId)
    # cookies.set()
    # requests.get()
    pass
