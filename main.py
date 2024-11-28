from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import altair as alt
import pandas as pd
import geopandas as gpd

app = FastAPI()
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Retrieving the downloaded NYC bedbug reporting dataset (73.2 MB)
# see: https://data.cityofnewyork.us/Housing-Development/Bedbug-Reporting/wz6d-d3jb/about_data
bedbugs_df = pd.read_csv("Bedbug_Reporting_20241125.csv")

# remove a manual error that claims a 414754 infested unit count.
bedbugs_df = bedbugs_df[
    (bedbugs_df["Infested Dwelling Unit Count"] < 5000) & (bedbugs_df["# of Dwelling Units"] < 5000)]

nyc_map_url = ("https://raw.githubusercontent.com/qnzhou/practical_data_visualization_in_python/master/"
               "module_8_interactive_data_visualization/data/zip_code_040114.geojson")
nyc_map = gpd.read_file(nyc_map_url)
nyc_map = nyc_map.to_crs("EPSG:4326")

nyc_map["Postcode"] = nyc_map["ZIPCODE"].astype(int)
nyc_map.drop("ZIPCODE", axis=1, inplace=True)

bedbugs_df = pd.merge(bedbugs_df, nyc_map["Postcode"], on="Postcode")
bedbugs_df["Filing Date"] = pd.to_datetime(bedbugs_df["Filing Date"])

# precompute resources
cache = {}


def precompute():
    postcodes = bedbugs_df.groupby("Postcode").count()["Building ID"] < 5000
    cache["postcodes_lst"] = list(postcodes[postcodes].index)
    cache["postcodes"] = postcodes

    cache["infested_count_by_zip"] = pd.merge(
        nyc_map, bedbugs_df.groupby("Postcode")["Infested Dwelling Unit Count"].sum(), on="Postcode"
    )

    cache["bedbugs_count"] = bedbugs_df.groupby(pd.Grouper(key="Filing Date", freq="ME")).sum()[
        "Infested Dwelling Unit Count"]

    cache["bedbugs_count3"] = bedbugs_df.groupby([pd.Grouper(key="Filing Date", freq="ME"), "Borough"]).sum()[
        "Infested Dwelling Unit Count"].reset_index()


precompute()


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/graph1/{zipcode:int}")
async def get_graph_1(zipcode: int):
    if zipcode not in cache["postcodes_lst"]:  # display at large heat map
        plot = alt.Chart(cache["infested_count_by_zip"]).properties(
            width=850,
            height=800,
            title="Infested Dwelling Unit Heat Map by ZIP",
        ).mark_geoshape().encode(color="Infested Dwelling Unit Count:Q")
        return {"plot": plot.to_html()}

    interested_zip_map = nyc_map[nyc_map["Postcode"] == zipcode]
    bedbugs_in_zip = bedbugs_df[bedbugs_df["Postcode"] == zipcode]

    bedbugs_in_zip["Days since first filing"] = (
            bedbugs_in_zip["Filing Date"] - bedbugs_in_zip["Filing Date"].min()).dt.days

    duration_slider = alt.binding_range(min=0, max=bedbugs_in_zip["Days since first filing"].max(), step=1,
                                        name='Days since the first case was filed: ')
    duration_select = alt.param(value=0, bind=duration_slider)
    color = alt.condition(
        alt.datum['Days since first filing'] <= duration_select,
        alt.value("red"),
        alt.value('lightgray')
    )

    plot = (alt.Chart(interested_zip_map)
            .properties(
        width=850,
        height=800,
        title=f"Infested Dwelling Unit in {zipcode}"
    ).mark_geoshape())

    plot += (alt.Chart(bedbugs_in_zip)
             .encode(longitude="Longitude:Q", latitude="Latitude:Q", size="Infested Dwelling Unit Count:Q",
                     color=color)
             .mark_point(filled=True)
             .add_params(duration_select)
             )
    return {"plot": plot.to_html()}


@app.get("/graph1/eligible_zip")
async def eligible_zip():
    return {"zips": cache["postcodes_lst"]}


@app.get("/graph2/{zipcode:int}")
async def get_graph_2(zipcode: int):
    if zipcode not in cache["postcodes_lst"]:
        bedbugs_count = cache["bedbugs_count"]
    else:
        bedbugs_in_zip = bedbugs_df[bedbugs_df["Postcode"] == zipcode]
        bedbugs_count = bedbugs_in_zip.groupby(pd.Grouper(key="Filing Date", freq="ME")).sum()[
            "Infested Dwelling Unit Count"]

    bedbugs_count = bedbugs_count.reset_index()

    plot = alt.Chart(bedbugs_count).properties(
        width=850,
        height=800,
        title=f"Monthly Number of Infested Dwelling Unit in "
              f"{zipcode if zipcode in cache["postcodes_lst"] else "New York City"}"
    ).mark_bar().encode(
        alt.X("Filing Date:T"),
        alt.Y(
            "Infested Dwelling Unit Count:Q", title="Number of Infested Dwelling Units")
    )
    return {"plot": plot.to_html()}


@app.get("/graph3")
async def get_graph_3():
    plot = alt.Chart(cache["bedbugs_count3"]).properties(
        width=850,
        height=800,
        title=f"Monthly Number of Infested Dwelling Unit in Each Borough"
    ).mark_line().encode(
        x=alt.X("Filing Date:T"),
        y=alt.Y("Infested Dwelling Unit Count:Q",
                title="Number of Infested Dwelling Units"),
        color="Borough:N"
    )
    return {"plot": plot.to_html()}
