# Release Note

## 0.2.0

1. Execute the SQL file in `migration/0.2.0.sql` to create tables `product`, `importer` and `import_line`.
2. Run the following command to create the `product` data:

```bash
python src/cli/product.py -f migration/baseline/product.csv
```

## 0.1.0

1. Execute the SQL file in `migration/0.1.0.sql` to create the table `users`.
