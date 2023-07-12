import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useAuthToken } from "../AuthTokenContext";

export default function AddWishlist({ trailId }) {

  const { accessToken } = useAuthToken();
  const { user, isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  console.log(trailId);


  return (
    <button className="heart" onClick={() => {
      if (!isLoading && !isAuthenticated) {
        loginWithRedirect();
        return;
      }
    
      if (!accessToken) {
        alert("Please login");
        return;
      }      
      
      fetch (`${process.env.REACT_APP_API_URL}/wishItems/${trailId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          },

        body: JSON.stringify({
          trail: { connect: { trailId } },
          author: { user },

          }),
        })
        .then((response) => response.json)
        .then((data) => {
          console.log(data);
          alert('Successfully added to wishlist')
        })
        .catch((error) => {
          console.log(error);
        });
    }}>Add to Wishlist</button>
  );
}






