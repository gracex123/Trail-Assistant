'''
This is a recommendation engine with collaborative filtering that suggests trails based on users' wish lists
'''

import requests
import pandas as pd

BOOLEAN_COLMUNS = ['camping', 'publicTransit', 'dogFriendly']
CATEGORICAL_COLUMNS = ['difficulty']
WISHLIST_PATH = 'wishlist.csv'
TRAILLIST_PATH = 'traillist.csv'

# read the file and load data into a pandas DataFrame
def load_file(url, pathname):
    response = requests.get(url)
    with open(pathname, 'wb') as file:
        file.write(response.content)
    df = pd.read_csv(pathname)
    return df

# convert categorical variables to binary representation
def encode_data_frame(df):
    df_encoded = pd.get_dummies(df, columns = CATEGORICAL_COLUMNS)
    df_encoded[BOOLEAN_COLMUNS] = df_encoded[BOOLEAN_COLMUNS].astype(int)
    return df_encoded

# get the pattern based on users' wish list
def get_pattern(df, row_counts):
    pattern_dict = {}
    difficulty_count = 0
    difficulty_level = ""
    # Calculate the sum of all columns in a Pandas Dataframe
    for column in df.columns:
        if column in BOOLEAN_COLMUNS:
            score = df[column].sum() / row_counts
            pattern_dict[column] = 1 if score > 0.5 else 0
            
        elif (column == "difficulty_Easy" or column == "difficulty_Intermediate" or column == "difficulty_Difficult"):
            if df[column].sum() > difficulty_count:
                difficulty_count, difficulty_level = df[column].sum(), column 

    pattern_dict[difficulty_level] = 1
    return pattern_dict
  

# calculate similarity scores of each trail using simple matching coefficient 
def calculate_simple_matching_coefficient(pattern_dict, df):
    smc = {}
    denominator = len(pattern_dict)
    for i in range(len(df)):
        numerator = 0
        for property in pattern_dict:
            if df[property].values[i] == pattern_dict[property]:
                numerator += 1
        print(numerator)
        rating, trail_title = df["rating"].values[i], df["id"].values[i]
        smc[trail_title] = [numerator / denominator, rating]
    return smc


# sort trails based on smc and its rating
def sort_trails_based_on_smc_and_rating(smc, df):
    sorted_items = sorted(smc.items(), key=lambda item: (item[1][0], item[1][1]), reverse=True)
    items_to_remove = df["id"].tolist()
    sorted_items = [item for item in sorted_items if item[0] not in items_to_remove]
    return sorted_items

# get the top five trails
def top_trails(sorted_items):
    return dict(sorted_items[:5])


def recommend_trails():
    pd.set_option('display.max_columns', None)
    df_wish_list = load_file('http://localhost:8000/csv/649b827a9c26b18e1266d1c6', WISHLIST_PATH)
    df_wish_list_encoded = encode_data_frame(df_wish_list)
    row_counts = len(df_wish_list_encoded)
    pattern_dict = get_pattern(df_wish_list_encoded, row_counts)

    df_trail_list = load_file('http://localhost:8000/csv_all', TRAILLIST_PATH)
    df_trail_list_encoded = encode_data_frame(df_trail_list)

    smc = calculate_simple_matching_coefficient(pattern_dict, df_trail_list_encoded)
    sorted_trails = sort_trails_based_on_smc_and_rating(smc, df_wish_list_encoded)
    res = top_trails(sorted_trails)
    return res
    
'''
def main():
    res = recommend_trails()
    print(res)

if __name__ == "__main__":
    main()

'''
    

 

