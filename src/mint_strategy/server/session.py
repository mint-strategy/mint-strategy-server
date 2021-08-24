import mint_strategy.loan_book.session as s


def session_factory() -> s.Session:
    import uuid
    import appdirs
    from pathlib import Path
    return s.Session(uuid.uuid4(), Path(appdirs.user_data_dir('mint_strategy'))/'sessions')
