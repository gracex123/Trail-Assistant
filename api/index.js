import * as dotenv from 'dotenv'
dotenv.config()
import express from "express";
import pkg from "@prisma/client";
import morgan from "morgan";
import cors from "cors";
import { auth } from  'express-oauth2-jwt-bearer'
import { Parser } from 'json2csv';
import axios from 'axios';
import cheerio from 'cheerio';

const requireAuth = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER,
  tokenSigningAlg: 'RS256'
});

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));


const { PrismaClient } = pkg;
const prisma = new PrismaClient();

app.get("/ping", (req, res) => {
  res.send("pong");
});

async function convertToCSV (res, fileName, fields, data) {
  try{
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(data);

    // Save the CSV file to the server or perform any other desired operations
    res.header('Content-Type', 'text/csv');
    res.attachment(fileName);
    return res.send(csv);
  } catch (err) {
    // Handle any errors that might occur during CSV conversion or sending the response
    console.error('Error converting to CSV:', err);
    res.status(500).send('Internal Server Error');
  }
};


app.get("/trail-comments/:amendedTrailTitle", async (req, res) => {
  try {
    const amendedTrailTitle = req.params.amendedTrailTitle;
    const url = `https://www.vancouvertrails.com/trails/${amendedTrailTitle}/comments/`;

    const response = await axios.get(url);

    if (!response.ok) throw new Error('Error scraping the trail website.');
    const html = response.data;
    const $ = cheerio.load(html);

    const ratingContainer = $('.overall_rating span');

    if (!ratingContainer.ok) throw new Error('Rating information not found.');

    const ratingInfo = ratingContainer.text().trim();
    const ratingInfoArray = ratingInfo.split(' ');
    const rating = ratingInfoArray[0];
    const totalReviews = ratingInfoArray[ratingInfoArray.length - 1];

    const result = {
      rating: rating.toString(),
      reviewCount: totalReviews,
    };
    res.json(result);

  } catch (err) {
    console.log(`${err}`);
    res.status(500).json({ error: 'Unable to fetch trail data.' });
  }
});



async function scrapeRatings(trailTitle) {
  try {
    let amendedTitles = "";
    if (trailTitle === "Al's Habrich Ridge Trail") {
      amendedTitles = "als-habrich-ridge-trail";
    } else {
      const title = trailTitle.toLowerCase().replace(/\s/g, "-")
      const titleWithoutQuote = title.replace(/'/g, "");
      amendedTitles = titleWithoutQuote;
    }      
    const url = `https://www.vancouvertrails.com/trails/${amendedTitles}/comments/`;

    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const ratingContainer = $('.overall_rating span');

    if (ratingContainer) {
      const ratingInfo = ratingContainer.text().trim();
      const ratingInfoArray = ratingInfo.split(' ');
      const rating = ratingInfoArray[0];
      const result = rating.toString();
      return result;
    } else {
      console.log('Rating information not found.');
      throw new Error('Rating information not found.');
    } 
  } catch (err) {
    console.log(`An error occurred while fetching trail data: ${err}`);
    throw new Error('Unable to fetch trail data.');
  }
}

async function getTrail(wishItem) {
  try {
    const trail = await prisma.trailItem.findUnique({
      where: {
        id: wishItem.trailId,
      },
    })
    return trail;
  } catch (err) {
    console.error(err);
  }
}


async function extractWishTrailData (wishItemsList, fields) {
  //Use Promise.all() to await all the asynchronous tasks inside the map() function.
  const data = await Promise.all(wishItemsList.map(async (item) => {
    try {
      const trail = await getTrail(item);
      
      if (!trail) throw new Error ('Trail item not found.')
      const rating = await scrapeRatings(trail.trailTitle);
      
      if (!rating) throw new Error ('Trail rating not scraped.')

      const extractedData = {[fields[0]]: trail.id, 
        [fields[1]]: trail.difficulty, 
        [fields[2]]: trail.publicTransit,
        [fields[3]]: trail.dogFriendly,
        [fields[4]]: trail.camping,
        [fields[5]]: rating,
        [fields[6]]: trail.trailTitle,};
      
      console.log(extractedData);
      return extractedData;

    } catch (err) {
      console.error( `Error in extracting trail data`);
    }
  }));
  return data.filter(item => item !== null);
}

//get a csv file of a specific user's wishlist data
app.get("/csv/:auth0id", async (req, res) => {
  try {
    //const auth0Id = req.auth.payload.sub;
    const auth0id = "auth0|" + req.params.auth0id;
    const user = await prisma.user.findUnique({
      where: {
        auth0Id: auth0id,
      },
    });
    
    if (!user) throw new Error ('User not found.')
    const wishItemsList = await prisma.wishItem.findMany({
      where: {
        authorId: user.id,
      },
    });
   
    if (!wishItemsList) throw new Error ('Wish items not found.')
    const fields = ["id", "difficulty", "publicTransit", "dogFriendly", "camping", "rating", "trailTitle"];
    const data = await extractWishTrailData(wishItemsList, fields);
    if (!data) throw new Error ('Error in extracting trail data.')

    const csvFile = await convertToCSV(res, "wishlist.csv", fields, data);
    return csvFile;
    
  } catch (err) {
    console.error('Error retrieving fields:', err);
    res.status(500).send('Error retrieving fields');
  }
})


async function extractTrailData (trailList, fields) {
  //Use Promise.all() to await all the asynchronous tasks inside the map() function.
  const data = await Promise.all(trailList.map(async (trail) => {
    try {
      const rating = await scrapeRatings(trail.trailTitle);
      
      if (!rating) throw new Error ('Trail rating not scraped.')

      const extractedData = {[fields[0]]: trail.id, 
        [fields[1]]: trail.difficulty, 
        [fields[2]]: trail.publicTransit,
        [fields[3]]: trail.dogFriendly,
        [fields[4]]: trail.camping,
        [fields[5]]: rating,
        [fields[6]]: trail.trailTitle,};
      
      console.log(extractedData);
      return extractedData;

    } catch (err) {
      console.error( `Error in extracting trail data`);
    }
  }));
  return data.filter(item => item !== null);
}


//get a csv file of all trails' data
app.get("/csv_all", async (req, res) => {
  try {

    const trailList = await prisma.trailItem.findMany();
    if (!trailList) throw new Error ('Trail items not found.')

    const fields = ["id", "difficulty", "publicTransit", "dogFriendly", "camping", "rating", "trailTitle"];
    const data = await extractTrailData(trailList, fields);
    if (!data) throw new Error ('Error in extracting trail data.')

    const csvFile = await convertToCSV(res, "traillist.csv", fields, data);
    return csvFile;
    
  } catch (err) {
    console.error('Error retrieving fields:', err);
    res.status(500).send('Error retrieving fields');
  }
})

//Get all trails
app.get("/trails/all", async (req, res) => {
  const allTrails = await prisma.trailItem.findMany();
  res.status(200).json(allTrails);
});


//Get trail details based on trailId
app.get("/trails/:id", async (req, res) => {
  const trailId = req.params.id;
  if (!trailId) {
    res.status(401).send('incorrect input values')
  }

  const trailDetails = await prisma.trailItem.findUnique({
    where: {
      id: trailId
    },
  });
  res.status(200).json(trailDetails); 
});


app.get("/check-wishItem/:id", requireAuth, async (req, res) => {
  const id = req.params.id;
  const auth0Id = req.auth.payload.sub;

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  let existWishItem = await prisma.wishItem.count({ 
    where: {
      trailId: id,
      authorId: user.id,
    }
  })
  res.json(existWishItem);

})

//Create new wishItem by the trailId and userId, first check if the wishItem already exists
//the parameter is trailId
app.post("/wishItems/:id", requireAuth, async (req, res) => {
  const id = req.params.id;
  const auth0Id = req.auth.payload.sub;

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  let existWishItem = await prisma.wishItem.count({ 
    where: {
      trailId: id,
      authorId: user.id,
    }
  })

  if(existWishItem!==0){
    res.status(400).send("The trailItem has already been added to the wishlist");
  } else {
    const newItem = await prisma.wishItem.create({
    data: {
      trail: { connect: { id } },
      author: { connect: {auth0Id} },
    },
  });
  
      res.status(201).json(newItem);
  }
  })

app.get("/users/all", async(req, res) => {
  const users = await prisma.user.findMany();

  res.json(users);
})


//Get all wishitems by the userId
app.get("/wishitems", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  
  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  const wishItems = await prisma.wishItem.findMany({
    where: {
      authorId: user.id,
    },
  });

  res.json(wishItems);

});


// Update a wishitem by the trailId and userId
app.put("/wishitems/:id", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  
  const id = req.params.id;
  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  const existingWishItem = await prisma.wishItem.findFirst({
    where: {
      authorId: user.id,
      trailId: id
    }
  });

  const { memo } = req.body;
  if (existingWishItem) {
    const updatedItem = await prisma.wishItem.update({
      where: {
        id: existingWishItem.id
      },
      data: {
        memo: memo
      },
    });
    res.json(updatedItem);
  }

});

// Delete a wishItem by the trailId and userId
app.delete("/wishItems/:id", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const id = req.params.id;
  console.log(auth0Id)

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  const existingWishItem = await prisma.wishItem.findFirst({
    where: {
      authorId: user.id,
      trailId: id
    }
  });

  if (existingWishItem) {
    const deletedItem = await prisma.wishItem.delete({
      where: {
        id: existingWishItem.id
      },
    });
    res.json(deletedItem);
  }
});

// Get a wishItem by trailid and userId
app.get("/wishItems/:id", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const id = req.params.id;

  console.log(auth0Id)

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  const wishItem = await prisma.wishItem.findUnique({
    where: {
      authorId: user.id,
      trailId: id,
    },
  });

  res.json(wishItem);
});



// get Profile information of authenticated user
app.get("/me", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  res.json(user);
});

// verify user status, if not registered in our database we will create it
app.post("/verify-user", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const email = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/email`];
  const name = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/name`];

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  if (user) {
    res.json(user);
  } else {
    const newUser = await prisma.user.create({
      data: {
        email,
        auth0Id,
        name,
      },
    });

    res.json(newUser);
  }
});

app.listen(8000, () => {
  console.log("Server running on http://localhost:8000 🎉 🚀");
});
