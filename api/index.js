import * as dotenv from 'dotenv'
dotenv.config()
import express from "express";
import pkg from "@prisma/client";
import morgan from "morgan";
import cors from "cors";
import { auth } from  'express-oauth2-jwt-bearer'

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

// Enable CORS middleware
//app.use((req, res, next) => {
  //res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  //res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  //res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  //next();
//});

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

app.get("/ping", (req, res) => {
  res.send("pong");
});


//Get trail image link from external api
app.get("/images/:title", async (req, res) => {
  try {
    const trailTitle = req.params.title;
    if (!trailTitle) {
      res.status(401).send('incorrect input values')
    }

    const response = await fetch(`https://api.bing.microsoft.com/v7.0/images/search?q=${trailTitle}`, {
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': '8e6202051d0749fea9929b551b6d0a84',
        },
    });
    const data = await response.json();
    const url = data.value[0].webSearchUrl;
    res.json({ url });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});


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


//Get all wishitems by th userId
app.get("/wishitems", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;

  console.log(auth0Id)

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
