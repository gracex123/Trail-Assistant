import "../style/home.css";

import React, {useState, useEffect} from 'react'
import {Link} from 'react-router-dom'
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import headImage from "./sea to sky gondola 6.jpg"
import discoverImage from "./sea to sky gondola 2.jpg"
import brandImage from "./GVT icon.png"


export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const [userCounts, setUserCounts] = useState(0);
  const signUp = () => loginWithRedirect({ screen_hint: "signup" });

  useEffect(() => {
    async function getUserCountsFromApi() {
      const data = await fetch(`${process.env.REACT_APP_API_URL}/users/all`, {
      });
      const users = await data.json();
      
      const userCounts = users.length;
      console.log(userCounts);
      setUserCounts(userCounts);
    }
    getUserCountsFromApi();
  }, []);

  return (
    <div className="home">
      
      <div className="container-fluid-height container-fluid-width">
        <img alt="brandImage" className="brandImage" src={brandImage} />
        <h1>Greater Vancouver Trails | Discover the perfect trail</h1>
        <img alt="headImage2" className="headImage2" src={headImage} />
        <h2>PREPARING FOR YOUR NEXT ADVENTURE? </h2>
        
        <br></br>
        <div className="twoButtons">
          {!isAuthenticated ? (
            <button className="btn-primary" onClick={loginWithRedirect}>
              Login
            </button>
          ) : (
            <button className="btn-primary" onClick={() => navigate("/app")}>
              Enter App
            </button>
          )}
          <br></br>
          <button className="btn-secondary" onClick={signUp}>
            Create Account
          </button>
          <h3>Up till now, {userCounts} users have registered!</h3>
          <br></br>
        </div>
        <div className='discoverBox'>
          <h2>DISCOVER NEW TRAILS:</h2> 
          <Link to = {`/trails`} > 
            <img  src={discoverImage} alt="discoverImage" className='discoverImage' />
          </Link> 
                   
        </div>
      </div>
    </div>
  );
}
