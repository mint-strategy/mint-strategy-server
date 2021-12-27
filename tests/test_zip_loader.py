import pathlib
import unittest
from mint_strategy.telegraf.excel_zip_loader import load_zip, quote


class MyTestCase(unittest.TestCase):
    def test_something(self):
        load_zip(pathlib.Path('/Users/matte/Documents/Projects/mint-strategy/loan_book.zip'))

    def test_quote(self):
        self.assertEqual(quote('a'), '"a"')


if __name__ == '__main__':
    unittest.main()
