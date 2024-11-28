# Instructions to run the website
1. Download the dataset from https://data.cityofnewyork.us/Housing-Development/Bedbug-Reporting/wz6d-d3jb/about_data (Export -> Download file -> CSV -> Download)
2. Copy the dataset to this directory
3. Navigate to the project directory in terminal. 
4. Start a new conda environment and `conda install --yes --file requirements.txt`. You could also use `pip install -r requirements.txt` if you are using venv or not using any virtual environment at all.
5. `python3 -m uvicorn main:app --reload` to start the server
6. After the server was started, navigate to the visualization directory `cd data-viz-ui`
7. Download all packages for the website with `npm install`
8. Start the website by `npm start`
