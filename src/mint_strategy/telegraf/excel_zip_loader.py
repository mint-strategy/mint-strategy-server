import pathlib
import time
import zipfile
from typing import Optional
import sys

from openpyxl import load_workbook
import datetime

epoch = datetime.datetime(1970, 1, 1, tzinfo=datetime.timezone.utc)


def timestamp_ns(time_point=None) -> str:
    if time_point is None:
        time_point = datetime.datetime.now(datetime.timezone.utc)

    return str(int((time_point - epoch).total_seconds()) * 1000_000)


def load_zip(path: pathlib.Path) -> None:
    zip_start = time.monotonic_ns()
    zipf = zipfile.ZipFile(path)
    for zipinfo in zipf.infolist():
        with zipf.open(zipinfo.filename, 'r') as excel_buf:
            wb_start = time.monotonic_ns()
            process_workbook(excel_buf)
            wb_end = time.monotonic_ns()
            print(
                f'process_workbook,filename={zipinfo.filename} size={zipinfo.file_size},time={wb_end - wb_start} {timestamp_ns()}',
                file=sys.stderr)
            mtime = zipinfo.date_time
    zip_end = time.monotonic_ns()
    file_date = datetime.datetime(*mtime, tzinfo=datetime.timezone.utc)
    print(
        f'process_zipfile filedate={file_date.strftime("%Y-%m-%d")},size={path.stat().st_size},time={zip_end - zip_start} {timestamp_ns()}',
        file=sys.stderr)


tag_keys = [
    'Id',
    'Country',
    'Loan Originator',
    'Mintos Risk',
    'Loan Type',
    'Term',
    'Collateral',
    'Initial LTV',
    'LTV',
    'Loan Status',
    'Currency',
    'Buyback',
    'Extendable schedule',
    'Loan Originator Status',
    'In Recovery'
]


def process_workbook(excel_buf):
    workbook = load_workbook(excel_buf, read_only=True, data_only=True)
    try:
        ws = workbook.active

        header = next(ws.iter_rows(1, 1, values_only=True))

        for row in ws.iter_rows(2, max_col=len(header), values_only=True):
            values = list(row)
            values[1] = parse_date(values[1])
            values[2] = parse_date(values[2])
            values[3] = parse_date(values[3])

            timestamp = values[1] or values[2]

            tags = [f'"{i[0]}"="{i[1]}"' for i in
                    sorted(zip(header, values), key=lambda i: i[0]) if i[0] in tag_keys]

            fields = [f'"{i[0]}"={quote(i[1])}' for i in
                      (zip(header, values)) if i[0] not in tag_keys]

            line = 'loan,' + ','.join(tags) + ' ' + ','.join(fields) + ' ' + str(timestamp)

            print(line)
            break
    finally:
        workbook.close()


def parse_date(s: Optional[str]) -> Optional[int]:
    if s is None:
        return None

    date = datetime.datetime.strptime(s, '%Y-%m-%d %H:%M:%S').astimezone(datetime.timezone.utc)
    return int((date - epoch).total_seconds()) * 1000_000


def quote(obj):
    if type(obj) is str:
        return f'"{obj}"'
    else:
        return obj
