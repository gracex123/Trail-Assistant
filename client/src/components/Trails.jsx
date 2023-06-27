import "../style/trails.css";

import React, {useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom';
import {Link} from 'react-router-dom'

export default function Trails() {

  const [trailProps, setTrailProps] = useState([]);

  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/trails/all`, {
      method: "GET",
    })
    .then(response =>{
      if(response.ok) {
        return response.json();
      }
      throw response;
    })
    .then(data => {
      setTrailProps(data);
    })
  }, []); 



  return (
    <div className="wholePage">
        <Link to={`/`}>
          <button onClick={goBack} className="backButton">Back</button>
        </Link>
      <div className="allTrails">
       
        {trailProps.map((item) => (
            <div key={item.id} className="box1-5"> 
                <h3>{item.trailTitle} -- {item.region}</h3>
                <Link to = {`/trails/${item.id}`} >
                  <button className="detailButton">Details</button>  
                </Link> 
            </div>
          ))}


      </div>
    </div>
  );
}


