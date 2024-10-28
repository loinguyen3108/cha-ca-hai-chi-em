from argparse import ArgumentParser

from src.services.product import ProductService

arg_parser = ArgumentParser(description='Product Importer')
arg_parser.add_argument('-f', '--file', help='CSV file path', required=True)
args = arg_parser.parse_args()
file_path = args.file

service = ProductService()
service.import_products_from_csv(file_path)
