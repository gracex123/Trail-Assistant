import "../style/trailItem.css";

import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Link, useParams } from "react-router-dom";
import AddWishlist from "./AddWishlist";
import useImages from '../hooks/useImages';
import { useAuthToken } from "../AuthTokenContext";

export default function TrailDetail() {
  let { trailId } = useParams();
  const { accessToken } = useAuthToken();

  const [detailProps, setDetailProps] = useState({});
  const [wishItemExisted, setWishItemExisted] = useState(0);

  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };


  //get trailItem by trailId
  useEffect(() => {
    if (!trailId){
      return;
    }

    fetch(`${process.env.REACT_APP_API_URL}/trails/${trailId}`, {
      method: "GET",
      })
      .then((response) => response.json())
      .then((data) => {
        setDetailProps(data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
    }, [trailId]); 


  const [images] = useImages(detailProps);

  //check wishItem exisitence
  useEffect(() => {
    if (!trailId){
      return;
    }

    fetch(`${process.env.REACT_APP_API_URL}/check-wishItem/${trailId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => response.json())
      .then((data) => {
        setWishItemExisted(data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
    }, [accessToken]); 


  return (
    <div className="wholePage">
      <Link to={`/trails`}>
        <button onClick={goBack} className="backButton">Back</button>
      </Link>
      <div className="trailDetail">
        
        <h3 className='trailDetailTitle'> {detailProps.trailTitle}</h3>
        {wishItemExisted === 0 && <AddWishlist trailId={trailId}/>}

        <ul className="trailInfo">
          <li>Region: {detailProps.region}</li>
          <li>Difficulty: {detailProps.difficulty}</li>
          <li>Time: {detailProps.time}</li>
          <li>Round-Trip: {detailProps.tripTime} km</li>
          <li>Season: {detailProps.season}</li>
          <li>Is camping allowed: {detailProps.camping ? 'Yes' : 'No'}</li>
          <li>Is dog friendly: {detailProps.dogFriendly ? 'Yes' : 'No'}</li>
          <li>Is public transit accessible: {detailProps.publicTransit ? 'Yes' : 'No'}</li>
          <li>Image Link: {images}</li>
        </ul>
        <a href={images} target="_blank" rel="noopener noreferrer">
          View Image
        </a>


      </div>
    </div>
  );
}






