import pathlib
import typing
import uuid
import datetime as dt
from zipfile import ZipFile, BadZipFile


class Session:
    def __init__(self, session_id: typing.Union[str, uuid.UUID], root: pathlib.Path):
        self._session_id = session_id
        self._home_created = False
        self._home = root / str(session_id)

    @property
    def zipped(self) -> pathlib.Path:
        return self.home / "loan_book.zip"

    @property
    def unzipped(self) -> pathlib.Path:
        return self.home / "loan_book"

    @property
    def home(self) -> pathlib.Path:
        if not self._home_created and not self._home.exists():
            self._home.mkdir(parents=True, exist_ok=False)

        return self._home

    @property
    def cache_dir(self) -> pathlib.Path:
        cache_dir = self._home / "cache"
        if not cache_dir.exists():
            cache_dir.mkdir(parents=True)
        return cache_dir

    def date_time(self) -> dt.datetime:
        try:
            with ZipFile(self.zipped, "r") as zi:
                return dt.datetime(
                    *max(zi.infolist(), key=lambda info: info.date_time).date_time
                )
        except BadZipFile:
            import logging

            logging.getLogger(__name__).error(self.zipped)
            raise

    def __repr__(self) -> str:
        return f"Session[{self._session_id}]"


SessionFactory = typing.Callable[[], Session]


def session_factory(app_root: pathlib.Path) -> Session:
    import uuid

    return Session(uuid.uuid4(), app_root / "sessions")

