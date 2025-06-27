# import pandas as pd
# import os
# from typing import Optional
# from django.conf import settings

# class BaseCSVProcessor:
#     def __init__(self):
#         self.media_root = settings.MEDIA_ROOT
#         self.csv_dir = os.path.join(self.media_root, 'csv_files')
#         os.makedirs(self.csv_dir, exist_ok=True)

#     def read_csv(self, file_path: str) -> pd.DataFrame:
#         """Read a CSV file and return a pandas DataFrame."""
#         return pd.read_csv(file_path)

#     def save_csv(self, df: pd.DataFrame, filename: str) -> str:
#         """Save a DataFrame as CSV and return the file path."""
#         file_path = os.path.join(self.csv_dir, filename)
#         df.to_csv(file_path, index=False)
#         return file_path

#     def process(self, input_file: str) -> Optional[str]:
#         """
#         Process the input CSV file and return the path to the output file.
#         This method should be implemented by child classes.
#         """
#         raise NotImplementedError("Subclasses must implement process()") 